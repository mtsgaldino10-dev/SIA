# Warefly: reservas CEMIG, solicitações e inventário

> Especificação de design · 30/09/2026 · Status: aguardando revisão
> Parte do sistema existente (fases 1 a 5 do [plano](../../../WAREFLY_PLANO_IMPLEMENTAÇÃO.MD)). Descreve o que muda, o que entra e o que sai.

---

## 1. Objetivo

Hoje as solicitações ao almoxarifado são feitas por e-mail e o controle é manual. Não fica registrado o que foi pedido, aprovado, reduzido (e por quê), entregue e o que ficou pendente. O Warefly passa a registrar isso nas três camadas:

- **Depósito 3256 → Almox 211**: reservas que a CEMIG aprova e retiradas feitas contra elas.
- **Almox 211 → bases**: solicitações dos supervisores, com análise, separação, entrega e recebimento.
- **Bases**: saídas por equipe, transferências e inventários periódicos.

Critério de sucesso: para qualquer material, qualquer base e qualquer solicitação, dá para responder quanto foi pedido, aprovado, reduzido e por quê, cancelado, entregue, recebido e pendente, e cada número bate com o histórico que o gerou.

O Warefly roda em paralelo ao SAP, sem integração. Os dados do SAP chegam só pela planilha exportada.

## 2. Glossário (usado exatamente assim na interface)

| Termo | Significado |
|---|---|
| **Reserva** | Somente a reserva do SAP: a quantidade que a CEMIG aprovou para retirada no 3256. Nunca usado para outra coisa. |
| **Retirada** | Material tirado do 3256 contra uma reserva. |
| **Solicitação** | Pedido de uma base ao 211 (no banco continua na tabela `pedidos`). |
| **Separado para** | Quantidade aprovada pelo 211 para uma base e ainda não entregue nem cancelada. É o mesmo número que o pendente da solicitação. |
| **Físico** | Soma das movimentações de um local. A reserva nunca conta como físico. |
| **Disponível** | Físico do 211 menos o separado. |
| **Reduzido** | Solicitado menos aprovado, quando a aprovação fica abaixo do pedido. |
| **Entrega** | Remessa do 211 para uma base que atende uma solicitação. |

## 3. Decisões tomadas

| Tema | Decisão |
|---|---|
| Baixa no 211 | Na aprovação, a quantidade sai do **disponível**. Na entrega, sai do **físico** do 211. A base recebe no recebimento. Entre a entrega e o recebimento o material fica **em trânsito**, como hoje. |
| Retirada acima do saldo da reserva | Bloqueada. Se a CEMIG aprovou mais, a gestora corrige a aprovada (com motivo) ou a importação traz o número novo. |
| Aprovação acima do disponível | Bloqueada. O separado precisa existir na prateleira. |
| Ajuste de estoque | Só a gestora e o admin. O supervisor perde essa opção. |
| Inventário | Feito pela gestora (ou admin), um local por vez, periodicamente. Cada local mostra quando foi inventariado pela última vez. |
| Saída da base | Registra quem retirou (nome, sem login), a data e a equipe, escolhida de uma lista cadastrada por base. |
| Pedido externo ao 3256 | Sai. É substituído por Reserva + Retirada. |
| Entrada no 211 sem reserva | Continua, como exceção ("Entrada sem reserva"), com justificativa. |
| Nomes internos | Tabelas `pedidos`, `pedido_itens` e `remessas` mantêm o nome. A interface usa Solicitação (SOL-), Entrega e Remessa (REM-). |
| Status "Esgotada" da reserva | Calculado, não gravado. Volta a Ativa sozinho se a aprovada aumentar. |

## 4. Perfis e permissões

Sem tabela nova. Os perfis vêm do papel global (`perfis.papel`) e das atribuições por local (`atribuicoes`), como hoje.

