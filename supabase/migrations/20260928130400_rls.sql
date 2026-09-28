-- =====================================================================
-- SIA · Passo 1.4 — Funções auxiliares, RLS e privilégios
-- =====================================================================

-- ---------------------------------------------------------------------
-- Funções auxiliares (security definer para não recursar no RLS)
-- ---------------------------------------------------------------------
create or replace function public.fn_eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
     where id = (select auth.uid()) and ativo and papel = 'admin'
  )
$$;

create or replace function public.fn_eh_gestao()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
     where id = (select auth.uid()) and ativo and papel = 'gestao'
  )
$$;

create or replace function public.fn_eh_responsavel(p_almox_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.atribuicoes a
      join public.perfis p on p.id = a.usuario_id
     where a.usuario_id = (select auth.uid())
       and a.almox_id = p_almox_id
       and a.funcao = 'responsavel'
       and p.ativo
  )
$$;

-- Verdadeira para admin e gestão, para quem tem qualquer atribuição no
-- almox e para o responsável do almox pai.
create or replace function public.fn_pode_ver(p_almox_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis
     where id = (select auth.uid()) and ativo and papel in ('admin', 'gestao')
  )
  or exists (
    select 1
      from public.atribuicoes a
      join public.perfis p on p.id = a.usuario_id
     where a.usuario_id = (select auth.uid())
       and p.ativo
       and (
         a.almox_id = p_almox_id
         or (a.funcao = 'responsavel'
             and a.almox_id = (select pai_id from public.almoxarifados where id = p_almox_id))
       )
  )
$$;

create or replace function public.fn_pode_ver_remessa(p_remessa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.remessas r
     where r.id = p_remessa_id
       and (public.fn_pode_ver(r.origem_id) or public.fn_pode_ver(r.destino_id))
  )
$$;

-- ---------------------------------------------------------------------
-- Nomes de usuários: todo autenticado lê id e nome (para "enviado por",
-- "aprovado por" etc.). E-mail, matrícula e papel continuam restritos.
-- View sem security_invoker de propósito: expõe só estas duas colunas.
-- ---------------------------------------------------------------------
create view public.v_usuarios as
select id, nome, ativo from public.perfis;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.unidades                enable row level security;
alter table public.almoxarifados           enable row level security;
alter table public.perfis                  enable row level security;
alter table public.atribuicoes             enable row level security;
alter table public.materiais               enable row level security;
alter table public.pedidos                 enable row level security;
alter table public.pedido_itens            enable row level security;
alter table public.remessas                enable row level security;
alter table public.remessa_itens           enable row level security;
alter table public.divergencia_tratamentos enable row level security;
alter table public.saidas                  enable row level security;
alter table public.saida_itens             enable row level security;
alter table public.ajustes                 enable row level security;
alter table public.ajuste_itens            enable row level security;
alter table public.movimentacoes           enable row level security;

-- Cadastros de leitura geral: almoxarifados, materiais, unidades
create policy almoxarifados_select on public.almoxarifados
  for select to authenticated using (true);
create policy almoxarifados_admin on public.almoxarifados
  for all to authenticated using (public.fn_eh_admin()) with check (public.fn_eh_admin());

create policy materiais_select on public.materiais
  for select to authenticated using (true);
create policy materiais_admin on public.materiais
  for all to authenticated using (public.fn_eh_admin()) with check (public.fn_eh_admin());

create policy unidades_select on public.unidades
  for select to authenticated using (true);
create policy unidades_admin on public.unidades
  for all to authenticated using (public.fn_eh_admin()) with check (public.fn_eh_admin());

-- perfis e atribuições: cada um lê o seu; admin lê e escreve tudo
create policy perfis_select on public.perfis
  for select to authenticated
  using (id = (select auth.uid()) or public.fn_eh_admin());
create policy perfis_admin on public.perfis
  for all to authenticated using (public.fn_eh_admin()) with check (public.fn_eh_admin());

create policy atribuicoes_select on public.atribuicoes
  for select to authenticated
  using (usuario_id = (select auth.uid()) or public.fn_eh_admin());
create policy atribuicoes_admin on public.atribuicoes
  for all to authenticated using (public.fn_eh_admin()) with check (public.fn_eh_admin());

