-- Corrige a geração do código de convite: gen_random_bytes (pgcrypto) fica no schema
-- "extensions" no Supabase e não era encontrado pelas funções com search_path = public.
-- Rode no SQL Editor se você já aplicou a 0001 antes desta correção.

create or replace function public.unaccent_safe(t text)
returns text language sql immutable as $$
  select translate(coalesce(t, ''), 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC');
$$;

create or replace function public.make_invite_code(base text)
returns text language plpgsql set search_path = public as $$
declare
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