| Perfil | Como se configura | O que faz |
|---|---|---|
| **Gestor(a) do almoxarifado** | Atribuição `responsavel` no 211 | Vê tudo. Analisa e aprova solicitações, entrega, cancela separado, cuida de reservas, retiradas e importações, inventaria e ajusta qualquer local sob o 211, mantém motivos de redução e equipes. |
| **Supervisor** | `responsavel` + `supervisor` nas próprias bases | Vê e opera só as próprias bases: solicita, cancela separado, recebe, registra saída, transfere entre as próprias bases, devolve ao 211, mantém as equipes das próprias bases. Não vê reservas nem o estoque do 211. |
| **Gerência** | Papel `gestao` (já existe; muda só o rótulo) | Vê tudo, não opera. |
| **Administrador** | Papel `admin` | Cadastros, usuários e atribuições, unidades. Também inventaria e ajusta. |

Funções novas no banco:
- `fn_eh_gestora()`: o usuário é responsável de algum almoxarifado regional.
- `fn_gere_local(almox_id)`: o usuário é responsável do local regional ou do regional pai da base. Usada em ajuste, inventário e cancelamento pela gestora.

O nome da gestora não aparece em lugar nenhum do código.

## 5. Números e fórmulas

Nenhum desses números é gravado como contador. Todos são calculados em views a partir dos registros que os geraram.

### 5.1 Item de solicitação

| Número | Fórmula |
|---|---|
| Solicitado (S) | `pedido_itens.qtd_solicitada` |
| Aprovado (A) | `pedido_itens.qtd_aprovada` (vazio antes da análise; pode ser maior que S) |
| Reduzido (R) | `max(S − A, 0)`, com o motivo |
| Cancelado (C) | Σ cancelamentos do item |
| Entregue (E) | Σ `qtd_enviada` das entregas da solicitação |
| Recebido | Σ `qtd_recebida` das entregas já conferidas |
| Em trânsito | Σ `qtd_enviada` das entregas ainda não conferidas |
| **Separado / pendente (P)** | `A − C − E`, enquanto a solicitação está em atendimento; zero nos outros status |

Invariante: `C + E ≤ A`.

### 5.2 Estoque do 211

| Número | Fórmula |
|---|---|
| Físico | Σ movimentações do 211 (como hoje) |
| Separado | Σ P das solicitações em atendimento, por material (e por base) |
| Disponível | Físico − Separado |

Disponível negativo só acontece quando um ajuste ou uma correção de divergência derruba o físico abaixo do separado. Nesse caso a tela mostra o número em vermelho e o painel da gestora avisa ("separado maior que o físico").

### 5.3 Item de reserva

| Número | Fórmula |
|---|---|
| Pedida | Quantidade pedida à CEMIG (só existe no Warefly; pode ser vazia) |
| Aprovada | SAP "Qtd.necessária" |
| Retirada | Σ itens de retirada ligados ao item (com e sem entrada no 211) |
| Saldo em aberto | Aprovada − Retirada (SAP "Quantidade diferença") |
| Esgotado | Aprovada > 0 e saldo ≤ 0 |
| Não aprovado | Aprovada = 0 |

## 6. Reservas CEMIG

### 6.1 Ciclo

```
solicitada → ativa → excluída
     └────→ cancelada
ativa (calculada: esgotada quando todos os itens aprovados têm saldo zero)
excluída → ativa (reativar, com motivo)
```

- **Solicitada**: a gestora cadastra itens e quantidade pedida. Número SAP opcional. Número interno RES-000123.
- **Ativa**: a gestora registra a aprovação: número da reserva SAP (obrigatório e único), data de aprovação e quantidade aprovada de cada item. Pode incluir item que não estava na solicitação. Item solicitado sem aprovação fica com aprovada 0.
- **Cancelada** (acréscimo ao pedido): a CEMIG não aprovou a solicitação. Exige motivo.
- **Excluída**: a gestora marca quando descobre que a reserva foi excluída no SAP. Exige motivo. A reserva é arquivada: sai das listas operacionais e dos totais, continua consultável. Pode ser reativada com motivo, caso tenha sido marcada por engano.
- **Esgotada**: situação calculada. Sai da lista de ativas e vai para a aba de esgotadas.
- **Alerta "Reserva com mais de 30 dias"**: reserva ativa (não esgotada) com mais de 30 dias desde a data de aprovação. Continua utilizável.

