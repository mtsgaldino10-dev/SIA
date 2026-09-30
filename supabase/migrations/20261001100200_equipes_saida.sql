-- =====================================================================
-- Warefly · Fundação 3 — Equipes por base e saída com equipe
-- A saída de aplicação numa base registra qual equipe e quem retirou.
-- O controle de estoque continua indo só até a base.
-- =====================================================================

-- ---------------------------------------------------------------------
-- equipes
-- ---------------------------------------------------------------------
create table public.equipes (
  id          uuid primary key default gen_random_uuid(),
  almox_id    uuid not null references public.almoxarifados (id),
  nome        text not null,
  ativa       boolean not null default true,
  criado_por  uuid default auth.uid() references public.perfis (id),
  criado_em   timestamptz not null default now(),
  constraint equipes_nome_ck check (nome = btrim(nome) and nome <> '')
);

create unique index equipes_nome_uk on public.equipes (almox_id, lower(nome));

comment on column public.equipes.criado_por is 'Quem cadastrou. Nulo só em carga feita por script.';

-- ---------------------------------------------------------------------
-- saidas: equipe e quem retirou
-- ---------------------------------------------------------------------
alter table public.saidas
  add column equipe_id uuid references public.equipes (id),
  add column retirado_por_nome text,
  add constraint saidas_retirado_por_ck check (
    retirado_por_nome is null or (retirado_por_nome = btrim(retirado_por_nome) and retirado_por_nome <> '')
  );

create index saidas_equipe_idx on public.saidas (equipe_id);

-- ---------------------------------------------------------------------
-- Regras da equipe: fica numa base; com saída registrada, não muda de nome
-- ---------------------------------------------------------------------
create or replace function interno.tg_equipe()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     and not exists (select 1 from public.almoxarifados where id = new.almox_id and tipo = 'base') then
    raise exception 'Equipe é cadastrada em uma base.';
  end if;
  if tg_op = 'UPDATE' and new.nome is distinct from old.nome
     and exists (select 1 from public.saidas where equipe_id = old.id) then
    raise exception 'A equipe % já tem saídas registradas e não pode mudar de nome. Inative esta e cadastre outra.', old.nome;
  end if;
  return new;
end;
$$;

create trigger equipes_regras
  before insert or update on public.equipes
  for each row execute function interno.tg_equipe();

-- ---------------------------------------------------------------------
-- RLS: lê quem vê a base; mantém o responsável da base, a gestão que
-- gere a base e o admin
-- ---------------------------------------------------------------------
alter table public.equipes enable row level security;

create policy equipes_select on public.equipes
  for select to authenticated using (public.fn_pode_ver(almox_id));
create policy equipes_insert on public.equipes
  for insert to authenticated
  with check (public.fn_eh_responsavel(almox_id) or public.fn_gere_local(almox_id) or public.fn_eh_admin());
create policy equipes_update on public.equipes
  for update to authenticated
  using (public.fn_eh_responsavel(almox_id) or public.fn_gere_local(almox_id) or public.fn_eh_admin())
  with check (public.fn_eh_responsavel(almox_id) or public.fn_gere_local(almox_id) or public.fn_eh_admin());

revoke all on public.equipes from anon, authenticated;
grant select on public.equipes to authenticated;
grant insert (almox_id, nome), update (nome, ativa) on public.equipes to authenticated;

-- ---------------------------------------------------------------------
-- rpc_registrar_saida (+ p_equipe_id, p_retirado_por_nome)
-- ---------------------------------------------------------------------
drop function public.rpc_registrar_saida(uuid, jsonb, public.motivo_saida, date, text, text, uuid);

create function public.rpc_registrar_saida(
  p_almox_id          uuid,
  p_itens             jsonb,
  p_motivo            public.motivo_saida default 'aplicacao',
  p_data_ocorrencia   date default null,
  p_justificativa     text default null,
  p_observacao        text default null,
  p_id                uuid default null,
  p_equipe_id         uuid default null,
  p_retirado_por_nome text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario  uuid;
  v_almox    public.almoxarifados;
  v_equipe   public.equipes;
  v_motivo   public.motivo_saida := coalesce(p_motivo, 'aplicacao');
  v_data     date := coalesce(p_data_ocorrencia, public.fn_hoje());
  v_nome     text := interno.fn_texto(p_retirado_por_nome);
  v_saida_id uuid;
  v_item     record;
begin
  v_usuario := interno.fn_usuario();

  if p_id is not null and interno.fn_id_repetido(
       exists (select 1 from public.saidas where id = p_id),
       exists (select 1 from public.saidas where id = p_id and registrado_por = v_usuario and almox_id = p_almox_id)) then
    return p_id;
  end if;

  select * into v_almox from public.almoxarifados where id = p_almox_id;
  if not found then
    raise exception 'Almoxarifado não encontrado.';
  end if;

  perform interno.fn_exigir_responsavel(p_almox_id);

  if v_almox.tipo = 'externo' then
    raise exception 'O almoxarifado externo não registra saídas no sistema.';
  end if;
  if v_motivo <> 'aplicacao' and interno.fn_texto(p_justificativa) is null then
    raise exception 'Informe a justificativa da %.', v_motivo;
  end if;

  -- Aplicação em serviço numa base: qual equipe e quem retirou
  if v_almox.tipo = 'base' and v_motivo = 'aplicacao' then
    if p_equipe_id is null then
      raise exception 'Informe a equipe que retirou o material.';
    end if;
    if v_nome is null then
      raise exception 'Informe o nome de quem retirou o material.';
    end if;
  end if;

  -- A equipe é da própria base; num regional, de uma das bases dele
  if p_equipe_id is not null then
    select * into v_equipe from public.equipes where id = p_equipe_id;
    if not found then
      raise exception 'Equipe não encontrada.';
    end if;
    if not v_equipe.ativa then
      raise exception 'A equipe % está inativa. Escolha outra ou reative em Equipes.', v_equipe.nome;
    end if;
    if v_equipe.almox_id <> p_almox_id
       and not exists (select 1 from public.almoxarifados b where b.id = v_equipe.almox_id and b.pai_id = p_almox_id) then
      raise exception 'A equipe % não é de %.', v_equipe.nome, v_almox.nome;
    end if;
  end if;

  perform interno.fn_checar_data(v_data, 'data da saída');
  perform interno.fn_checar_itens(p_itens);

  insert into public.saidas (id, almox_id, motivo, data_ocorrencia, justificativa, observacao,
                             equipe_id, retirado_por_nome, registrado_por)
  values (coalesce(p_id, gen_random_uuid()), p_almox_id, v_motivo, v_data, interno.fn_texto(p_justificativa),
          interno.fn_texto(p_observacao), p_equipe_id, v_nome, v_usuario)
  returning id into v_saida_id;

  for v_item in
    select x.material_id, x.quantidade
      from jsonb_to_recordset(p_itens) as x (material_id uuid, quantidade numeric)
     order by x.material_id
  loop
    if v_item.quantidade is null or v_item.quantidade <= 0 then
      raise exception 'Informe uma quantidade maior que zero para %.', interno.fn_material_rotulo(v_item.material_id);
    end if;

    insert into public.saida_itens (saida_id, material_id, quantidade)
    values (v_saida_id, v_item.material_id, v_item.quantidade);

    perform interno.fn_lancar(p_almox_id, v_item.material_id, -v_item.quantidade,
                              'saida', v_data, p_saida_id => v_saida_id);
  end loop;

  return v_saida_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Privilégios
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on all functions in schema interno from public;
