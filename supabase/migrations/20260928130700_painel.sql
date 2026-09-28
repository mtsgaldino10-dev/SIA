-- =====================================================================
-- SIA · Fase 5 — Indicadores dos painéis e Realtime
-- Funções security invoker: o RLS de quem consulta continua valendo
-- (gestão e admin veem tudo; supervisor, só as próprias bases).
-- =====================================================================

-- ---------------------------------------------------------------------
-- fn_indicadores: um registro por almoxarifado operável no período
--   taxa_atendimento   = Σ enviado ÷ Σ solicitado (pedidos enviados no período)
--   indice_divergencia = remessas com divergência ÷ remessas recebidas
--   tempo_transito     = média de (data de recebimento − data de envio), em dias
--   perda em trânsito  = Σ baixas em trânsito (atribuídas ao destino)
--   ajustes            = nº de ajustes de inventário e Σ |diferença| × preço
--   saidas_valor       = Σ saídas × preço
-- ---------------------------------------------------------------------
create or replace function public.fn_indicadores(p_de date, p_ate date)
returns table (
  almox_id                 uuid,
  almox_codigo             text,
  almox_nome               text,
  almox_tipo               public.tipo_almox,
  qtd_solicitada           numeric,
  qtd_enviada              numeric,
  taxa_atendimento         numeric,
  remessas_recebidas       int,
  remessas_com_divergencia int,
  indice_divergencia       numeric,
  tempo_transito_medio     numeric,
  perda_transito_qtd       numeric,
  perda_transito_valor     numeric,
  ajustes_qtd              int,
  ajustes_valor_abs        numeric,
  saidas_valor             numeric
)
language sql
stable
set search_path = ''
as $$
  with
  atendimento as (
    select p.solicitante_id as almox_id,
           sum((select coalesce(sum(pi.qtd_solicitada), 0) from public.pedido_itens pi where pi.pedido_id = p.id)) as solicitada,
           sum((select coalesce(sum(ri.qtd_enviada), 0) from public.remessa_itens ri where ri.remessa_id = r.id)) as enviada
      from public.pedidos p
      join public.remessas r on r.pedido_id = p.id
     where r.data_envio between p_de and p_ate
     group by p.solicitante_id
  ),
  recebidas as (
    select r.destino_id as almox_id,
           count(*)::int as recebidas,
           count(*) filter (
             where exists (select 1 from public.remessa_itens ri
                            where ri.remessa_id = r.id and ri.qtd_recebida <> ri.qtd_enviada)
           )::int as divergentes,
           round(avg(r.data_recebimento - r.data_envio), 1) as tempo
      from public.remessas r
     where r.data_recebimento between p_de and p_ate
     group by r.destino_id
  ),
  perdas as (
    select r.destino_id as almox_id,
           sum(t.quantidade) as qtd,
           round(sum(t.quantidade * coalesce(m.preco, 0)), 2) as valor
      from public.divergencia_tratamentos t
      join public.remessa_itens ri on ri.id = t.remessa_item_id
      join public.remessas r on r.id = ri.remessa_id
      join public.materiais m on m.id = ri.material_id
     where t.tipo = 'baixa_transito'
       and t.data_ocorrencia between p_de and p_ate
     group by r.destino_id
  ),
  ajustes as (
    select a.almox_id,
           count(distinct a.id)::int as qtd,
           round(coalesce(sum(abs(ai.diferenca) * coalesce(m.preco, 0)), 0), 2) as valor
      from public.ajustes a
      join public.ajuste_itens ai on ai.ajuste_id = a.id
      join public.materiais m on m.id = ai.material_id
     where a.tipo = 'inventario'
       and a.data_ocorrencia between p_de and p_ate
     group by a.almox_id
  ),
  saidas as (
    select s.almox_id,
           round(sum(si.quantidade * coalesce(m.preco, 0)), 2) as valor
      from public.saidas s
      join public.saida_itens si on si.saida_id = s.id
      join public.materiais m on m.id = si.material_id
     where s.data_ocorrencia between p_de and p_ate
     group by s.almox_id
  )
  select
    a.id,
    a.codigo,
    a.nome,
    a.tipo,
    coalesce(at.solicitada, 0),
    coalesce(at.enviada, 0),
    case when coalesce(at.solicitada, 0) > 0 then round(at.enviada / at.solicitada, 4) end,
    coalesce(rc.recebidas, 0),
    coalesce(rc.divergentes, 0),
    case when coalesce(rc.recebidas, 0) > 0 then round(rc.divergentes::numeric / rc.recebidas, 4) end,
    rc.tempo,
    coalesce(pe.qtd, 0),
    coalesce(pe.valor, 0),
    coalesce(aj.qtd, 0),
    coalesce(aj.valor, 0),
    coalesce(sa.valor, 0)
  from public.almoxarifados a
  left join atendimento at on at.almox_id = a.id
  left join recebidas rc on rc.almox_id = a.id
  left join perdas pe on pe.almox_id = a.id
  left join ajustes aj on aj.almox_id = a.id
  left join saidas sa on sa.almox_id = a.id
  where a.tipo in ('regional', 'base')
  order by a.tipo desc, a.nome
$$;

-- ---------------------------------------------------------------------
-- fn_consumo: Σ saídas por almoxarifado e material no período
-- ---------------------------------------------------------------------
create or replace function public.fn_consumo(p_de date, p_ate date)
returns table (
  almox_id     uuid,
  almox_codigo text,
  almox_nome   text,
  material_id  uuid,
  codigo_sap   text,
  descricao    text,
  unidade      text,
  quantidade   numeric,
  valor        numeric
)
language sql
stable
set search_path = ''
as $$
  select a.id, a.codigo, a.nome, m.id, m.codigo_sap, m.descricao, m.unidade,
         sum(si.quantidade),
         round(sum(si.quantidade * coalesce(m.preco, 0)), 2)
    from public.saidas s
    join public.saida_itens si on si.saida_id = s.id
    join public.materiais m on m.id = si.material_id
    join public.almoxarifados a on a.id = s.almox_id
   where s.data_ocorrencia between p_de and p_ate
   group by a.id, a.codigo, a.nome, m.id, m.codigo_sap, m.descricao, m.unidade
   order by a.nome, sum(si.quantidade * coalesce(m.preco, 0)) desc, m.codigo_sap
$$;

revoke execute on function public.fn_indicadores(date, date) from public, anon;
revoke execute on function public.fn_consumo(date, date) from public, anon;
grant execute on function public.fn_indicadores(date, date) to authenticated;
grant execute on function public.fn_consumo(date, date) to authenticated;

-- ---------------------------------------------------------------------
-- Realtime: o painel do 211 atualiza sozinho com pedidos e remessas
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.pedidos, public.remessas, public.divergencia_tratamentos;