A reserva exibe o número SAP quando existe ("Reserva 1234567"); antes disso, o número interno.

### 6.2 Operações

| Operação | Quem | Regras |
|---|---|---|
| Solicitar reserva | Gestora | Ao menos um item; material ativo; quantidade > 0; fração conforme a unidade |
| Registrar aprovação | Gestora | Só de solicitada; número SAP único |
| Alterar quantidade aprovada | Gestora | Motivo obrigatório; não pode ficar abaixo do já retirado |
| Cancelar | Gestora | Só de solicitada; motivo |
| Excluir (arquivar) | Gestora | Só de ativa; motivo |
| Reativar | Gestora | Só de excluída; motivo |

Toda operação grava um evento em `reserva_eventos` com valores antes e depois, quem, quando e motivo. A tela da reserva mostra essa linha do tempo.

### 6.3 Visão consolidada por material

Por material, o saldo em aberto somado nas reservas ativas, abrindo o detalhe de cada reserva (número SAP, aprovada, retirada, saldo, data de aprovação, alerta de 30 dias).

## 7. Retirada 3256 → 211

- Um lançamento RET-000123 com data da retirada, documento SAP (opcional), observação e itens de uma ou mais reservas.
- Cada item aumenta o retirado do item de reserva e lança entrada no físico do 211 (movimentação nova `retirada_reserva`), na mesma transação.
- Bloqueios: reserva não ativa, item esgotado, quantidade acima do saldo em aberto (a mensagem mostra o saldo), fração inválida.
- Trava por item de reserva para duas retiradas simultâneas não passarem juntas pela checagem.
- Idempotente: o app gera o id; repetir o envio devolve o mesmo registro.

**Retirada sem entrada no 211**: item de retirada com `entra_estoque = falso` e justificativa obrigatória. Aumenta o retirado da reserva, mas não o físico. Nasce só da conciliação da importação (seção 8), quando a gestora conclui que alguém usou a reserva e o material não veio ao 211. Aparece em destaque no painel.

**Entrada sem reserva**: a entrada avulsa atual (material que chegou ao 211 sem reserva, com documento, foto e contagem) continua, acessível pela tela de retiradas.

## 8. Importação da planilha SAP

### 8.1 Leitura (no app)

Colunas esperadas: `Depósito | Reserva | Material | Texto breve material | Tipo de movimento | Qtd.necessária | Quantidade reduzida | Quantidade diferença | UMB | Permitido movimento | Ponto de descarga | Lote`. O cabeçalho é localizado pelo nome, sem depender de acento, maiúscula ou posição.

- Linhas com Depósito, Reserva e Material vazios são totais por UMB: ignoradas e contadas à parte.
- Reserva e material são lidos como identificador: texto, sem zeros à esquerda.
- Quantidades aceitam decimal.
- A UMB é convertida pela nova coluna `unidades.sigla_sap` (seed: PC ↔ PEÇ; CJ, M e KG iguais). UMB sem correspondência bloqueia a linha com a mensagem "Cadastre a sigla SAP em Unidades".
- Linha bloqueada (com motivo): depósito diferente de 3256, tipo de movimento diferente de 261, quantidade inválida, UMB desconhecida.
- Mesma reserva e mesmo material em mais de uma linha (itens diferentes da reserva no SAP): as quantidades são somadas, e o relatório avisa quantas linhas foram juntadas.

### 8.2 Conciliação (no banco)

A função `fn_conciliar_importacao(linhas)` compara a planilha com o Warefly e devolve cada linha classificada. A comparação fica no banco para ser a mesma na prévia e na aplicação.

