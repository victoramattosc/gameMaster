-- Rode no SQL Editor depois da 0001/0002.
--
-- 1) Jogadores recebiam 400 ao abrir mapas/livros/arquivos compartilhados: na policy de leitura
--    do Storage, o `name` dentro do subselect era resolvido como `mesa_files.name` (nome do
--    arquivo) e não como o caminho do objeto, então a comparação nunca batia.
-- 2) Upload de retrato dava "new row violates row-level security policy": faltava a policy de
--    leitura do dono no bucket `portraits` (o Storage precisa dela para gravar/sobrescrever).
-- 3) Mestre pode entregar um arquivo a jogadores específicos (como os itens do baú).

-- ───────────────────────── arquivos entregues a jogadores ─────────────────────────
alter table public.mesa_files add column if not exists given_to uuid[] not null default '{}';

drop policy if exists "arquivos: membros veem livros e compartilhados" on public.mesa_files;
create policy "arquivos: membros veem livros e compartilhados" on public.mesa_files
  for select using (public.is_member(mesa_id) and (shared or kind = 'book' or auth.uid() = any (given_to)));

create or replace function public.give_file(p_file uuid, p_user uuid, p_give boolean default true)
returns void language plpgsql security definer set search_path = public as $$
declare f mesa_files; m mesas;
begin
  select * into f from mesa_files where id = p_file;
  if f.id is null or not is_gm(f.mesa_id) then raise exception 'Sem permissão'; end if;
  if not exists (select 1 from mesa_members where mesa_id = f.mesa_id and user_id = p_user and role = 'player') then
    raise exception 'Jogador não está na mesa';
  end if;
  if p_give then
    if p_user = any (f.given_to) then return; end if;
    update mesa_files set given_to = array_append(given_to, p_user) where id = p_file;
    select * into m from mesas where id = f.mesa_id;
    perform notify(p_user, case when f.kind = 'map' then 'map' else 'file' end,
      case when f.kind = 'map' then 'Você recebeu um mapa' else 'Você recebeu um arquivo' end,
      'O mestre de “' || m.name || '” te entregou: ' || f.name || '.',
      jsonb_build_object('mesa_id', f.mesa_id, 'file_id', f.id));
  else
    update mesa_files set given_to = array_remove(given_to, p_user) where id = p_file;
  end if;
end $$;

grant execute on function public.give_file(uuid, uuid, boolean) to authenticated;

-- ───────────────────────── Storage: leitura de arquivos da mesa ─────────────────────────
drop policy if exists "mesa-files: leitura" on storage.objects;
create policy "mesa-files: leitura" on storage.objects for select to authenticated
  using (bucket_id = 'mesa-files' and (
    public.is_gm(((storage.foldername(storage.objects.name))[1])::uuid)
    or exists (
      select 1 from public.mesa_files f
      where f.path = storage.objects.name
        and (f.shared or f.kind = 'book' or auth.uid() = any (f.given_to))
        and public.is_member(f.mesa_id))));

-- ───────────────────────── Storage: retratos ─────────────────────────
drop policy if exists "portraits: dono lê" on storage.objects;
create policy "portraits: dono lê" on storage.objects for select to authenticated
  using (bucket_id = 'portraits' and (storage.foldername(name))[1] = auth.uid()::text);