-- pedidos: leitura por quem vê solicitante ou atendente;
-- inserção e edição só em rascunho, pelo responsável do solicitante
create policy pedidos_select on public.pedidos
  for select to authenticated
  using (public.fn_pode_ver(solicitante_id) or public.fn_pode_ver(atendente_id));
create policy pedidos_insert on public.pedidos
  for insert to authenticated
  with check (status = 'rascunho' and public.fn_eh_responsavel(solicitante_id));
create policy pedidos_update on public.pedidos
  for update to authenticated
  using (status = 'rascunho' and public.fn_eh_responsavel(solicitante_id))
  with check (status = 'rascunho' and public.fn_eh_responsavel(solicitante_id));

create policy pedido_itens_select on public.pedido_itens
  for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = pedido_id));
create policy pedido_itens_insert on public.pedido_itens
  for insert to authenticated
  with check (
    exists (select 1 from public.pedidos p
             where p.id = pedido_id and p.status = 'rascunho'
               and public.fn_eh_responsavel(p.solicitante_id))
    and exists (select 1 from public.materiais m where m.id = material_id and m.ativo)
  );
create policy pedido_itens_update on public.pedido_itens
  for update to authenticated
  using (exists (select 1 from public.pedidos p
                  where p.id = pedido_id and p.status = 'rascunho'
                    and public.fn_eh_responsavel(p.solicitante_id)))
  with check (exists (select 1 from public.pedidos p
                       where p.id = pedido_id and p.status = 'rascunho'
                         and public.fn_eh_responsavel(p.solicitante_id)));
create policy pedido_itens_delete on public.pedido_itens
  for delete to authenticated
  using (exists (select 1 from public.pedidos p
                  where p.id = pedido_id and p.status = 'rascunho'
                    and public.fn_eh_responsavel(p.solicitante_id)));

-- remessas e derivados: leitura se vê origem ou destino; escrita só via RPC
create policy remessas_select on public.remessas
  for select to authenticated
  using (public.fn_pode_ver(origem_id) or public.fn_pode_ver(destino_id));

create policy remessa_itens_select on public.remessa_itens
  for select to authenticated
  using (exists (select 1 from public.remessas r where r.id = remessa_id));

create policy divergencia_tratamentos_select on public.divergencia_tratamentos
  for select to authenticated
  using (exists (select 1 from public.remessa_itens ri where ri.id = remessa_item_id));

-- saídas e ajustes: leitura se vê o almox; escrita só via RPC
create policy saidas_select on public.saidas
  for select to authenticated using (public.fn_pode_ver(almox_id));
create policy saida_itens_select on public.saida_itens
  for select to authenticated
  using (exists (select 1 from public.saidas s where s.id = saida_id));

create policy ajustes_select on public.ajustes
  for select to authenticated using (public.fn_pode_ver(almox_id));
create policy ajuste_itens_select on public.ajuste_itens
  for select to authenticated
  using (exists (select 1 from public.ajustes a where a.id = ajuste_id));

-- movimentações: leitura se vê o almox; nenhuma escrita pelo cliente
create policy movimentacoes_select on public.movimentacoes
  for select to authenticated using (public.fn_pode_ver(almox_id));

-- ---------------------------------------------------------------------
-- Privilégios
-- O Supabase concede tudo a anon/authenticated por padrão; aqui fica
-- explícito o que cada papel pode fazer. TRUNCATE ignora RLS e é
-- sempre revogado.
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select on all tables in schema public to authenticated;

-- Cadastros: escrita liberada no privilégio, restrita a admin pelo RLS
grant insert, update, delete on
  public.unidades, public.almoxarifados, public.materiais,
  public.perfis, public.atribuicoes
to authenticated;

-- Pedido em rascunho: só as colunas que o cliente pode preencher
grant insert (solicitante_id, observacao) on public.pedidos to authenticated;
grant update (observacao) on public.pedidos to authenticated;

grant insert (pedido_id, material_id, qtd_solicitada) on public.pedido_itens to authenticated;
grant update (qtd_solicitada) on public.pedido_itens to authenticated;
grant delete on public.pedido_itens to authenticated;

-- Funções: nada para anon
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on all functions in schema interno from public;

-- Objetos criados depois (pelas próximas migrations) também não vão para anon
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from public, anon;