| Categoria | Quando | Decisões da gestora (padrão em negrito) |
|---|---|---|
| **Retirado no SAP e não no Warefly** | SAP reduzida > retirado no Warefly | Registrar como retirada com entrada no 211 (informa a data) · Registrar sem entrada no 211 (justificativa) · **Deixar em aberto** |
| Reserva nova | Número SAP que o Warefly não conhece | **Criar** como ativa (informa a data de aprovação; padrão hoje) · Vincular a uma reserva solicitada · Ignorar |
| Item novo | Reserva conhecida, material fora dela | **Incluir** · Ignorar |
| Aprovada divergente | SAP necessária ≠ aprovada no Warefly | **Atualizar para o SAP** · Ignorar. Não aplicável se ficar abaixo do retirado. |
| Retirado no Warefly e ainda não no SAP | Retirado no Warefly > SAP reduzida | Só aviso |
| Material novo | Código fora do catálogo | **Cadastrar** (código, descrição, unidade) · Ignorar a linha |
| Reserva ausente | Reserva ativa com número SAP que não veio na planilha | Só aviso, com a opção de marcar como excluída (motivo) |
| Reserva arquivada presente | Reserva excluída ou cancelada no Warefly que aparece no SAP | Só aviso |
| Item ausente | Item de reserva conhecida que não veio na planilha | Só aviso |
| Igual | Sem diferença | Nada |

O bloco "Retirado no SAP e não no Warefly" vem primeiro e em destaque: pode indicar que alguém está usando a reserva do 211 para tirar material no 3256.

Uma reserva nova que já tem quantidade reduzida no SAP aparece nos dois blocos: é criada e, depois, a diferença de retirada segue a decisão escolhida.

### 8.3 Aplicação

- `rpc_aplicar_importacao` recebe as mesmas linhas e as decisões, refaz a conciliação e aplica tudo numa transação. Se algum número mudou desde a prévia (por exemplo, alguém registrou uma retirada), nada é aplicado e a gestora gera a prévia de novo.
- Ordem: materiais novos → reservas e itens novos → aprovadas → retiradas → exclusões.
- Toda importação aplicada fica registrada, mesmo sem nenhuma alteração ("conferência sem alterações"): arquivo, quem, quando, contagem por categoria e, por linha, o dado do SAP, a categoria, a decisão e o resultado. Número IMP-000123.
- Cada item de reserva guarda os números do SAP da última importação em que apareceu (necessária, reduzida, diferença, permitido movimento, id da importação). A comparação com o Warefly é feita em tempo real a partir disso: se a gestora registrar a retirada depois, a divergência some do painel sem nova importação.

## 9. Solicitação da base ao 211

### 9.1 Ciclo

```
rascunho → solicitada (aguardando análise) → em atendimento → concluída
    └──────────────┴──→ cancelada
em atendimento → cancelada (quando todo o separado é cancelado sem nenhuma entrega)
```

Rótulos na interface: Rascunho, Aguardando análise, Em atendimento, Concluída, Cancelada. Uma solicitação concluída com tudo aprovado em zero aparece como "Negada". Os valores `em_transito` e `com_divergencia` deixam de ser usados em solicitações (continuam em remessas).

### 9.2 Análise e aprovação

- Para cada item, a gestora vê: solicitado, disponível no 211, físico no 211, saldo da base de destino (ou "não inventariada"), consumo da base nos últimos 90 dias (Σ saídas) e a média mensal (esse total ÷ 3), recebido pela base nos últimos 90 dias, e o que já está separado para essa base em outras solicitações.
- Decisão por item: aprovar total, parcial ou negar (0).
- Aprovada abaixo do solicitado exige motivo da lista `motivos_reducao` (seed: Sem saldo no 211, Excede consumo histórico, Material de obras, Outro). Motivo marcado "exige texto" (Outro) obriga o campo livre; nos outros, o texto é opcional.
- A lista é mantida pela gestora e pelo admin. Motivo já usado não muda de nome, só é inativado, para o histórico não mudar de sentido.
- A quantidade aprovada não pode passar do disponível no momento da aprovação. Trava por (211, material) para duas aprovações simultâneas não separarem o mesmo material.

