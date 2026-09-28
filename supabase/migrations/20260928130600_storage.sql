-- =====================================================================
-- SIA · Passo 1.6 — Bucket `recebimentos` e políticas
-- Caminho: {remessa_id}/{uuid}.jpg · privado · JPEG até 5 MB
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recebimentos', 'recebimentos', false, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Leitura da foto: quem pode ver a remessa, ou quem subiu o arquivo
-- (a entrada do 3256 sobe a foto antes de a remessa existir).
create or replace function public.fn_pode_ver_foto(p_nome text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_pasta text := split_part(p_nome, '/', 1);
begin
  if v_pasta !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.fn_pode_ver_remessa(v_pasta::uuid);
end;
$$;

revoke execute on function public.fn_pode_ver_foto(text) from public, anon;
grant execute on function public.fn_pode_ver_foto(text) to authenticated;

-- Upload por autenticado, só no formato {uuid}/{uuid}.jpg. Sem update e
-- sem delete: a foto do recebimento não é trocada depois.
create policy recebimentos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'recebimentos'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
  );

create policy recebimentos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'recebimentos'
    and (owner_id = (select auth.uid())::text or public.fn_pode_ver_foto(name))
  );
