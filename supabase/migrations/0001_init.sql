-- Game Master — schema inicial (Supabase / Postgres)
-- Rode no SQL Editor do Supabase (ou `supabase db push`).
-- Modelo:
--   profiles          perfil público de cada conta (criado por trigger no cadastro)
--   mesas             uma mesa de jogo (dono = mestre)
--   mesa_members      quem está na mesa e com qual papel (gm | player)
--   invites           convites pendentes/respondidos
--   characters        ficha COMPLETA do jogador (privada: só o dono lê/escreve)
--   character_status  status público (vida, recursos, defesa, condições) — o mestre vê
--   gm_state          estado privado do painel do mestre (iniciativa, criaturas, notas, música…)
--   chest_items       baú do mestre (itens podem ser entregues a um jogador)
--   mesa_files        arquivos da mesa (livros, mapas, handouts) no Storage
--   notifications     avisos por usuário

create extension if not exists pgcrypto;

-- ───────────────────────── profiles ─────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Aventureiro',
  username     text unique,
  email        text,
  color        text not null default '#e0a040',
  dice_anim    boolean not null default true,
  created_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_name text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1));
  uname text := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)), '[^a-zA-Z0-9_.]', '', 'g'));
  inv record;
begin
  if uname = '' or exists (select 1 from public.profiles where username = uname) then
    uname := uname || '_' || substr(replace(new.id::text, '-', ''), 1, 4);
  end if;
  insert into public.profiles (id, display_name, username, email)
  values (new.id, base_name, uname, new.email);
  -- Convites feitos por e-mail antes de a pessoa ter conta passam a ser dela.
  for inv in
    update public.invites set invitee_id = new.id
    where invitee_id is null and status = 'pending' and lower(invitee_label) = lower(new.email)
    returning *
  loop
    insert into public.notifications (user_id, kind, title, body, data)
    select new.id, 'invite', 'Convite para “' || m.name || '”', p.display_name || ' te chamou para jogar.',
           jsonb_build_object('invite_id', inv.id, 'mesa_id', m.id)
    from public.mesas m join public.profiles p on p.id = inv.invited_by where m.id = inv.mesa_id;
  end loop;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── mesas ─────────────────────────