### 9.3 Separado, cancelamento e entrega

- Ao aprovar, o aprovado vira separado para aquela base e sai do disponível. Não expira.
- **Cancelamento parcial**: qualquer quantidade de qualquer item, até o separado. Pode ser feito pela gestora ou pelo supervisor da base. Motivo obrigatório. Grava quantidade, motivo, quem e quando. A quantidade volta ao disponível na hora. "Cancelar o que falta" cancela o separado de todos os itens de uma vez.
- **Entrega**: a gestora registra quantas entregas forem necessárias, cada uma com quantidade até o separado de cada item. Cada entrega é uma remessa (REM-) com guia impressa, e baixa o físico do 211. Deixa de existir o limite de uma remessa por solicitação.
- **Recebimento**: sem mudança (contagem, data real, quem contou, foto da guia). Diferença entre entregue e recebido vira divergência com o tratamento que já existe.
- A solicitação conclui quando não resta separado, nenhuma entrega está em trânsito e nenhuma divergência está aberta.

### 9.4 O que o 211 deixa de permitir

Saída registrada no 211 e reenvio de divergência saindo do 211 respeitam o disponível, não só o físico: não podem consumir material separado para uma base. Ajustes e correções de divergência (ajuste na origem, estorno) continuam refletindo o que aconteceu, mesmo que deixem o disponível negativo.

### 9.5 O que aparece por item

Solicitado, aprovado, reduzido e motivo, cancelado, separado/pendente, entregue, em trânsito, recebido e divergência. Na tela da solicitação e na visão por base.

## 10. Bases (mini-almox)

### 10.1 Saída com equipe

- Nova tabela `equipes` (base, nome, ativa). O supervisor mantém as equipes das próprias bases; a gestora e o admin, todas. Equipe já usada não muda de nome, só é inativada.
- A saída ganha dois campos: equipe e nome de quem retirou. Obrigatórios quando o motivo é aplicação em serviço; opcionais em perda e avaria (que continuam exigindo justificativa). A data da saída já existe. Quem lançou no sistema continua gravado sozinho.
- Saída no 211: equipe opcional, escolhida entre as equipes ativas de qualquer base.
- A lista inicial de equipes vem do levantamento que o usuário vai enviar. Até lá, o supervisor pode cadastrar pela tela.

### 10.2 Sem mudança

Transferência direta entre bases do mesmo supervisor e devolução ao 211 continuam como estão.

## 11. Inventário e ajuste

### 11.1 Situação por local

A view `v_inventario_locais` mostra, para o 211 e cada base: data do primeiro inventário, data e autor do último, e dias desde o último. Local sem inventário aparece como **Não inventariado**, e o saldo dele aparece como desconhecido nas telas de saldo, na análise de solicitação e na visão por material, nunca como zero.

### 11.2 Inventário

- Feito pela gestora ou pelo admin, um local por vez, digitando a contagem ou por planilha (`codigo_sap`, `quantidade`).
- É sempre uma contagem completa do local: material com saldo no Warefly que não foi contado entra como zero. A prévia lista esses materiais ("vai zerar") e a gestora confirma.
- O banco decide o tipo: o primeiro inventário de um local é `implantacao` (movimentações `saldo_inicial`); os seguintes, `inventario`. Deixa de existir a regra "saldo inicial só antes de o local operar": um local pode ter recebido material antes de ser inventariado.
- A tela "Saldo inicial" (hoje só do admin) passa a fazer parte da tela Inventário.
- Se houver entrega a caminho do local, a tela avisa para confirmar o recebimento antes de inventariar, para não contar o material duas vezes.

### 11.3 Ajuste forçado

- A gestora ou o admin informa a quantidade nova de um ou mais materiais em qualquer local. Motivo obrigatório. Tipo de ajuste novo: `ajuste`.
- Grava valor anterior, valor novo, diferença, motivo, quem e quando (a estrutura de `ajustes` e `ajuste_itens` já faz isso).
- O supervisor não ajusta mais.

