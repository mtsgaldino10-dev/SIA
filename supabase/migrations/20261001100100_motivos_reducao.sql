-- =====================================================================
-- Warefly · Fundação 2 — Motivos de redução
-- Lista padronizada usada quando o 211 aprova abaixo do solicitado.
-- Mantida pela gestora e pelo admin. Não é apagada: é inativada.
-- =====================================================================

create table public.motivos_reducao (
  id          smallint generated always as identity primary key,
  descricao   text not null,
  exige_texto boolean not null default false,
  ativo       boolean not null default true,
  ordem       smallint not null default 0,
  constraint motivos_reducao_descricao_ck check (descricao = btrim(descricao) and descricao <> '')
);

create unique index motivos_reducao_descricao_uk on public.motivos_reducao (lower(descricao));

comment on table public.motivos_reducao is
  'Motivos padronizados de redução na aprovação. exige_texto obriga o campo livre (ex.: Outro).';

insert into public.motivos_reducao (descricao, exige_texto, ordem) values
  ('Sem saldo no 211',         false, 10),
  ('Excede consumo histórico', false, 20),
  ('Material de obras',        false, 30),
  ('Outro',                    true,  90);

alter table public.motivos_reducao enable row level security;

create policy motivos_reducao_select on public.motivos_reducao
  for select to authenticated using (true);
create policy motivos_reducao_insert on public.motivos_reducao
  for insert to authenticated
  with check (public.fn_eh_gestora() or public.fn_eh_admin());
create policy motivos_reducao_update on public.motivos_reducao
  for update to authenticated
  using (public.fn_eh_gestora() or public.fn_eh_admin())
  with check (public.fn_eh_gestora() or public.fn_eh_admin());

revoke all on public.motivos_reducao from anon, authenticated;
grant select on public.motivos_reducao to authenticated;
grant insert (descricao, exige_texto, ativo, ordem), update (descricao, exige_texto, ativo, ordem)
  on public.motivos_reducao to authenticated;

-- ---------------------------------------------------------------------
-- Privilégios
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on all functions in schema interno from public;