create table public.mesas (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 120),
  system         text not null check (system in ('dnd', 'op', 'op2', 'custom')),
  invite_code    text not null unique,
  seats          int  not null default 5 check (seats between 1 and 20),
  status         text not null default 'montando' check (status in ('montando', 'proxima', 'em_sessao')),
  next_session   text not null default 'A combinar',
  session_number int  not null default 0,
  show_status    boolean not null default true,
  custom_schema  jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create table public.mesa_members (
  mesa_id   uuid not null references public.mesas (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null check (role in ('gm', 'player')),
  joined_at timestamptz not null default now(),
  primary key (mesa_id, user_id)
);
create index on public.mesa_members (user_id);

create or replace function public.is_member(m uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from mesa_members where mesa_id = m and user_id = auth.uid());
$$;

create or replace function public.is_gm(m uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from mesa_members where mesa_id = m and user_id = auth.uid() and role = 'gm');
$$;

create or replace function public.shares_mesa(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from mesa_members a join mesa_members b on a.mesa_id = b.mesa_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

-- ───────────────────────── invites ─────────────────────────
create table public.invites (
  id            uuid primary key default gen_random_uuid(),
  mesa_id       uuid not null references public.mesas (id) on delete cascade,
  invited_by    uuid not null references public.profiles (id) on delete cascade,
  invitee_label text not null,
  invitee_id    uuid references public.profiles (id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz not null default now()
);
create index on public.invites (invitee_id);

-- ───────────────────────── fichas ─────────────────────────
create table public.characters (
  id         uuid primary key default gen_random_uuid(),
  mesa_id    uuid not null references public.mesas (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  sheet      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (mesa_id, user_id)
);

create table public.character_status (
  character_id uuid primary key references public.characters (id) on delete cascade,
  mesa_id      uuid not null references public.mesas (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  name         text not null default '',
  role_line    text not null default '',
  color        text not null default '#8a6a2e',
  portrait_url text,
  defense      int,
  resources    jsonb not null default '[]'::jsonb, -- [{key,label,cur,max,color}]
  conditions   text[] not null default '{}',
  updated_at   timestamptz not null default now()
);
create index on public.character_status (mesa_id);

-- ───────────────────────── mestre ─────────────────────────
create table public.gm_state (
  mesa_id    uuid primary key references public.mesas (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.chest_items (
  id         uuid primary key default gen_random_uuid(),
  mesa_id    uuid not null references public.mesas (id) on delete cascade,
  name       text not null,
  category   text not null default 'Item',
  note       text not null default '',
  given_to   uuid references public.profiles (id) on delete set null,
  claimed    boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.chest_items (mesa_id);

create table public.mesa_files (
  id          uuid primary key default gen_random_uuid(),
  mesa_id     uuid not null references public.mesas (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  name        text not null,
  mime        text not null default '',
  path        text not null unique,
  kind        text not null default 'file' check (kind in ('file', 'book', 'map')),
  shared      boolean not null default false,
  meta        jsonb not null default '{}'::jsonb, -- mapas: {pointers:[{id,x,y,label,color}]} · livros: {pages, toc:[[titulo,pagina]]}
  created_at  timestamptz not null default now()
);
create index on public.mesa_files (mesa_id);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null, -- invite | map | session | join | item | file
  title      text not null,
  body       text not null default '',
  data       jsonb not null default '{}'::jsonb,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

-- ───────────────────────── RLS ─────────────────────────
alter table public.profiles         enable row level security;
alter table public.mesas            enable row level security;
alter table public.mesa_members     enable row level security;
alter table public.invites          enable row level security;
alter table public.characters       enable row level security;
alter table public.character_status enable row level security;
alter table public.gm_state         enable row level security;
alter table public.chest_items      enable row level security;
alter table public.mesa_files       enable row level security;
alter table public.notifications    enable row level security;

create policy "perfil: eu ou quem divide mesa" on public.profiles
  for select using (id = auth.uid() or public.shares_mesa(id));
create policy "perfil: editar o meu" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "mesa: membros leem" on public.mesas
  for select using (public.is_member(id) or exists (
    select 1 from public.invites i where i.mesa_id = id and i.invitee_id = auth.uid() and i.status = 'pending'));
create policy "mesa: mestre edita" on public.mesas
  for update using (public.is_gm(id)) with check (public.is_gm(id));
create policy "mesa: mestre apaga" on public.mesas
  for delete using (owner_id = auth.uid());

create policy "membros: membros leem" on public.mesa_members
  for select using (public.is_member(mesa_id));
create policy "membros: mestre remove ou eu saio" on public.mesa_members
  for delete using ((public.is_gm(mesa_id) and role = 'player') or (user_id = auth.uid() and role = 'player'));

create policy "convites: mestre ou convidado leem" on public.invites
  for select using (public.is_gm(mesa_id) or invitee_id = auth.uid());
create policy "convites: mestre apaga" on public.invites
  for delete using (public.is_gm(mesa_id));

create policy "ficha: só o dono" on public.characters
  for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_member(mesa_id));

create policy "status: membros leem" on public.character_status
  for select using (public.is_member(mesa_id));
create policy "status: dono grava" on public.character_status
  for insert with check (user_id = auth.uid() and public.is_member(mesa_id));
create policy "status: dono ou mestre atualiza" on public.character_status
  for update using (user_id = auth.uid() or public.is_gm(mesa_id));
create policy "status: dono apaga" on public.character_status
  for delete using (user_id = auth.uid());

create policy "gm_state: só o mestre" on public.gm_state
  for all using (public.is_gm(mesa_id)) with check (public.is_gm(mesa_id));

create policy "baú: mestre tudo" on public.chest_items
  for all using (public.is_gm(mesa_id)) with check (public.is_gm(mesa_id));
create policy "baú: jogador vê o que recebeu" on public.chest_items
  for select using (given_to = auth.uid());
create policy "baú: jogador marca como pego" on public.chest_items
  for update using (given_to = auth.uid()) with check (given_to = auth.uid());

create policy "arquivos: mestre tudo" on public.mesa_files
  for all using (public.is_gm(mesa_id)) with check (public.is_gm(mesa_id) and uploaded_by = auth.uid());
create policy "arquivos: membros veem livros e compartilhados" on public.mesa_files
  for select using (public.is_member(mesa_id) and (shared or kind = 'book'));

create policy "notificações: só as minhas" on public.notifications
  for select using (user_id = auth.uid());
create policy "notificações: marcar lidas" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notificações: apagar" on public.notifications
  for delete using (user_id = auth.uid());

-- ───────────────────────── funções (RPC) ─────────────────────────
create or replace function public.make_invite_code(base text)
returns text language plpgsql set search_path = public as $$
declare
  -- Sem 0/O/1/I/L para não confundir ao ditar o código. Não depende do pgcrypto
  -- (no Supabase ele fica no schema "extensions", fora do search_path das funções).
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  prefix text := upper(substr(regexp_replace(public.unaccent_safe(base), '[^A-Za-z]', '', 'g'), 1, 5));
  code text;
begin
  if prefix = '' then prefix := 'MESA'; end if;
  loop
    code := prefix || '-';
    for i in 1..4 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.mesas where invite_code = code);
  end loop;
  return code;
end $$;

create or replace function public.unaccent_safe(t text)
returns text language sql immutable as $$
  select translate(coalesce(t, ''), 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC');
$$;

create or replace function public.notify(uid uuid, k text, t text, b text, d jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into notifications (user_id, kind, title, body, data) values (uid, k, t, b, d);
$$;
revoke execute on function public.notify(uuid, text, text, text, jsonb) from public, anon, authenticated;

create or replace function public.create_mesa(p_name text, p_system text, p_seats int default 5,
  p_show_status boolean default true, p_custom_schema jsonb default '{}'::jsonb)
returns public.mesas language plpgsql security definer set search_path = public as $$
declare m mesas;
begin
  if auth.uid() is null then raise exception 'Faça login para criar uma mesa'; end if;
  insert into mesas (owner_id, name, system, invite_code, seats, show_status, custom_schema)
  values (auth.uid(), p_name, p_system, make_invite_code(p_name), p_seats, p_show_status, coalesce(p_custom_schema, '{}'::jsonb))
  returning * into m;
  insert into mesa_members (mesa_id, user_id, role) values (m.id, auth.uid(), 'gm');
  insert into gm_state (mesa_id) values (m.id);
  return m;
end $$;

create or replace function public.player_count(m uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from mesa_members where mesa_id = m and role = 'player';
$$;

create or replace function public.invite_player(p_mesa uuid, p_who text)
returns public.invites language plpgsql security definer set search_path = public as $$
declare
  inv invites; target uuid; m mesas; me profiles;
begin
  if not is_gm(p_mesa) then raise exception 'Só o mestre pode convidar'; end if;
  select * into m from mesas where id = p_mesa;
  select * into me from profiles where id = auth.uid();
  select id into target from profiles
    where lower(email) = lower(trim(p_who)) or lower(username) = lower(trim(leading '@' from trim(p_who))) limit 1;
  if target is not null and exists (select 1 from mesa_members where mesa_id = p_mesa and user_id = target) then
    raise exception 'Essa pessoa já está na mesa';
  end if;
  if exists (select 1 from invites where mesa_id = p_mesa and status = 'pending'
             and (invitee_id = target or lower(invitee_label) = lower(trim(p_who)))) then
    raise exception 'Já existe um convite pendente para essa pessoa';
  end if;
  insert into invites (mesa_id, invited_by, invitee_label, invitee_id)
  values (p_mesa, auth.uid(), trim(p_who), target) returning * into inv;
  if target is not null then
    perform notify(target, 'invite', 'Convite para “' || m.name || '”',
      me.display_name || ' te chamou para jogar.', jsonb_build_object('invite_id', inv.id, 'mesa_id', p_mesa));
  end if;
  return inv;
end $$;

create or replace function public.add_player(p_mesa uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare m mesas; who profiles;
begin
  select * into m from mesas where id = p_mesa;
  if m.id is null then raise exception 'Mesa não encontrada'; end if;
  if exists (select 1 from mesa_members where mesa_id = p_mesa and user_id = p_user) then return; end if;
  if player_count(p_mesa) >= m.seats then raise exception 'A mesa está cheia'; end if;
  insert into mesa_members (mesa_id, user_id, role) values (p_mesa, p_user, 'player');
  update invites set status = 'accepted' where mesa_id = p_mesa and invitee_id = p_user and status = 'pending';
  select * into who from profiles where id = p_user;
  perform notify(m.owner_id, 'join', who.display_name || ' entrou na sua mesa',
    'Já pode montar a ficha em “' || m.name || '”.', jsonb_build_object('mesa_id', p_mesa));
end $$;
revoke execute on function public.add_player(uuid, uuid) from public, anon, authenticated;

create or replace function public.respond_invite(p_invite uuid, p_accept boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv invites;
begin
  select * into inv from invites where id = p_invite and invitee_id = auth.uid() and status = 'pending';
  if inv.id is null then raise exception 'Convite não encontrado'; end if;
  if p_accept then
    perform add_player(inv.mesa_id, auth.uid());
  else
    update invites set status = 'declined' where id = p_invite;
  end if;
  update notifications set read = true where user_id = auth.uid() and data ->> 'invite_id' = p_invite::text;
  return inv.mesa_id;
end $$;

create or replace function public.join_by_code(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare m mesas;
begin
  if auth.uid() is null then raise exception 'Faça login para entrar na mesa'; end if;
  select * into m from mesas where invite_code = upper(trim(p_code));
  if m.id is null then raise exception 'Código de convite inválido'; end if;
  perform add_player(m.id, auth.uid());
  return m.id;
end $$;

create or replace function public.give_chest_item(p_item uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare it chest_items; m mesas;
begin
  select * into it from chest_items where id = p_item;
  if it.id is null or not is_gm(it.mesa_id) then raise exception 'Sem permissão'; end if;
  if not exists (select 1 from mesa_members where mesa_id = it.mesa_id and user_id = p_user and role = 'player') then
    raise exception 'Jogador não está na mesa';
  end if;
  select * into m from mesas where id = it.mesa_id;
  update chest_items set given_to = p_user, claimed = false where id = p_item;
  perform notify(p_user, 'item', 'Você recebeu: ' || it.name,
    'O mestre de “' || m.name || '” te entregou um item. Ele aparece no inventário da sua ficha.',
    jsonb_build_object('mesa_id', it.mesa_id, 'item_id', p_item));
end $$;

create or replace function public.share_file(p_file uuid, p_shared boolean)
returns void language plpgsql security definer set search_path = public as $$
declare f mesa_files; m mesas; r record;
begin
  select * into f from mesa_files where id = p_file;
  if f.id is null or not is_gm(f.mesa_id) then raise exception 'Sem permissão'; end if;
  update mesa_files set shared = p_shared where id = p_file;
  if p_shared and not f.shared then
    select * into m from mesas where id = f.mesa_id;
    for r in select user_id from mesa_members where mesa_id = f.mesa_id and role = 'player' loop
      perform notify(r.user_id, case when f.kind = 'map' then 'map' else 'file' end,
        case when f.kind = 'map' then 'Novo mapa na mesa' else 'Novo arquivo na mesa' end,
        'O mestre de “' || m.name || '” compartilhou: ' || f.name || '.',
        jsonb_build_object('mesa_id', f.mesa_id, 'file_id', f.id));
    end loop;
  end if;
end $$;

create or replace function public.set_session(p_mesa uuid, p_status text, p_next text default null)
returns void language plpgsql security definer set search_path = public as $$
declare m mesas; r record;
begin
  if not is_gm(p_mesa) then raise exception 'Só o mestre muda a sessão'; end if;
  select * into m from mesas where id = p_mesa;
  update mesas set status = p_status,
    session_number = case when p_status = 'em_sessao' and m.status <> 'em_sessao' then session_number + 1 else session_number end,
    next_session = coalesce(p_next, next_session)
  where id = p_mesa;
  if p_next is not null and p_next is distinct from m.next_session then
    for r in select user_id from mesa_members where mesa_id = p_mesa and role = 'player' loop
      perform notify(r.user_id, 'session', 'Sessão marcada', '“' || m.name || '” · ' || p_next || '.', jsonb_build_object('mesa_id', p_mesa));
    end loop;
  end if;
end $$;

-- Lobby: minhas mesas com contagem de jogadores (sem expor perfis de quem não divide mesa)
create or replace function public.my_mesas()
returns table (id uuid, name text, system text, role text, status text, next_session text, seats int,
               player_count int, players jsonb, invite_code text, session_number int)
language sql stable security definer set search_path = public as $$
  select m.id, m.name, m.system, mm.role, m.status, m.next_session, m.seats,
         player_count(m.id),
         coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.display_name, 'color', p.color) order by x.joined_at)
                   from mesa_members x join profiles p on p.id = x.user_id
                   where x.mesa_id = m.id and x.role = 'player'), '[]'::jsonb),
         case when mm.role = 'gm' then m.invite_code else null end,
         m.session_number
  from mesa_members mm join mesas m on m.id = mm.mesa_id
  where mm.user_id = auth.uid()
  order by m.created_at desc;
$$;

-- Convites pendentes para mim, com o nome do mestre e a lotação
create or replace function public.my_invites()
returns table (id uuid, mesa_id uuid, mesa_name text, system text, gm_name text, player_count int, seats int, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select i.id, m.id, m.name, m.system, p.display_name, player_count(m.id), m.seats, i.created_at
  from invites i join mesas m on m.id = i.mesa_id join profiles p on p.id = i.invited_by
  where i.invitee_id = auth.uid() and i.status = 'pending'
  order by i.created_at desc;
$$;

-- Personagens meus em outras mesas do mesmo sistema (para "copiar de outra mesa")
create or replace function public.my_other_characters(p_system text, p_exclude uuid)
returns table (id uuid, mesa_name text, name text, sheet jsonb)
language sql stable security definer set search_path = public as $$
  select c.id, m.name, coalesce(s.name, ''), c.sheet
  from characters c join mesas m on m.id = c.mesa_id left join character_status s on s.character_id = c.id
  where c.user_id = auth.uid() and m.system = p_system and c.mesa_id <> p_exclude
  order by c.updated_at desc;
$$;

grant execute on function public.my_invites() to authenticated;
grant execute on function public.my_other_characters(text, uuid) to authenticated;
grant execute on function public.create_mesa(text, text, int, boolean, jsonb) to authenticated;
grant execute on function public.invite_player(uuid, text) to authenticated;
grant execute on function public.respond_invite(uuid, boolean) to authenticated;
grant execute on function public.join_by_code(text) to authenticated;
grant execute on function public.give_chest_item(uuid, uuid) to authenticated;
grant execute on function public.share_file(uuid, boolean) to authenticated;
grant execute on function public.set_session(uuid, text, text) to authenticated;
grant execute on function public.my_mesas() to authenticated;

-- ───────────────────────── Storage ─────────────────────────
insert into storage.buckets (id, name, public) values ('mesa-files', 'mesa-files', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('portraits', 'portraits', true)
  on conflict (id) do nothing;

-- mesa-files: caminho = <mesa_id>/<uuid>-<nome>
create policy "mesa-files: mestre envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'mesa-files' and public.is_gm(((storage.foldername(name))[1])::uuid));
create policy "mesa-files: mestre apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'mesa-files' and public.is_gm(((storage.foldername(name))[1])::uuid));
create policy "mesa-files: leitura" on storage.objects for select to authenticated
  using (bucket_id = 'mesa-files' and (
    public.is_gm(((storage.foldername(name))[1])::uuid)
    or exists (select 1 from public.mesa_files f where f.path = name and (f.shared or f.kind = 'book')
               and public.is_member(f.mesa_id))));

-- portraits: caminho = <user_id>/<arquivo>
create policy "portraits: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'portraits' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "portraits: dono troca" on storage.objects for update to authenticated
  using (bucket_id = 'portraits' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "portraits: dono apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'portraits' and (storage.foldername(name))[1] = auth.uid()::text);

-- ───────────────────────── Realtime ─────────────────────────
alter publication supabase_realtime add table
  public.mesas, public.mesa_members, public.invites, public.character_status,
  public.gm_state, public.chest_items, public.mesa_files, public.notifications;