## 12. Visões

| Tela | Quem vê | Conteúdo |
|---|---|---|
| **Início da gestora** | Gestora, gerência, admin | Contador e lista de: solicitações aguardando análise (com dias), separado aguardando entrega (por base, com dias desde a aprovação), entregas aguardando recebimento, divergências de recebimento abertas, reservas ativas e saldo total, reservas com mais de 30 dias, itens esgotados em reservas ativas, divergências da última importação (retirado no SAP e não no Warefly em destaque), retiradas sem entrada no 211 (30 dias), locais não inventariados ou sem inventário há mais de 90 dias, separado maior que o físico. |
| **Início do supervisor** | Supervisor | Por base: saldo, entregas a caminho, solicitações abertas, separado aguardando entrega, divergências (como hoje, mais o separado). |
| **Estoque do 211** | Gestora, gerência, admin | Por material: físico, separado, disponível e saldo em reservas ativas. Filtro e busca. |
| **Atendimento por base** | Gestora, gerência, admin; supervisor só as próprias bases | Item a item: solicitação, base, supervisor, material, solicitado, aprovado, reduzido e motivo, cancelado, separado/pendente, entregue, recebido. Filtros por supervisor, base, período e situação. Resumo por base com o saldo atual. Exporta planilha. |
| **Material** | Gestora, gerência, admin | Físico no 211, separado por base (com supervisor), disponível, saldo em cada reserva ativa, saldo em cada base (com "não inventariada"). Abre pela busca Ctrl+K e pelos códigos nas tabelas. |
| **Reservas** | Gestora, gerência, admin | Abas Ativas, Solicitadas, Esgotadas, Arquivadas; detalhe com itens, retiradas e linha do tempo; consolidado por material. |
| **Retiradas** | Gestora, gerência, admin | Lista, nova retirada, entrada sem reserva. |
| **Importações SAP** | Gestora, gerência, admin | Nova importação (arquivo → prévia → aplicar) e histórico com detalhe. |
| **Inventário** | Gestora, admin; gerência consulta | Situação por local, novo inventário, ajuste forçado. |
| **Painel de indicadores** | Gestora, gerência, admin | Como hoje. A taxa de atendimento passa a ser Σ entregue ÷ Σ solicitado das solicitações feitas no período, para não contar duas vezes uma solicitação com várias entregas. |

A busca Ctrl+K passa a reconhecer SOL-, REM-, RES-, RET-, IMP-, SAI- e AJU-, além do número da reserva no SAP.

Menu da gestora: **Operação** (Início, Solicitações, Remessas, Divergências, Estoque do 211, Saldo, Movimentar, Histórico), **Reservas CEMIG** (Reservas, Retiradas, Importações SAP), **Gestão** (Inventário, Atendimento por base, Indicadores), **Cadastros** (Motivos de redução, Equipes e, para o admin, os cadastros atuais).

## 13. Rastreabilidade

- Físico = soma das movimentações (livro-razão imutável, como hoje). Retirado = soma das retiradas. Separado, pendente, disponível e saldo de reserva são calculados. Não há contador gravado que possa divergir do histórico.
- Toda decisão grava quem, quando e motivo: aprovação e redução (`pedido_itens` + `pedidos.aprovado_por/em`), cancelamento (`pedido_item_cancelamentos`), ajuste e inventário (`ajustes`), importação (`importacoes_sap` + linhas), reserva (`reserva_eventos`), retirada (`retiradas`).
- Nada é apagado: cadastros de materiais e locais perdem o `delete` e passam a ser só inativados; motivos e equipes usados só são inativados. Exceção: itens de uma solicitação em rascunho continuam editáveis antes do envio, porque ainda não são decisão de ninguém.
- Toda escrita que muda estado continua passando por RPC `security definer`, com `search_path` fixo, checagem explícita de permissão, transação única e trava por material onde há baixa ou separação.

## 14. Modelo de dados

### 14.1 Tabelas novas

| Tabela | Colunas principais |
|---|---|
| `reservas` | id, numero (RES-), numero_sap (único, nulo até a aprovação), almox_id (211), status (`solicitada`, `ativa`, `cancelada`, `excluida`), data_solicitacao, data_aprovacao, origem (`manual`, `importacao`), observacao, criado_por/em, aprovacao_registrada_por/em, encerrada_por/em, motivo_encerramento |
| `reserva_itens` | id, reserva_id, material_id (único por reserva), qtd_pedida, qtd_aprovada, sap_qtd_necessaria, sap_qtd_reduzida, sap_qtd_diferenca, sap_permitido_movimento, sap_importacao_id, sap_atualizado_em |
| `reserva_eventos` | id, reserva_id, reserva_item_id, tipo, antes (jsonb), depois (jsonb), motivo, importacao_id, criado_por/em |
| `retiradas` | id, numero (RET-), almox_id (211), data_retirada, documento_sap, observacao, origem (`manual`, `conciliacao`), importacao_id, registrado_por/em |
| `retirada_itens` | id, retirada_id, reserva_item_id, material_id, quantidade > 0, entra_estoque, justificativa (obrigatória sem entrada) |
| `importacoes_sap` | id, numero (IMP-), arquivo_nome, linhas_lidas, linhas_ignoradas, linhas_bloqueadas, resumo (jsonb), importado_por/em |
| `importacao_sap_linhas` | id, importacao_id, linhas_planilha, numero_reserva, codigo_material, descricao, umb, sap_qtd_necessaria, sap_qtd_reduzida, sap_qtd_diferenca, sap_permitido_movimento, categoria, decisao, resultado, reserva_id, reserva_item_id, material_id |
| `motivos_reducao` | id, descricao (única), exige_texto, ativo, ordem |
| `pedido_item_cancelamentos` | id, pedido_item_id, quantidade > 0, motivo, cancelado_por/em |
| `equipes` | id, almox_id (base), nome (único por base, sem diferenciar maiúscula), ativa, criado_por/em |

### 14.2 Alterações

| Objeto | Mudança |
|---|---|
| `pedido_itens` | + motivo_reducao_id; `motivo_corte` vira `motivo_reducao_obs`; checagem: aprovada < solicitada exige motivo, motivo com "exige texto" exige observação |
| `pedidos` | Só bases solicitam (sai o pedido externo); status `em_transito` e `com_divergencia` proibidos |
| `remessas` | Sai o `unique (pedido_id)` |
| `saidas` | + equipe_id, + retirado_por_nome |
| `unidades` | + sigla_sap (única) |
| `movimentacoes` | + retirada_id; tipo novo `retirada_reserva` |
| `tipo_ajuste` | + `ajuste` |
| `materiais`, `almoxarifados` | Sem `delete` para o cliente |
| `v_pedido_resumo` | Substituída por `v_solicitacao_itens` |
| `fn_indicadores` | Taxa de atendimento redefinida (seção 12) |

### 14.3 Views e funções de leitura

`v_solicitacao_itens`, `v_separado` (por material e base), `v_estoque_211` (físico, separado, disponível), `v_reserva_itens`, `v_reservas` (situação calculada, alerta de 30 dias, totais), `v_reservas_por_material`, `v_conciliacao_atual` (divergências vivas da última importação), `v_inventario_locais`, `v_supervisores_base` (nome do supervisor de cada base, para quem pode ver a base), `fn_analise_solicitacao(pedido_id)`, `fn_conciliar_importacao(linhas)`.

### 14.4 RPCs

| Nova ou alterada | Função |
|---|---|
| Nova | `rpc_solicitar_reserva`, `rpc_aprovar_reserva`, `rpc_alterar_reserva_item`, `rpc_cancelar_reserva`, `rpc_excluir_reserva`, `rpc_reativar_reserva` |
| Nova | `rpc_registrar_retirada` |
| Nova | `rpc_aplicar_importacao` |
| Nova | `rpc_cancelar_separado` |
| Nova | `rpc_registrar_entrega` (substitui `rpc_enviar_remessa_pedido`) |
| Alterada | `rpc_aprovar_pedido` (motivos padronizados, limite do disponível, trava) |
| Alterada | `rpc_cancelar_pedido` (em atendimento: cancela todo o separado) |
| Alterada | `rpc_registrar_recebimento`, `rpc_tratar_divergencia` (conclusão da solicitação por `fn_atualizar_solicitacao`; reenvio respeita o disponível) |
| Alterada | `rpc_registrar_saida` (equipe, quem retirou, disponível no 211) |
| Alterada | `rpc_registrar_ajuste` (gestora ou admin; tipos `implantacao`, `inventario`, `ajuste`; contagem completa) |
| Alterada | `rpc_registrar_recebimento_externo` (sem pedido: só entrada sem reserva) |

RLS das tabelas novas: leitura para quem pode ver o 211 (reservas, retiradas, importações) ou o local (equipes, cancelamentos pela solicitação); escrita só por RPC, exceto motivos de redução e equipes, que seguem o padrão dos cadastros (RLS por perfil, sem `delete`).

## 15. O que sai

- Pedido externo ao 3256 e a tela "Entradas do 3256" (vira Reservas, Retiradas e Entrada sem reserva).
- A regra "uma remessa por pedido; o que não foi enviado vira corte".
- A coluna "diferença de atendimento" e a view `v_pedido_resumo`.
- Ajuste de inventário pelo supervisor.
- A regra "saldo inicial só antes de o local operar".

## 16. Testes

- **pgTAP**: cada RPC nova e alterada, com os caminhos permitidos e os bloqueios de cada perfil (supervisor tentando ver reserva, aprovar acima do disponível, retirar acima do saldo, cancelar mais que o separado, ajustar estoque); fórmulas das views; conciliação com cada categoria; aplicação que falha quando a situação mudou.
- **Vitest**: leitura da planilha SAP (cabeçalho, totais, zeros à esquerda, decimais, UMB, linhas somadas), validação da planilha de inventário, busca com os prefixos novos.
- **E2E (Playwright)**: reserva solicitada → aprovada → retirada → estoque do 211; solicitação com redução e motivo → cancelamento parcial → duas entregas → recebimento com divergência → conclusão; importação com os blocos da conciliação; inventário de uma base; saída com equipe; supervisor sem acesso a reservas.

## 17. Ordem de implementação

Cada fase termina com pgTAP, testes unitários, E2E e validação do usuário antes da próxima. O plano de implementação detalhado é escrito uma fase por vez, para cada um caber numa revisão.

1. **Fundação**: perfil da gestora, motivos de redução, equipes e saída com equipe, sigla SAP nas unidades, ajuste só pela gestora e admin, cadastros sem `delete`.
2. **Solicitações**: análise com contexto, aprovação com motivos e limite do disponível, separado, cancelamento parcial, várias entregas, conclusão, telas renomeadas (SOL-).
3. **Estoque e inventário**: estoque do 211, situação de inventário, inventário por local, ajuste forçado.
4. **Reservas e retiradas**: ciclo da reserva, retirada, consolidado por material, entrada sem reserva; sai o pedido externo.
5. **Importação SAP**: leitura, conciliação, aplicação, histórico.
6. **Visões**: início da gestora, atendimento por base, material, indicadores ajustados, busca.
7. **Fechamento**: README, plano, contagem de testes. Aplicar as migrations no remoto só com autorização do usuário.

## 18. Fora do escopo

- Integração com o SAP além da planilha.
- Estoque por equipe (a equipe é registrada na saída, mas o controle vai até a base).
- Estoque mínimo e sugestão de solicitação.
- Modo offline.
- Perfil novo de visualização: o papel `gestao` já cumpre esse papel.

## 19. Pendências do usuário

- Lista de equipes de cada supervisor e base.
- Renomear repositório no GitHub, pasta local, projeto no Supabase e no Claude Design.
