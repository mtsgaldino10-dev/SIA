/* @ds-bundle: {"format":4,"namespace":"SIADesignSystem_ad870b","components":[{"name":"Marca","sourcePath":"components/brand/Marca.jsx"},{"name":"Simbolo","sourcePath":"components/brand/Simbolo.jsx"},{"name":"Donut","sourcePath":"components/charts/Donut.jsx"},{"name":"GraficoLinha","sourcePath":"components/charts/GraficoLinha.jsx"},{"name":"Sparkline","sourcePath":"components/charts/Sparkline.jsx"},{"name":"Dados","sourcePath":"components/data/Dados.jsx"},{"name":"Doc","sourcePath":"components/data/Doc.jsx"},{"name":"Etiqueta","sourcePath":"components/data/Etiqueta.jsx"},{"name":"ItemLista","sourcePath":"components/data/ItemLista.jsx"},{"name":"Qtd","sourcePath":"components/data/Qtd.jsx"},{"name":"Tabela","sourcePath":"components/data/Tabela.jsx"},{"name":"Aviso","sourcePath":"components/feedback/Aviso.jsx"},{"name":"Carregando","sourcePath":"components/feedback/Carregando.jsx"},{"name":"Fita","sourcePath":"components/feedback/Fita.jsx"},{"name":"StatusBadge","sourcePath":"components/feedback/StatusBadge.jsx"},{"name":"Vazio","sourcePath":"components/feedback/Vazio.jsx"},{"name":"Abas","sourcePath":"components/forms/Abas.jsx"},{"name":"Botao","sourcePath":"components/forms/Botao.jsx"},{"name":"Campo","sourcePath":"components/forms/Campo.jsx"},{"name":"Entrada","sourcePath":"components/forms/Entrada.jsx"},{"name":"MaterialBusca","sourcePath":"components/forms/MaterialBusca.jsx"},{"name":"Selecao","sourcePath":"components/forms/Selecao.jsx"},{"name":"CabecalhoMovel","sourcePath":"components/layout/BarraInferior.jsx"},{"name":"BarraInferior","sourcePath":"components/layout/BarraInferior.jsx"},{"name":"Breadcrumb","sourcePath":"components/layout/Breadcrumb.jsx"},{"name":"BuscaComando","sourcePath":"components/layout/BuscaComando.jsx"},{"name":"Cartao","sourcePath":"components/layout/Cartao.jsx"},{"name":"MenuLateral","sourcePath":"components/layout/MenuLateral.jsx"},{"name":"PaginaTopo","sourcePath":"components/layout/PaginaTopo.jsx"}],"sourceHashes":{"components/brand/Marca.jsx":"e940d200fb4b","components/brand/Simbolo.jsx":"bc8767e0c529","components/charts/Donut.jsx":"9415823f58af","components/charts/GraficoLinha.jsx":"c019ff005480","components/charts/Sparkline.jsx":"fd358a557885","components/data/Dados.jsx":"8e412980a6fa","components/data/Doc.jsx":"ae8a5ab08af6","components/data/Etiqueta.jsx":"38cd83fffdc1","components/data/ItemLista.jsx":"660b617d760a","components/data/Qtd.jsx":"2cd5a6ac4666","components/data/Tabela.jsx":"28a224f6dd6c","components/feedback/Aviso.jsx":"9c0181e98375","components/feedback/Carregando.jsx":"e02735b1b81e","components/feedback/Fita.jsx":"7775b0a75f64","components/feedback/StatusBadge.jsx":"889afb1340f3","components/feedback/Vazio.jsx":"0d035c5c82bd","components/forms/Abas.jsx":"f35fdb849939","components/forms/Botao.jsx":"b9fe4fa46afa","components/forms/Campo.jsx":"bbb8cf18fa72","components/forms/Entrada.jsx":"3ee305b47217","components/forms/MaterialBusca.jsx":"e09d944f4fef","components/forms/Selecao.jsx":"3e758c6623e5","components/layout/BarraInferior.jsx":"111baa48ecdc","components/layout/Breadcrumb.jsx":"30a265357981","components/layout/BuscaComando.jsx":"4fd3f8f84532","components/layout/Cartao.jsx":"e1adc3f3c7c6","components/layout/MenuLateral.jsx":"f63c7530866d","components/layout/PaginaTopo.jsx":"eeacd5140d47","ui_kits/sia-movel/Movel.jsx":"aef13d66f818","ui_kits/sia-web/Cadastros.jsx":"a07721cc174e","ui_kits/sia-web/Guia.jsx":"02a4977b15dd","ui_kits/sia-web/Operacao.jsx":"2e75e7baa8ad","ui_kits/sia-web/Painel.jsx":"d239fba5b2f2","ui_kits/sia-web/Pedidos.jsx":"cae4e18b244b","ui_kits/sia-web/Shell.jsx":"d82f2363e230","ui_kits/sia-web/dados.js":"a160755a5dbf"},"inlinedExternals":[],"unexposedExports":[{"name":"estiloControle","sourcePath":"components/forms/Entrada.jsx"},{"name":"formatarDoc","sourcePath":"components/data/Doc.jsx"},{"name":"formatarQtd","sourcePath":"components/data/Qtd.jsx"},{"name":"tomStatus","sourcePath":"components/feedback/StatusBadge.jsx"}]} */

(() => {

const __ds_ns = (window.SIADesignSystem_ad870b = window.SIADesignSystem_ad870b || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Simbolo.jsx
try { (() => {
/** Símbolo Warefly: asa de três penas em arco ascendente (armazém que voa). */
function Simbolo({
  tamanho = 26,
  cor = 'var(--cor-marca)',
  cor2 = 'var(--cor-asa)'
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: tamanho,
    height: tamanho,
    viewBox: "0 0 32 32",
    "aria-hidden": "true",
    style: {
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("g", {
    fill: "none",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 21.5Q15 20 27.5 5",
    stroke: cor,
    strokeWidth: "3.4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6.5 25.5Q16 25 24 15",
    stroke: cor2,
    strokeWidth: "3.4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9.5 29Q16.5 29 20.5 23.5",
    stroke: cor2,
    strokeWidth: "3.4",
    opacity: "0.6"
  })));
}
Object.assign(__ds_scope, { Simbolo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Simbolo.jsx", error: String((e && e.message) || e) }); }

// components/brand/Marca.jsx
try { (() => {
function Marca({
  comNome = false,
  cor = 'inherit'
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      color: cor
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Simbolo, null), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 1.35rem/1 var(--fonte)',
      letterSpacing: '-0.01em'
    }
  }, "Warefly"), comNome && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: '0.8rem',
      color: 'color-mix(in srgb, currentColor 70%, transparent)'
    }
  }, "Gest\xE3o de almoxarifado")));
}
Object.assign(__ds_scope, { Marca });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Marca.jsx", error: String((e && e.message) || e) }); }

// components/charts/Donut.jsx
try { (() => {
const nf = new Intl.NumberFormat('pt-BR');
/** Donut com legenda (rótulo + valor em mono + %). */
function Donut({
  fatias,
  centro,
  legendaCentro,
  tamanho = 168,
  espessura = 22
}) {
  const total = fatias.reduce((s, f) => s + f.valor, 0) || 1;
  const r = (tamanho - espessura) / 2,
    c = 2 * Math.PI * r;
  let acc = 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: tamanho,
      height: tamanho,
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: tamanho,
    height: tamanho,
    viewBox: '0 0 ' + tamanho + ' ' + tamanho,
    style: {
      transform: 'rotate(-90deg)'
    },
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: tamanho / 2,
    cy: tamanho / 2,
    r: r,
    fill: "none",
    stroke: "var(--st-neutro-fundo)",
    strokeWidth: espessura
  }), fatias.map((f, i) => {
    const len = f.valor / total * c;
    const off = -acc;
    acc += len;
    return /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: tamanho / 2,
      cy: tamanho / 2,
      r: r,
      fill: "none",
      stroke: f.cor,
      strokeWidth: espessura,
      strokeDasharray: Math.max(len - 2, 0) + ' ' + c,
      strokeDashoffset: off
    });
  })), centro !== undefined && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'grid',
      placeContent: 'center',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 1.9rem/1.1 var(--fonte-mono)',
      color: 'var(--cor-estrutura)'
    }
  }, centro), legendaCentro && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--texto-2)'
    }
  }, legendaCentro))), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      flex: 1,
      minWidth: 160
    }
  }, fatias.map((f, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: '0.92rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 2,
      background: f.cor,
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, f.rotulo), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--fonte-mono)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, nf.format(f.valor)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--fonte-mono)',
      color: 'var(--texto-2)',
      width: 44,
      textAlign: 'right'
    }
  }, Math.round(f.valor / total * 100), "%")))));
}
Object.assign(__ds_scope, { Donut });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/Donut.jsx", error: String((e && e.message) || e) }); }

// components/charts/GraficoLinha.jsx
try { (() => {
const {
  useState,
  useRef
} = React;
const nf = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1
});
/** Gráfico de linha com grade horizontal, rótulos X e tooltip no hover. */
function GraficoLinha({
  series,
  rotulosX,
  altura = 220,
  unidade = ''
}) {
  const [idx, setIdx] = useState(null);
  const ref = useRef(null);
  const W = 640,
    H = altura,
    pl = 36,
    pr = 12,
    pt = 12,
    pb = 26;
  const n = rotulosX.length;
  const max = Math.max.apply(null, series.flatMap(s => s.valores)) * 1.15 || 1;
  const x = i => pl + i / (n - 1) * (W - pl - pr);
  const y = v => pt + (1 - v / max) * (H - pt - pb);
  const grade = [0, 0.25, 0.5, 0.75, 1].map(f => max * f);
  function mover(e) {
    const b = ref.current.getBoundingClientRect();
    const rx = (e.clientX - b.left) / b.width * W;
    setIdx(Math.max(0, Math.min(n - 1, Math.round((rx - pl) / (W - pl - pr) * (n - 1)))));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    ref: ref,
    viewBox: '0 0 ' + W + ' ' + H,
    width: "100%",
    height: H,
    preserveAspectRatio: "none",
    onMouseMove: mover,
    onMouseLeave: () => setIdx(null),
    style: {
      display: 'block',
      overflow: 'visible'
    }
  }, grade.map((g, i) => /*#__PURE__*/React.createElement("g", {
    key: i
  }, /*#__PURE__*/React.createElement("line", {
    x1: pl,
    x2: W - pr,
    y1: y(g),
    y2: y(g),
    stroke: "var(--borda)",
    strokeDasharray: i ? '3 4' : undefined,
    vectorEffect: "non-scaling-stroke"
  }), /*#__PURE__*/React.createElement("text", {
    x: pl - 6,
    y: y(g) + 4,
    textAnchor: "end",
    fontSize: "11",
    fill: "var(--texto-2)",
    fontFamily: "var(--fonte-mono)"
  }, Math.round(g)))), rotulosX.map((r, i) => (i % Math.ceil(n / 8) === 0 || i === n - 1) && /*#__PURE__*/React.createElement("text", {
    key: i,
    x: x(i),
    y: H - 6,
    textAnchor: "middle",
    fontSize: "11",
    fill: "var(--texto-2)",
    fontFamily: "var(--fonte-mono)"
  }, r)), idx !== null && /*#__PURE__*/React.createElement("line", {
    x1: x(idx),
    x2: x(idx),
    y1: pt,
    y2: H - pb,
    stroke: "var(--cor-neutra)",
    vectorEffect: "non-scaling-stroke"
  }), series.map((s, si) => /*#__PURE__*/React.createElement("path", {
    key: si,
    d: s.valores.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' '),
    fill: "none",
    stroke: s.cor,
    strokeWidth: "2",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke"
  }))), idx !== null && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 'calc(' + x(idx) / W * 100 + '% + ' + (idx > n / 2 ? '-12px' : '12px') + ')',
      transform: idx > n / 2 ? 'translateX(-100%)' : 'none',
      background: 'var(--cor-estrutura)',
      color: 'var(--cor-fundo)',
      borderRadius: 'var(--raio)',
      padding: '8px 10px',
      fontSize: '0.8rem',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      boxShadow: 'var(--sombra-flutuante)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--fonte-mono)',
      marginBottom: 4,
      color: 'color-mix(in srgb, #fff 75%, transparent)'
    }
  }, rotulosX[idx]), series.map((s, si) => /*#__PURE__*/React.createElement("div", {
    key: si,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: s.cor
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, s.nome), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--fonte-mono)',
      marginLeft: 12
    }
  }, nf.format(s.valores[idx]), unidade)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 16,
      marginTop: 8,
      fontSize: '0.85rem',
      color: 'var(--texto-2)'
    }
  }, series.map((s, si) => /*#__PURE__*/React.createElement("span", {
    key: si,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 14,
      height: 3,
      borderRadius: 2,
      background: s.cor
    }
  }), s.nome))));
}
Object.assign(__ds_scope, { GraficoLinha });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/GraficoLinha.jsx", error: String((e && e.message) || e) }); }

// components/charts/Sparkline.jsx
try { (() => {
/** Mini-gráfico de linha para KPIs. */
function Sparkline({
  valores,
  cor = 'var(--cor-marca)',
  largura = 84,
  altura = 30
}) {
  const max = Math.max.apply(null, valores),
    min = Math.min.apply(null, valores),
    r = max - min || 1;
  const pts = valores.map((v, i) => [i / (valores.length - 1) * (largura - 4) + 2, altura - 3 - (v - min) / r * (altura - 6)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const u = pts[pts.length - 1];
  return /*#__PURE__*/React.createElement("svg", {
    width: largura,
    height: altura,
    viewBox: '0 0 ' + largura + ' ' + altura,
    "aria-hidden": "true",
    style: {
      flex: 'none',
      color: cor
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: d + ' L' + u[0].toFixed(1) + ' ' + altura + ' L2 ' + altura + ' Z',
    fill: "currentColor",
    opacity: "0.1"
  }), /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: u[0],
    cy: u[1],
    r: "2.6",
    fill: "currentColor"
  }));
}
Object.assign(__ds_scope, { Sparkline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/charts/Sparkline.jsx", error: String((e && e.message) || e) }); }

// components/data/Dados.jsx
try { (() => {
/** Lista de pares rótulo/valor (dl.dados). */
function Dados({
  itens
}) {
  return /*#__PURE__*/React.createElement("dl", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'max-content 1fr',
      gap: '6px 16px',
      margin: 0
    }
  }, itens.map(([dt, dd], i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, /*#__PURE__*/React.createElement("dt", {
    style: {
      color: 'var(--texto-2)',
      fontSize: '0.9rem'
    }
  }, dt), /*#__PURE__*/React.createElement("dd", {
    style: {
      margin: 0
    }
  }, dd))));
}
Object.assign(__ds_scope, { Dados });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Dados.jsx", error: String((e && e.message) || e) }); }

// components/data/Doc.jsx
try { (() => {
function formatarDoc(prefixo, numero) {
  return prefixo + '-' + String(numero).padStart(6, '0');
}
/** Número de documento: PED-000123, REM-…, SAI-…, AJU-… em mono. */
function Doc({
  prefixo,
  numero,
  forte = false
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--fonte-mono)',
      fontVariantNumeric: 'tabular-nums',
      fontWeight: forte ? 500 : 400
    }
  }, formatarDoc(prefixo, numero));
}
Object.assign(__ds_scope, { formatarDoc, Doc });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Doc.jsx", error: String((e && e.message) || e) }); }

// components/data/Etiqueta.jsx
try { (() => {
const {
  useState
} = React;
const COR = {
  alerta: 'var(--st-alerta)',
  transito: 'var(--st-transito)',
  ok: 'var(--st-ok)',
  info: 'var(--st-info)'
};
/** Indicador: legenda com ponto de status, número grande, minigráfico opcional. */
function Etiqueta({
  valor,
  legenda,
  tom,
  compacta = false,
  serie,
  variacao,
  onClick,
  href
}) {
  const [h, setH] = useState(false);
  const clicavel = !!(onClick || href);
  const Tag = href ? 'a' : clicavel ? 'button' : 'div';
  const cor = COR[tom] || 'var(--cor-marca)';
  return /*#__PURE__*/React.createElement(Tag, {
    href: href,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      font: 'inherit',
      background: 'var(--superficie)',
      border: '1px solid ' + (clicavel && h ? 'var(--borda-forte)' : 'var(--borda)'),
      boxShadow: clicavel && h ? '0 4px 14px rgba(11,36,71,.08)' : 'var(--sombra-cartao)',
      transition: 'box-shadow .15s, border-color .15s',
      borderRadius: 'var(--raio-folha)',
      padding: compacta ? '12px 14px' : '16px 18px',
      color: 'inherit',
      textDecoration: 'none',
      cursor: clicavel ? 'pointer' : 'default'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: compacta ? '0.8rem' : '0.85rem',
      color: 'var(--texto-2)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 7,
      height: 7,
      borderRadius: 999,
      background: cor,
      flex: 'none'
    }
  }), legenda), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 ' + (compacta ? '1.5rem' : '1.9rem') + '/1.1 var(--fonte)',
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '-0.01em',
      color: 'var(--cor-estrutura)'
    }
  }, valor), variacao ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 0.75rem var(--fonte)',
      padding: '2px 8px',
      borderRadius: 999,
      background: 'var(--st-ok-fundo)',
      color: 'var(--st-ok-texto)'
    }
  }, variacao) : null)), serie && serie.length > 1 ? /*#__PURE__*/React.createElement(__ds_scope.Sparkline, {
    valores: serie,
    cor: cor
  }) : null));
}
Object.assign(__ds_scope, { Etiqueta });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Etiqueta.jsx", error: String((e && e.message) || e) }); }

// components/data/ItemLista.jsx
try { (() => {
const {
  useState
} = React;
/** Item de lista em cartão (uso principal no celular). */
function ItemLista({
  titulo,
  direita,
  sub,
  subDireita,
  onClick,
  href
}) {
  const [h, setH] = useState(false);
  const clicavel = !!(onClick || href);
  const Tag = href ? 'a' : clicavel ? 'button' : 'div';
  return /*#__PURE__*/React.createElement(Tag, {
    href: href,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      font: 'inherit',
      background: 'var(--superficie)',
      border: '1px solid ' + (clicavel && h ? 'var(--borda-forte)' : 'var(--borda)'),
      borderRadius: 'var(--raio)',
      padding: '12px 14px',
      color: 'inherit',
      textDecoration: 'none',
      cursor: clicavel ? 'pointer' : 'default'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", null, titulo), direita), (sub || subDireita) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      alignItems: 'center',
      marginTop: 4,
      fontSize: '0.875rem'
    }
  }, /*#__PURE__*/React.createElement("span", null, sub), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--texto-2)'
    }
  }, subDireita)));
}
Object.assign(__ds_scope, { ItemLista });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ItemLista.jsx", error: String((e && e.message) || e) }); }

// components/data/Qtd.jsx
try { (() => {
const nf = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3
});
function formatarQtd(v) {
  return v === null || v === undefined || v === '' ? '—' : nf.format(Number(v));
}
/** Quantidade em mono tabular, vírgula decimal, unidade em cinza. sinal: +2,5 · −1 */
function Qtd({
  valor,
  unidade,
  sinal = false
}) {
  const n = Number(valor);
  const txt = sinal && valor !== null && valor !== undefined ? n === 0 ? '0' : (n < 0 ? '−' : '+') + nf.format(Math.abs(n)) : formatarQtd(valor);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--fonte-mono)',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap'
    }
  }, txt, unidade && valor !== null && valor !== undefined ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--texto-2)'
    }
  }, " ", unidade) : null);
}
Object.assign(__ds_scope, { formatarQtd, Qtd });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Qtd.jsx", error: String((e && e.message) || e) }); }

// components/data/Tabela.jsx
try { (() => {
const {
  useState
} = React;
function Linha({
  l,
  colunas,
  onLinha,
  ultima
}) {
  const [h, setH] = useState(false);
  return /*#__PURE__*/React.createElement("tr", {
    onClick: onLinha ? () => onLinha(l) : undefined,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      cursor: onLinha ? 'pointer' : 'default'
    }
  }, colunas.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.chave,
    style: {
      padding: '9px 12px',
      textAlign: c.num ? 'right' : 'left',
      borderBottom: ultima ? 0 : '1px solid var(--borda)',
      verticalAlign: 'middle',
      whiteSpace: c.num ? 'nowrap' : undefined,
      fontFamily: c.mono || c.num ? 'var(--fonte-mono)' : undefined,
      fontVariantNumeric: 'tabular-nums',
      width: c.largura,
      background: onLinha && h ? 'var(--marca-suave)' : undefined
    }
  }, c.render ? c.render(l) : l[c.chave])));
}
function Tabela({
  colunas,
  linhas,
  chave = 'id',
  onLinha,
  alturaMax
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto',
      overflowY: alturaMax ? 'auto' : undefined,
      maxHeight: alturaMax,
      border: '1px solid var(--borda)',
      borderRadius: 'var(--raio)',
      background: 'var(--superficie)'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '0.92rem'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, colunas.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.chave,
    style: {
      padding: '9px 12px',
      textAlign: c.num ? 'right' : 'left',
      borderBottom: '1px solid var(--borda)',
      fontWeight: 600,
      fontSize: '0.78rem',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      color: 'var(--texto-2)',
      background: 'color-mix(in srgb, var(--cor-fundo) 70%, white)',
      whiteSpace: 'nowrap',
      position: alturaMax ? 'sticky' : undefined,
      top: 0
    }
  }, c.rotulo)))), /*#__PURE__*/React.createElement("tbody", null, linhas.map((l, i) => /*#__PURE__*/React.createElement(Linha, {
    key: l[chave] ?? i,
    l: l,
    colunas: colunas,
    onLinha: onLinha,
    ultima: i === linhas.length - 1
  })))));
}
Object.assign(__ds_scope, { Tabela });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Tabela.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Aviso.jsx
try { (() => {
const T = {
  erro: 'alerta',
  sucesso: 'ok',
  info: 'info',
  atencao: 'transito'
};
function Aviso({
  tipo = 'info',
  children
}) {
  if (!children) return null;
  const k = T[tipo];
  return /*#__PURE__*/React.createElement("div", {
    role: tipo === 'erro' ? 'alert' : 'status',
    style: {
      borderRadius: 'var(--raio)',
      padding: '10px 12px',
      border: '1px solid color-mix(in srgb, var(--st-' + k + ') 40%, transparent)',
      fontSize: '0.95rem',
      background: 'var(--st-' + k + '-fundo)',
      color: 'var(--st-' + k + '-texto)'
    }
  }, children);
}
Object.assign(__ds_scope, { Aviso });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Aviso.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Carregando.jsx
try { (() => {
function Carregando({
  texto = 'Carregando…'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24,
      color: 'var(--texto-2)'
    }
  }, texto);
}
Object.assign(__ds_scope, { Carregando });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Carregando.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Fita.jsx
try { (() => {
/** Faixa de atenção: linha âmbar fina e arredondada para ajustes e divergências. */
function Fita({
  altura = 3
}) {
  return /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      height: altura,
      background: 'var(--st-transito)',
      borderRadius: 'var(--raio-pilula)'
    }
  });
}
Object.assign(__ds_scope, { Fita });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Fita.jsx", error: String((e && e.message) || e) }); }

// components/feedback/StatusBadge.jsx
try { (() => {
const ROTULOS = {
  rascunho: 'Rascunho',
  solicitado: 'Solicitado',
  aprovado: 'Aprovado',
  em_transito: 'Em trânsito',
  recebido: 'Recebido',
  recebida: 'Recebida',
  com_divergencia: 'Com divergência',
  divergencia: 'Divergência',
  encerrado: 'Encerrado',
  encerrada: 'Encerrada',
  cancelado: 'Cancelado'
};
function tomStatus(s) {
  switch (s) {
    case 'solicitado':
    case 'aprovado':
      return 'info';
    case 'em_transito':
      return 'transito';
    case 'recebido':
    case 'recebida':
    case 'encerrado':
    case 'encerrada':
      return 'ok';
    case 'com_divergencia':
    case 'divergencia':
      return 'alerta';
    default:
      return 'neutro';
  }
}
const TONS = {
  info: ['--st-info-fundo', '--st-info-texto', '--st-info'],
  transito: ['--st-transito-fundo', '--st-transito-texto', '--st-transito'],
  ok: ['--st-ok-fundo', '--st-ok-texto', '--st-ok'],
  alerta: ['--st-alerta-fundo', '--st-alerta-texto', '--st-alerta'],
  neutro: ['--st-neutro-fundo', '--st-neutro-texto', '--st-neutro']
};
/** Badge de status: sempre com texto, cor só reforça. */
function StatusBadge({
  status,
  tom,
  children
}) {
  const t = TONS[tom || tomStatus(status)] || TONS.neutro;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '2px 8px',
      borderRadius: 999,
      font: '500 0.78rem/1.5 var(--fonte)',
      whiteSpace: 'nowrap',
      background: 'var(' + t[0] + ')',
      color: 'var(' + t[1] + ')'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: 'var(' + t[2] + ')',
      flex: 'none'
    }
  }), children || ROTULOS[status] || status);
}
Object.assign(__ds_scope, { tomStatus, StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Vazio.jsx
try { (() => {
function Vazio({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '32px 16px',
      color: 'var(--texto-2)',
      border: '1px dashed var(--borda-forte)',
      borderRadius: 'var(--raio)'
    }
  }, children);
}
Object.assign(__ds_scope, { Vazio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Vazio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Abas.jsx
try { (() => {
function Abas({
  abas,
  ativa,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '1px solid var(--borda)',
      overflowX: 'auto'
    }
  }, abas.map(a => {
    const sel = a.id === ativa;
    return /*#__PURE__*/React.createElement("button", {
      key: a.id,
      role: "tab",
      "aria-selected": sel,
      onClick: () => onChange && onChange(a.id),
      style: {
        background: 'none',
        border: 0,
        borderBottom: '3px solid ' + (sel ? 'var(--cor-marca)' : 'transparent'),
        padding: '8px 12px',
        font: '500 0.95rem var(--fonte)',
        color: sel ? 'var(--cor-estrutura)' : 'var(--texto-2)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        gap: 6,
        alignItems: 'center'
      }
    }, a.rotulo, a.contagem !== undefined ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: 'var(--fonte-mono)',
        fontSize: '0.8rem',
        color: 'var(--texto-2)'
      }
    }, a.contagem) : null);
  }));
}
Object.assign(__ds_scope, { Abas });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Abas.jsx", error: String((e && e.message) || e) }); }

// components/forms/Botao.jsx
try { (() => {
const {
  useState
} = React;
const V = {
  primario: {
    n: {
      background: 'var(--cor-marca)',
      color: 'var(--cor-fundo)'
    },
    h: {
      background: 'var(--marca-hover)'
    }
  },
  secundario: {
    n: {
      background: 'transparent',
      color: 'var(--cor-estrutura)',
      borderColor: 'var(--borda-forte)'
    },
    h: {
      borderColor: 'var(--cor-estrutura)'
    }
  },
  perigo: {
    n: {
      background: 'transparent',
      color: 'var(--st-alerta-texto)',
      borderColor: 'var(--st-alerta)'
    },
    h: {
      background: 'var(--st-alerta-fundo)'
    }
  },
  fantasma: {
    n: {
      background: 'transparent',
      color: 'var(--texto-2)',
      paddingLeft: 8,
      paddingRight: 8
    },
    h: {
      color: 'var(--cor-estrutura)'
    }
  }
};
/** Botão com verbo: "Enviar pedido", "Registrar recebimento". */
function Botao({
  variante = 'primario',
  tamanho = 'normal',
  disabled = false,
  largo = false,
  href,
  onClick,
  type = 'button',
  children
}) {
  const [h, setH] = useState(false);
  const v = V[variante] || V.primario;
  const peq = tamanho === 'peq';
  const Tag = href ? 'a' : 'button';
  return /*#__PURE__*/React.createElement(Tag, {
    href: href,
    type: href ? undefined : type,
    disabled: disabled,
    onClick: disabled ? undefined : onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: Object.assign({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: peq ? 32 : 42,
      padding: peq ? '4px 10px' : '8px 16px',
      borderRadius: 'var(--raio)',
      border: '1px solid transparent',
      font: '600 ' + (peq ? '0.85rem' : '0.95rem') + ' var(--fonte)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      opacity: disabled ? 0.55 : 1,
      width: largo ? '100%' : undefined
    }, v.n, peq && variante === 'fantasma' ? {
      paddingLeft: 8,
      paddingRight: 8
    } : null, h && !disabled ? v.h : null)
  }, children);
}
Object.assign(__ds_scope, { Botao });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Botao.jsx", error: String((e && e.message) || e) }); }

// components/forms/Campo.jsx
try { (() => {
/** Rótulo + controle + ajuda/erro. */
function Campo({
  rotulo,
  ajuda,
  erro,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: Object.assign({
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0
    }, style)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.85rem',
      fontWeight: 500,
      color: 'var(--texto)'
    }
  }, rotulo), children, erro ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--st-alerta-texto)'
    }
  }, erro) : ajuda ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--texto-2)'
    }
  }, ajuda) : null);
}
Object.assign(__ds_scope, { Campo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Campo.jsx", error: String((e && e.message) || e) }); }

// components/forms/Entrada.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState
} = React;
const estiloControle = {
  font: '400 1rem var(--fonte)',
  color: 'var(--texto)',
  background: 'var(--superficie)',
  border: '1px solid var(--borda-forte)',
  borderRadius: 'var(--raio)',
  padding: '9px 10px',
  minHeight: 42,
  width: '100%'
};
/** Campo de texto. num = mono à direita (quantidades). */
function Entrada({
  value,
  onChange,
  num = false,
  invalido = false,
  type = 'text',
  placeholder,
  multilinha = false,
  ...resto
}) {
  const [f, setF] = useState(false);
  const Tag = multilinha ? 'textarea' : 'input';
  return /*#__PURE__*/React.createElement(Tag, _extends({
    type: multilinha ? undefined : type,
    value: value,
    placeholder: placeholder,
    inputMode: num ? 'decimal' : undefined,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: Object.assign({}, estiloControle, num ? {
      fontFamily: 'var(--fonte-mono)',
      textAlign: 'right'
    } : null, multilinha ? {
      minHeight: 72,
      resize: 'vertical'
    } : null, invalido ? {
      borderColor: 'var(--st-alerta)'
    } : null, f ? {
      outline: '2px solid var(--cor-marca)',
      outlineOffset: 1
    } : {
      outline: 'none'
    }),
    "aria-invalid": invalido || undefined
  }, resto));
}
Object.assign(__ds_scope, { estiloControle, Entrada });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Entrada.jsx", error: String((e && e.message) || e) }); }

// components/forms/MaterialBusca.jsx
try { (() => {
const {
  useState
} = React;
/** Busca de material por código SAP ou descrição, com lista flutuante. */
function MaterialBusca({
  rotulo = 'Adicionar material',
  materiais = [],
  onEscolher,
  aberta
}) {
  const [t, setT] = useState('');
  const [sel, setSel] = useState(0);
  const q = t.trim().toLowerCase();
  const res = aberta || q ? materiais.filter(m => !q || m.codigo_sap.includes(q) || m.descricao.toLowerCase().includes(q)).slice(0, 8) : [];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Campo, {
    rotulo: rotulo
  }, /*#__PURE__*/React.createElement(__ds_scope.Entrada, {
    type: "search",
    value: t,
    onChange: setT,
    placeholder: "C\xF3digo SAP ou descri\xE7\xE3o"
  })), res.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      zIndex: 15,
      left: 0,
      right: 0,
      top: 'calc(100% + 4px)',
      background: 'var(--superficie)',
      border: '1px solid var(--borda-forte)',
      borderRadius: 'var(--raio)',
      maxHeight: 320,
      overflowY: 'auto',
      boxShadow: 'var(--sombra-flutuante)'
    }
  }, res.map((m, i) => /*#__PURE__*/React.createElement("button", {
    key: m.codigo_sap,
    onMouseEnter: () => setSel(i),
    onClick: () => {
      onEscolher && onEscolher(m);
      setT('');
    },
    style: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      background: i === sel ? 'var(--marca-suave)' : 'none',
      border: 0,
      borderBottom: '1px solid var(--borda)',
      padding: '8px 12px',
      font: '400 0.92rem var(--fonte)',
      color: 'var(--texto)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--fonte-mono)'
    }
  }, m.codigo_sap), " \xB7 ", m.descricao, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--texto-2)'
    }
  }, "(", m.unidade, ")")))));
}
Object.assign(__ds_scope, { MaterialBusca });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/MaterialBusca.jsx", error: String((e && e.message) || e) }); }

// components/forms/Selecao.jsx
try { (() => {
const {
  useState
} = React;
function Selecao({
  value,
  onChange,
  opcoes,
  vazio
}) {
  const [f, setF] = useState(false);
  return /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: e => onChange && onChange(e.target.value),
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: Object.assign({}, __ds_scope.estiloControle, f ? {
      outline: '2px solid var(--cor-marca)',
      outlineOffset: 1
    } : {
      outline: 'none'
    })
  }, vazio ? /*#__PURE__*/React.createElement("option", {
    value: ""
  }, vazio) : null, opcoes.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.valor,
    value: o.valor
  }, o.rotulo)));
}
Object.assign(__ds_scope, { Selecao });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Selecao.jsx", error: String((e && e.message) || e) }); }

// components/layout/BarraInferior.jsx
try { (() => {
/** Cabeçalho claro fixo do celular. */
function CabecalhoMovel({
  nome
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '10px 16px',
      background: 'var(--superficie)',
      color: 'var(--cor-estrutura)',
      borderBottom: '1px solid var(--borda)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Marca, {
    cor: "var(--cor-estrutura)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.875rem',
      color: 'var(--texto-2)'
    }
  }, nome));
}
/** Barra inferior do celular: até 4 itens principais + "Mais". Item ativo em petróleo. */
function BarraInferior({
  itens,
  ativo,
  onNavegar,
  onMais
}) {
  const est = a => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    color: a ? 'var(--cor-marca)' : 'var(--texto-2)',
    font: '500 0.72rem var(--fonte)',
    background: 'none',
    border: 0,
    cursor: 'pointer'
  });
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Menu r\xE1pido",
    style: {
      height: 64,
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: '1fr',
      background: 'var(--superficie)',
      borderTop: '1px solid var(--borda)',
      flex: 'none'
    }
  }, itens.slice(0, 4).map(i => /*#__PURE__*/React.createElement("button", {
    key: i.id,
    style: est(i.id === ativo),
    onClick: () => onNavegar && onNavegar(i.id)
  }, i.rotulo)), /*#__PURE__*/React.createElement("button", {
    style: est(false),
    onClick: onMais
  }, "Mais"));
}
Object.assign(__ds_scope, { CabecalhoMovel, BarraInferior });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/BarraInferior.jsx", error: String((e && e.message) || e) }); }

// components/layout/Breadcrumb.jsx
try { (() => {
function Breadcrumb({
  itens
}) {
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Trilha",
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      alignItems: 'center',
      fontSize: '0.875rem',
      color: 'var(--texto-2)'
    }
  }, itens.map((it, i) => {
    const o = typeof it === 'string' ? {
      rotulo: it
    } : it;
    const ultimo = i === itens.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, i > 0 && /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true"
    }, "/"), o.onClick && !ultimo ? /*#__PURE__*/React.createElement("button", {
      onClick: o.onClick,
      style: {
        background: 'none',
        border: 0,
        padding: 0,
        font: 'inherit',
        color: 'inherit',
        cursor: 'pointer'
      }
    }, o.rotulo) : /*#__PURE__*/React.createElement("span", {
      style: {
        color: ultimo ? 'var(--cor-estrutura)' : undefined,
        fontWeight: ultimo ? 500 : 400
      }
    }, o.rotulo));
  }));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/layout/BuscaComando.jsx
try { (() => {
/** Gatilho de busca global com atalho ⌘K. */
function BuscaComando({
  placeholder = 'Buscar documento ou material',
  atalho = '⌘K',
  escuro = false,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      minHeight: 36,
      padding: '6px 10px',
      borderRadius: 'var(--raio)',
      border: '1px solid ' + (escuro ? 'var(--menu-divisor)' : 'var(--borda-forte)'),
      background: escuro ? 'color-mix(in srgb, var(--cor-fundo) 6%, transparent)' : 'var(--superficie)',
      color: escuro ? 'var(--menu-grupo)' : 'var(--texto-2)',
      font: '400 0.875rem var(--fonte)',
      cursor: 'pointer',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, placeholder), /*#__PURE__*/React.createElement("kbd", {
    style: {
      font: '400 0.72rem var(--fonte-mono)',
      padding: '1px 6px',
      borderRadius: 4,
      border: '1px solid ' + (escuro ? 'var(--menu-divisor)' : 'var(--borda)'),
      color: 'inherit'
    }
  }, atalho));
}
Object.assign(__ds_scope, { BuscaComando });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/BuscaComando.jsx", error: String((e && e.message) || e) }); }

// components/layout/Cartao.jsx
try { (() => {
function Mini({
  children,
  onClick,
  rotulo
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    "aria-label": rotulo,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      minHeight: 30,
      padding: '3px 10px',
      border: '1px solid var(--borda-forte)',
      borderRadius: 'var(--raio)',
      background: 'transparent',
      font: '500 0.82rem var(--fonte)',
      color: 'var(--cor-estrutura)',
      cursor: 'pointer',
      whiteSpace: 'nowrap'
    }
  }, children);
}
/** Cartão: superfície clara, borda aço 30%, raio 6px. Cabeçalho opcional com filtro de período e menu "…". */
function Cartao({
  titulo,
  sub,
  acao,
  periodo,
  onPeriodo,
  menu = false,
  onMenu,
  fita = false,
  children,
  espacamento = 16
}) {
  const temCab = titulo || acao || periodo || menu;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--superficie)',
      border: '1px solid var(--borda)',
      borderRadius: 'var(--raio)',
      padding: espacamento,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      minWidth: 0
    }
  }, temCab && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: '1 1 160px'
    }
  }, titulo && /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: '1.15rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: 'var(--cor-estrutura)'
    }
  }, titulo), sub && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      fontSize: '0.875rem',
      color: 'var(--texto-2)'
    }
  }, sub)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      flex: 'none'
    }
  }, acao, periodo && /*#__PURE__*/React.createElement(Mini, {
    onClick: onPeriodo,
    rotulo: "Per\xEDodo"
  }, periodo, " ", /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: '0.7rem'
    }
  }, "\u25BE")), menu && /*#__PURE__*/React.createElement(Mini, {
    onClick: onMenu,
    rotulo: "Mais op\xE7\xF5es"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      letterSpacing: '0.1em',
      lineHeight: 1
    }
  }, "\u2026")))), fita && /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      height: 3,
      background: 'var(--st-transito)',
      borderRadius: 'var(--raio-pilula)'
    }
  }), children);
}
Object.assign(__ds_scope, { Cartao });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Cartao.jsx", error: String((e && e.message) || e) }); }

// components/layout/MenuLateral.jsx
try { (() => {
const {
  useState
} = React;
function Item({
  it,
  ativo,
  onNavegar
}) {
  const [h, setH] = useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => onNavegar && onNavegar(it.id),
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    "aria-current": ativo ? 'page' : undefined,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 10px',
      borderRadius: 'var(--raio)',
      border: 0,
      width: '100%',
      textAlign: 'left',
      font: '500 1rem var(--fonte)',
      cursor: 'pointer',
      color: ativo ? 'var(--menu-texto-ativo)' : 'var(--menu-texto)',
      background: ativo ? 'var(--menu-ativo)' : h ? 'var(--menu-hover)' : 'transparent',
      boxShadow: ativo ? '0 0 0 1px var(--borda), var(--sombra-cartao)' : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, it.rotulo), it.contagem ? /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 0.75rem var(--fonte-mono)',
      padding: '0 6px',
      borderRadius: 999,
      background: it.alerta ? 'var(--st-alerta)' : 'var(--cor-marca)',
      color: '#fff'
    }
  }, it.contagem) : null);
}
/** Menu lateral claro, item ativo em cartão branco, grupos em caixa-alta. */
function MenuLateral({
  grupos,
  ativo,
  onNavegar,
  usuario,
  busca = true,
  onBusca,
  onSair,
  altura = '100dvh'
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: 232,
      flex: 'none',
      height: altura,
      position: 'sticky',
      top: 0,
      background: 'var(--menu-fundo)',
      color: 'var(--menu-texto)',
      padding: '20px 12px',
      borderRight: '1px solid var(--borda)',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 10px'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Marca, {
    cor: "var(--cor-estrutura)"
  })), busca && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.BuscaComando, {
    placeholder: "Buscar",
    onClick: onBusca
  })), /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Menu principal",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      marginTop: busca ? 8 : 24,
      flex: 1
    }
  }, grupos.map(g => /*#__PURE__*/React.createElement(React.Fragment, {
    key: g.grupo
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '14px 10px 4px',
      fontSize: '0.7rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--menu-grupo)'
    }
  }, g.grupo), g.itens.map(it => /*#__PURE__*/React.createElement(Item, {
    key: it.id,
    it: it,
    ativo: it.id === ativo,
    onNavegar: onNavegar
  }))))), usuario && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--menu-divisor)',
      padding: '12px 10px 0',
      fontSize: '0.8rem',
      color: 'var(--texto-2)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--cor-estrutura)',
      fontWeight: 500
    }
  }, usuario.nome), /*#__PURE__*/React.createElement("div", null, usuario.papel), /*#__PURE__*/React.createElement("button", {
    onClick: onSair,
    style: {
      marginTop: 8,
      background: 'none',
      border: '1px solid var(--borda-forte)',
      color: 'var(--menu-texto)',
      borderRadius: 'var(--raio)',
      padding: '6px 10px',
      font: '500 0.8rem var(--fonte)',
      cursor: 'pointer'
    }
  }, "Sair"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, "Gest\xE3o de almoxarifado")));
}
Object.assign(__ds_scope, { MenuLateral });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/MenuLateral.jsx", error: String((e && e.message) || e) }); }

// components/layout/PaginaTopo.jsx
try { (() => {
function PaginaTopo({
  titulo,
  sub,
  voltar,
  trilha,
  acoes
}) {
  return /*#__PURE__*/React.createElement("div", null, trilha && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Breadcrumb, {
    itens: trilha
  })), voltar && /*#__PURE__*/React.createElement("button", {
    onClick: voltar.onClick,
    style: {
      display: 'inline-block',
      marginBottom: 8,
      fontSize: '0.875rem',
      color: 'var(--texto-2)',
      background: 'none',
      border: 0,
      padding: 0,
      cursor: 'pointer',
      font: 'inherit'
    }
  }, "\u2190 ", voltar.rotulo), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: 'var(--cor-estrutura)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      alignItems: 'center'
    }
  }, titulo), sub && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '4px 0 0',
      color: 'var(--texto-2)'
    }
  }, sub)), acoes && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      alignItems: 'center'
    }
  }, acoes)));
}
Object.assign(__ds_scope, { PaginaTopo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/PaginaTopo.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sia-movel/Movel.jsx
try { (() => {
const M = window.SIADesignSystem_ad870b;
function InicioBase({
  ir
}) {
  const {
    PaginaTopo,
    Cartao,
    Etiqueta,
    ItemLista,
    Doc,
    Botao
  } = M;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(PaginaTopo, {
    titulo: "Ol\xE1, Carlos Lima",
    sub: "Gest\xE3o de almoxarifado"
  }), /*#__PURE__*/React.createElement("h2", null, "Minhas bases"), /*#__PURE__*/React.createElement(Cartao, {
    titulo: "Base Contagem",
    acao: /*#__PURE__*/React.createElement(Botao, {
      variante: "fantasma",
      tamanho: "peq"
    }, "Ver saldo")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Etiqueta, {
    compacta: true,
    valor: 214,
    legenda: "Materiais com saldo"
  }), /*#__PURE__*/React.createElement(Etiqueta, {
    compacta: true,
    valor: 1,
    legenda: "Remessas a caminho",
    tom: "transito"
  }), /*#__PURE__*/React.createElement(Etiqueta, {
    compacta: true,
    valor: 2,
    legenda: "Pedidos abertos",
    tom: "info"
  }), /*#__PURE__*/React.createElement(Etiqueta, {
    compacta: true,
    valor: 0,
    legenda: "Diverg\xEAncias pendentes",
    tom: "ok"
  })), /*#__PURE__*/React.createElement(ItemLista, {
    onClick: () => ir('receber'),
    titulo: /*#__PURE__*/React.createElement(Doc, {
      prefixo: "REM",
      numero: 418
    }),
    direita: /*#__PURE__*/React.createElement("span", {
      className: "sec peq"
    }, "enviada 29/09/2026")
  })), /*#__PURE__*/React.createElement(Cartao, {
    titulo: "Base Betim",
    acao: /*#__PURE__*/React.createElement(Botao, {
      variante: "fantasma",
      tamanho: "peq"
    }, "Ver saldo")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Etiqueta, {
    compacta: true,
    valor: 187,
    legenda: "Materiais com saldo"
  }), /*#__PURE__*/React.createElement(Etiqueta, {
    compacta: true,
    valor: 1,
    legenda: "Remessas a caminho",
    tom: "transito"
  }), /*#__PURE__*/React.createElement(Etiqueta, {
    compacta: true,
    valor: 1,
    legenda: "Pedidos abertos",
    tom: "info"
  }), /*#__PURE__*/React.createElement(Etiqueta, {
    compacta: true,
    valor: 2,
    legenda: "Diverg\xEAncias pendentes",
    tom: "alerta"
  })), /*#__PURE__*/React.createElement(ItemLista, {
    onClick: () => ir('receber'),
    titulo: /*#__PURE__*/React.createElement(Doc, {
      prefixo: "REM",
      numero: 415
    }),
    direita: /*#__PURE__*/React.createElement("span", {
      className: "sec peq"
    }, "enviada 26/09/2026")
  })));
}
function Receber({
  ir
}) {
  const {
    PaginaTopo,
    Aviso,
    Cartao,
    Entrada,
    Campo,
    Selecao,
    Botao,
    Qtd
  } = M;
  const itens = [{
    c: '10004521',
    d: 'Cabo de cobre nu 16mm²',
    u: 'M',
    e: 300
  }, {
    c: '10017388',
    d: 'Conector cunha estribo',
    u: 'UN',
    e: 40
  }, {
    c: '10061204',
    d: 'Chave fusível 15kV 100A',
    u: 'PC',
    e: 9
  }, {
    c: '10022010',
    d: 'Fita isolante 19mm x 20m',
    u: 'RL',
    e: 10
  }];
  const [cont, setCont] = React.useState({});
  const [mot, setMot] = React.useState({});
  const [quem, setQuem] = React.useState('');
  const [foto, setFoto] = React.useState(false);
  const [erro, setErro] = React.useState(null);
  const n = s => Number(String(s || '').replace(',', '.'));
  function registrar() {
    const f = itens.find(i => cont[i.c] === undefined || cont[i.c] === '');
    if (f) return setErro(f.c + ' (contado): Informe a quantidade.');
    const m = itens.find(i => n(cont[i.c]) < i.e && !mot[i.c]);
    if (m) return setErro('Informe o motivo da diferença de ' + m.c + '.');
    if (!quem.trim()) return setErro('Informe o nome de quem contou o material.');
    if (!foto) return setErro('Anexe a foto da guia assinada ou da carga.');
    setErro(null);
    ir('feito');
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(PaginaTopo, {
    voltar: {
      rotulo: 'Remessa',
      onClick: () => ir('inicio')
    },
    titulo: /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontFamily: 'var(--fonte)'
      }
    }, "Receber REM-000418"),
    sub: "Almoxarifado regional \u2192 Base Contagem \xB7 enviada em 29/09/2026"
  }), /*#__PURE__*/React.createElement(Aviso, {
    tipo: "info"
  }, "Lance o que foi contado na guia assinada. Item avariado n\xE3o entra no saldo: conte s\xF3 o que chegou em condi\xE7\xF5es de uso."), /*#__PURE__*/React.createElement(Cartao, {
    titulo: "Contagem"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, itens.map(i => {
    const menos = cont[i.c] !== undefined && cont[i.c] !== '' && n(cont[i.c]) < i.e;
    return /*#__PURE__*/React.createElement("div", {
      key: i.c,
      style: {
        border: '1px solid var(--borda)',
        borderRadius: 'var(--raio)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        borderLeft: menos ? '6px solid var(--st-alerta)' : '1px solid var(--borda)'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "mono"
    }, i.c), /*#__PURE__*/React.createElement("div", {
      className: "peq"
    }, i.d)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        alignItems: 'end'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.85rem',
        fontWeight: 500
      }
    }, "Na guia"), /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: 42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end'
      }
    }, /*#__PURE__*/React.createElement(Qtd, {
      valor: i.e,
      unidade: i.u
    }))), /*#__PURE__*/React.createElement(Campo, {
      rotulo: "Contado"
    }, /*#__PURE__*/React.createElement(Entrada, {
      num: true,
      value: cont[i.c] || '',
      onChange: v => setCont({
        ...cont,
        [i.c]: v
      })
    }))), menos && /*#__PURE__*/React.createElement(Campo, {
      rotulo: "Motivo da diferen\xE7a"
    }, /*#__PURE__*/React.createElement(Selecao, {
      value: mot[i.c] || '',
      onChange: v => setMot({
        ...mot,
        [i.c]: v
      }),
      vazio: "Escolha\u2026",
      opcoes: [{
        valor: 'falta',
        rotulo: 'Falta'
      }, {
        valor: 'avaria',
        rotulo: 'Avaria (não entra no saldo)'
      }, {
        valor: 'trocado',
        rotulo: 'Trocado'
      }]
    })));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Botao, {
    variante: "fantasma",
    tamanho: "peq",
    onClick: () => setCont(Object.fromEntries(itens.map(i => [i.c, cont[i.c] || String(i.e)])))
  }, "Preencher vazios igual \xE0 guia"))), /*#__PURE__*/React.createElement(Cartao, {
    titulo: "Confer\xEAncia"
  }, /*#__PURE__*/React.createElement(Campo, {
    rotulo: "Quem contou",
    ajuda: "Nome de quem conferiu o material na chegada (n\xE3o precisa ter login)."
  }, /*#__PURE__*/React.createElement(Entrada, {
    value: quem,
    onChange: setQuem
  })), /*#__PURE__*/React.createElement(Campo, {
    rotulo: "Data da chegada",
    ajuda: "A data real, mesmo que o lan\xE7amento seja depois."
  }, /*#__PURE__*/React.createElement(Entrada, {
    type: "date",
    value: "2026-09-29"
  })), /*#__PURE__*/React.createElement(Campo, {
    rotulo: "Foto da guia assinada ou da carga",
    ajuda: foto ? 'guia-REM-000418.jpg' : 'Obrigatória. Pode tirar pelo celular.'
  }, /*#__PURE__*/React.createElement(Botao, {
    variante: "secundario",
    onClick: () => setFoto(true)
  }, foto ? 'Trocar foto' : 'Tirar foto'))), /*#__PURE__*/React.createElement(Aviso, {
    tipo: "erro"
  }, erro), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      bottom: 8,
      background: 'var(--cor-fundo)',
      padding: '8px 0',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(Botao, {
    largo: true,
    onClick: registrar
  }, "Registrar recebimento")));
}
function Feito({
  ir
}) {
  const {
    PaginaTopo,
    Aviso,
    Doc,
    StatusBadge,
    Botao,
    Cartao,
    Dados
  } = M;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(PaginaTopo, {
    titulo: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Doc, {
      prefixo: "REM",
      numero: 418
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "recebida"
    })),
    sub: "Almoxarifado regional \u2192 Base Contagem"
  }), /*#__PURE__*/React.createElement(Aviso, {
    tipo: "sucesso"
  }, "Recebimento registrado."), /*#__PURE__*/React.createElement(Cartao, null, /*#__PURE__*/React.createElement(Dados, {
    itens: [['Recebida', '29/09/2026'], ['Conferido por', 'Carlos Lima'], ['Foto', 'guia-REM-000418.jpg']]
  })), /*#__PURE__*/React.createElement(Botao, {
    variante: "secundario",
    onClick: () => ir('inicio')
  }, "Voltar ao in\xEDcio"));
}
window.InicioBase = InicioBase;
window.Receber = Receber;
window.Feito = Feito;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sia-movel/Movel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sia-web/Cadastros.jsx
try { (() => {
const K = window.SIADesignSystem_ad870b;
function ImportarMateriais() {
  const {
    PaginaTopo,
    Cartao,
    Campo,
    Selecao,
    Botao,
    StatusBadge,
    Tabela,
    Aviso
  } = K;
  const [etapa, setEtapa] = React.useState(0);
  const cols = ['Material', 'Texto breve material', 'UMB', 'Preço médio', 'Grupo merc.'].map((c, i) => ({
    valor: String(i),
    rotulo: c
  }));
  const validas = [{
    l: 5,
    c: '10080331',
    d: 'Cruzeta de concreto 2m',
    u: 'UN',
    p: 'R$ 186,40'
  }, {
    l: 6,
    c: '10080340',
    d: 'Mão francesa plana',
    u: 'PC',
    p: 'R$ 22,15'
  }, {
    l: 7,
    c: '10080412',
    d: 'Arruela quadrada 50mm',
    u: 'CJ',
    p: 'R$ 3,90'
  }];
  const bloq = [{
    l: 8,
    c: '10004521',
    m: 'Código já cadastrado'
  }, {
    l: 11,
    c: '10090001',
    m: 'Unidade "CX" não cadastrada'
  }];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PaginaTopo, {
    trilha: ['Cadastros', 'Materiais', 'Importar'],
    titulo: "Importar materiais",
    sub: "Planilha exportada do SAP (XLSX ou CSV). C\xF3digos j\xE1 cadastrados n\xE3o s\xE3o atualizados."
  }), /*#__PURE__*/React.createElement(Cartao, null, /*#__PURE__*/React.createElement(Campo, {
    rotulo: "1. Arquivo",
    ajuda: etapa ? 'ALMOXARIF 211.xlsx' : 'A linha de cabeçalho é detectada automaticamente.'
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Botao, {
    variante: "secundario",
    onClick: () => setEtapa(1)
  }, "Escolher arquivo"), /*#__PURE__*/React.createElement("span", {
    className: "sec peq"
  }, etapa ? 'ALMOXARIF 211.xlsx · 1.284 linhas' : 'Nenhum arquivo escolhido')))), etapa >= 1 && /*#__PURE__*/React.createElement(Cartao, {
    titulo: "2. Colunas",
    sub: "Cabe\xE7alho na linha 4. Confira a coluna de cada campo."
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 12
    }
  }, [['Código SAP', '0'], ['Descrição', '1'], ['Unidade', '2'], ['Preço (opcional)', '3'], ['Grupo (opcional)', '4']].map(([r, v]) => /*#__PURE__*/React.createElement(Campo, {
    key: r,
    rotulo: r
  }, /*#__PURE__*/React.createElement(Selecao, {
    value: v,
    vazio: "\u2014 n\xE3o usar \u2014",
    opcoes: cols
  }))))), etapa >= 1 && etapa < 2 && /*#__PURE__*/React.createElement(Cartao, {
    titulo: "3. Pr\xE9-visualiza\xE7\xE3o"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(StatusBadge, {
    tom: "ok"
  }, "1.282 prontos para importar"), /*#__PURE__*/React.createElement(StatusBadge, {
    tom: "alerta"
  }, "2 bloqueados")), /*#__PURE__*/React.createElement(Tabela, {
    chave: "l",
    linhas: bloq,
    colunas: [{
      chave: 'l',
      rotulo: 'Linha',
      mono: true
    }, {
      chave: 'c',
      rotulo: 'Código',
      mono: true
    }, {
      chave: 'm',
      rotulo: 'Motivo'
    }]
  }), /*#__PURE__*/React.createElement(Tabela, {
    chave: "l",
    linhas: validas,
    colunas: [{
      chave: 'l',
      rotulo: 'Linha',
      mono: true
    }, {
      chave: 'c',
      rotulo: 'Código',
      mono: true
    }, {
      chave: 'd',
      rotulo: 'Descrição'
    }, {
      chave: 'u',
      rotulo: 'Unid.'
    }, {
      chave: 'p',
      rotulo: 'Preço',
      num: true
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Botao, {
    onClick: () => setEtapa(2)
  }, "Importar 1.282 materiais"))), etapa === 2 && /*#__PURE__*/React.createElement(Cartao, {
    titulo: "Relat\xF3rio"
  }, /*#__PURE__*/React.createElement(Aviso, {
    tipo: "sucesso"
  }, "1.282 materiais inseridos."), /*#__PURE__*/React.createElement(Aviso, {
    tipo: "atencao"
  }, "2 linhas bloqueadas."), /*#__PURE__*/React.createElement(Tabela, {
    chave: "l",
    linhas: bloq,
    colunas: [{
      chave: 'l',
      rotulo: 'Linha',
      mono: true
    }, {
      chave: 'c',
      rotulo: 'Código',
      mono: true
    }, {
      chave: 'm',
      rotulo: 'Motivo'
    }]
  })));
}
function Login({
  entrar
}) {
  const {
    Marca,
    Campo,
    Entrada,
    Botao,
    Aviso
  } = K;
  const [u, setU] = React.useState('');
  const [s, setS] = React.useState('');
  const [erro, setErro] = React.useState(null);
  function ok(e) {
    e.preventDefault();
    if (!u || !s) return setErro('Informe usuário e senha.');
    entrar();
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100dvh',
      display: 'grid',
      placeItems: 'center',
      padding: 16,
      background: 'var(--cor-estrutura)'
    }
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: ok,
    style: {
      width: 'min(100%, 380px)',
      background: 'var(--superficie)',
      borderTop: '6px solid var(--cor-marca)',
      borderRadius: 'var(--raio)',
      padding: '28px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Marca, {
    comNome: true,
    cor: "var(--cor-estrutura)"
  }), /*#__PURE__*/React.createElement(Campo, {
    rotulo: "Usu\xE1rio",
    ajuda: "Ex.: matheus.galdino (sem @engelmig.com.br)"
  }, /*#__PURE__*/React.createElement(Entrada, {
    value: u,
    onChange: setU,
    autoComplete: "username"
  })), /*#__PURE__*/React.createElement(Campo, {
    rotulo: "Senha"
  }, /*#__PURE__*/React.createElement(Entrada, {
    type: "password",
    value: s,
    onChange: setS
  })), /*#__PURE__*/React.createElement(Aviso, {
    tipo: "erro"
  }, erro), /*#__PURE__*/React.createElement(Botao, {
    type: "submit"
  }, "Entrar"), /*#__PURE__*/React.createElement("p", {
    className: "sec peq"
  }, "Sem acesso? Pe\xE7a ao administrador do sistema.")));
}
window.ImportarMateriais = ImportarMateriais;
window.Login = Login;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sia-web/Cadastros.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sia-web/Guia.jsx
try { (() => {
const G = window.SIADesignSystem_ad870b;
function Guia({
  ir
}) {
  const {
    Marca,
    Botao
  } = G;
  const D = window.SIA_DADOS;
  const bd = {
    border: '1px solid #000',
    padding: '6px 8px',
    textAlign: 'left',
    fontSize: '11pt'
  };
  const th = {
    ...bd,
    fontWeight: 600,
    background: '#f2f2f2'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--cor-fundo)',
      minHeight: '100dvh',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      maxWidth: 800,
      margin: '0 auto 16px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => ir('remessas'),
    style: {
      background: 'none',
      border: 0,
      padding: 0,
      font: 'inherit',
      fontSize: '0.875rem',
      color: 'var(--texto-2)',
      cursor: 'pointer'
    }
  }, "\u2190 Voltar para a remessa"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Botao, {
    onClick: () => window.print()
  }, "Imprimir")), /*#__PURE__*/React.createElement("article", {
    style: {
      background: 'white',
      color: 'black',
      maxWidth: 800,
      margin: '0 auto',
      padding: 24,
      fontSize: '12pt',
      boxShadow: '0 1px 0 var(--borda)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Marca, null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '9pt'
    }
  }, "Gest\xE3o de almoxarifado")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: '16pt',
      color: 'black'
    }
  }, "Guia de remessa ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "REM-000418")), /*#__PURE__*/React.createElement("div", null, "Atendimento"))), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Origem"), /*#__PURE__*/React.createElement("td", {
    style: bd
  }, "211 \xB7 Almoxarifado regional"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Destino"), /*#__PURE__*/React.createElement("td", {
    style: bd
  }, "B03 \xB7 Base Contagem")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Data do envio"), /*#__PURE__*/React.createElement("td", {
    style: bd
  }, "29/09/2026"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Enviado por"), /*#__PURE__*/React.createElement("td", {
    style: bd
  }, "Ana Souza")), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Pedido"), /*#__PURE__*/React.createElement("td", {
    style: bd,
    className: "mono"
  }, "PED-001042"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Documento"), /*#__PURE__*/React.createElement("td", {
    style: bd,
    className: "mono"
  }, "4900218734")))), /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: th
  }, "C\xF3digo SAP"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Descri\xE7\xE3o"), /*#__PURE__*/React.createElement("th", {
    style: th
  }, "Unid."), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      textAlign: 'right'
    }
  }, "Enviada"), /*#__PURE__*/React.createElement("th", {
    style: {
      ...th,
      width: 110
    }
  }, "Contagem"))), /*#__PURE__*/React.createElement("tbody", null, D.itensPedido.map(i => /*#__PURE__*/React.createElement("tr", {
    key: i.codigo_sap
  }, /*#__PURE__*/React.createElement("td", {
    style: bd,
    className: "mono"
  }, i.codigo_sap), /*#__PURE__*/React.createElement("td", {
    style: bd
  }, i.descricao), /*#__PURE__*/React.createElement("td", {
    style: bd
  }, i.unidade), /*#__PURE__*/React.createElement("td", {
    style: {
      ...bd,
      textAlign: 'right'
    },
    className: "mono"
  }, i.codigo_sap === '10061204' ? 9 : i.aprovada), /*#__PURE__*/React.createElement("td", {
    style: bd
  }))), [0, 1, 2].map(k => /*#__PURE__*/React.createElement("tr", {
    key: 'v' + k
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      ...bd,
      height: 28
    }
  }), /*#__PURE__*/React.createElement("td", {
    style: bd
  }), /*#__PURE__*/React.createElement("td", {
    style: bd
  }), /*#__PURE__*/React.createElement("td", {
    style: bd
  }), /*#__PURE__*/React.createElement("td", {
    style: bd
  }))))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '9pt',
      marginTop: 8
    }
  }, "Linhas em branco: itens que chegaram sem estar na guia. Anote falta, sobra, avaria ou troca ao lado da contagem."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 32,
      marginTop: 48
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid #000',
      paddingTop: 4,
      fontSize: '10pt'
    }
  }, "Conferido por (nome e assinatura)"), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid #000',
      paddingTop: 4,
      fontSize: '10pt'
    }
  }, "Data da chegada"))));
}
window.Guia = Guia;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sia-web/Guia.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sia-web/Operacao.jsx
try { (() => {
const O = window.SIADesignSystem_ad870b;
function Saldo() {
  const {
    PaginaTopo,
    Campo,
    Selecao,
    Entrada,
    Tabela,
    Qtd,
    Vazio
  } = O;
  const D = window.SIA_DADOS;
  const [almox, setAlmox] = React.useState('211');
  const [t, setT] = React.useState('');
  const [zer, setZer] = React.useState(false);
  const q = t.trim().toLowerCase();
  const linhas = D.materiais.map(m => ({
    ...m,
    saldo: almox === '211' ? m.saldo : Math.round(m.saldo / 7)
  })).filter(m => (zer || m.saldo !== 0) && (!q || m.codigo_sap.includes(q) || m.descricao.toLowerCase().includes(q)));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PaginaTopo, {
    trilha: ['Operação', 'Saldo'],
    titulo: "Saldo",
    sub: "Saldo \xE9 sempre a soma das movimenta\xE7\xF5es. Nunca \xE9 editado."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Campo, {
    rotulo: "Almoxarifado"
  }, /*#__PURE__*/React.createElement(Selecao, {
    value: almox,
    onChange: setAlmox,
    opcoes: D.bases.map(b => ({
      valor: b.id,
      rotulo: b.codigo + ' · ' + b.nome
    }))
  })), /*#__PURE__*/React.createElement(Campo, {
    rotulo: "Buscar"
  }, /*#__PURE__*/React.createElement(Entrada, {
    type: "search",
    placeholder: "C\xF3digo SAP ou descri\xE7\xE3o",
    value: t,
    onChange: setT
  }))), /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      fontSize: '0.875rem'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: zer,
    onChange: e => setZer(e.target.checked),
    style: {
      accentColor: 'var(--cor-marca)'
    }
  }), "Mostrar materiais zerados"), linhas.length === 0 ? /*#__PURE__*/React.createElement(Vazio, null, "Nenhum material com saldo aqui.") : /*#__PURE__*/React.createElement(Tabela, {
    chave: "codigo_sap",
    linhas: linhas,
    colunas: [{
      chave: 'codigo_sap',
      rotulo: 'Código',
      mono: true
    }, {
      chave: 'descricao',
      rotulo: 'Descrição'
    }, {
      chave: 'saldo',
      rotulo: 'Saldo',
      num: true,
      render: l => /*#__PURE__*/React.createElement(Qtd, {
        valor: l.saldo
      })
    }, {
      chave: 'unidade',
      rotulo: 'Unid.'
    }, {
      chave: 'ult',
      rotulo: 'Última mov.',
      render: l => /*#__PURE__*/React.createElement("span", {
        className: "sec peq"
      }, l.ult)
    }]
  }), /*#__PURE__*/React.createElement("p", {
    className: "sec peq"
  }, linhas.length, " materiais"));
}
function Remessas({
  ir
}) {
  const {
    PaginaTopo,
    ItemLista,
    Doc,
    StatusBadge,
    Botao
  } = O;
  const r = [{
    n: 418,
    s: 'em_transito',
    rota: '211 → Base Contagem',
    q: 'enviada 29/09/2026'
  }, {
    n: 415,
    s: 'em_transito',
    rota: '211 → Base Betim',
    q: 'enviada 26/09/2026'
  }, {
    n: 412,
    s: 'com_divergencia',
    rota: '211 → Base Betim',
    q: 'recebida 24/09/2026'
  }, {
    n: 410,
    s: 'encerrada',
    rota: '211 → Base Sete Lagoas',
    q: 'recebida 23/09/2026'
  }];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PaginaTopo, {
    trilha: ['Operação', 'Remessas'],
    titulo: "Remessas",
    sub: "Toda remessa viaja com a guia impressa."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, r.map(x => /*#__PURE__*/React.createElement(ItemLista, {
    key: x.n,
    onClick: () => ir('guia'),
    titulo: /*#__PURE__*/React.createElement("strong", null, /*#__PURE__*/React.createElement(Doc, {
      prefixo: "REM",
      numero: x.n
    })),
    direita: /*#__PURE__*/React.createElement(StatusBadge, {
      status: x.s
    }),
    sub: x.rota,
    subDireita: x.q
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Botao, {
    variante: "secundario",
    onClick: () => ir('guia')
  }, "Imprimir guia REM-000418")));
}
function Divergencias() {
  const {
    PaginaTopo,
    Tabela,
    Doc,
    Botao,
    Cartao,
    Campo,
    Selecao,
    Entrada,
    Aviso,
    Qtd
  } = O;
  const D = window.SIA_DADOS;
  const [lista, setLista] = React.useState(D.divergencias);
  const [aberta, setAberta] = React.useState(null);
  const [just, setJust] = React.useState('');
  const [erro, setErro] = React.useState(null);
  const [ok, setOk] = React.useState(null);
  const d = lista.find(x => x.id === aberta);
  function registrar() {
    if (!just.trim()) return setErro('Informe a justificativa do tratamento.');
    setLista(lista.filter(x => x.id !== aberta));
    setAberta(null);
    setJust('');
    setErro(null);
    setOk('Tratamento registrado.');
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PaginaTopo, {
    trilha: ['Operação', 'Divergências'],
    titulo: "Diverg\xEAncias",
    sub: "Diverg\xEAncia n\xE3o some sozinha: fica aberta at\xE9 ser tratada com justificativa."
  }), /*#__PURE__*/React.createElement(Aviso, {
    tipo: "sucesso"
  }, ok), /*#__PURE__*/React.createElement(Tabela, {
    linhas: lista,
    colunas: [{
      chave: 'rem',
      rotulo: 'Remessa',
      render: x => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("a", {
        href: "#",
        className: "mono"
      }, /*#__PURE__*/React.createElement(Doc, {
        prefixo: "REM",
        numero: x.rem
      })), /*#__PURE__*/React.createElement("div", {
        className: "sec peq"
      }, x.tipo))
    }, {
      chave: 'rota',
      rotulo: 'Origem → destino'
    }, {
      chave: 'm',
      rotulo: 'Material',
      render: x => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
        className: "mono"
      }, x.codigo_sap), /*#__PURE__*/React.createElement("div", {
        className: "peq"
      }, x.descricao))
    }, {
      chave: 'motivo',
      rotulo: 'Motivo'
    }, {
      chave: 'dif',
      rotulo: 'Diferença',
      num: true,
      render: x => /*#__PURE__*/React.createElement("span", null, x.dif > 0 ? 'faltou ' : 'sobrou ', /*#__PURE__*/React.createElement(Qtd, {
        valor: Math.abs(x.dif),
        unidade: x.un
      }))
    }, {
      chave: 'aberto',
      rotulo: 'Em aberto',
      num: true
    }, {
      chave: 'dias',
      rotulo: 'Dias',
      num: true
    }, {
      chave: 'a',
      rotulo: '',
      render: x => /*#__PURE__*/React.createElement(Botao, {
        variante: "secundario",
        tamanho: "peq",
        onClick: () => {
          setOk(null);
          setAberta(aberta === x.id ? null : x.id);
        }
      }, "Tratar")
    }]
  }), d && /*#__PURE__*/React.createElement(Cartao, {
    titulo: 'Tratar REM-' + String(d.rem).padStart(6, '0') + ' · ' + d.codigo_sap
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Campo, {
    rotulo: "Tratamento",
    ajuda: "A origem manda de novo. Gera uma nova remessa, com nova confer\xEAncia."
  }, /*#__PURE__*/React.createElement(Selecao, {
    value: "reenvio",
    opcoes: [{
      valor: 'reenvio',
      rotulo: 'Reenvio'
    }, {
      valor: 'baixa_transito',
      rotulo: 'Baixa em trânsito'
    }, {
      valor: 'estorno_origem',
      rotulo: 'Não saiu da origem'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Campo, {
    rotulo: "Quantidade",
    ajuda: 'Em aberto: ' + d.aberto + ' ' + d.un
  }, /*#__PURE__*/React.createElement(Entrada, {
    num: true,
    value: String(d.aberto)
  })), /*#__PURE__*/React.createElement(Campo, {
    rotulo: "Data"
  }, /*#__PURE__*/React.createElement(Entrada, {
    type: "date",
    value: "2026-09-29"
  }))), /*#__PURE__*/React.createElement(Campo, {
    rotulo: "Justificativa",
    style: {
      gridColumn: '1 / -1'
    }
  }, /*#__PURE__*/React.createElement(Entrada, {
    value: just,
    onChange: setJust
  }))), /*#__PURE__*/React.createElement(Aviso, {
    tipo: "erro"
  }, erro), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Botao, {
    onClick: registrar
  }, "Registrar tratamento"))));
}
window.Saldo = Saldo;
window.Remessas = Remessas;
window.Divergencias = Divergencias;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sia-web/Operacao.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sia-web/Painel.jsx
try { (() => {
const P = window.SIADesignSystem_ad870b;
function Painel({
  ir
}) {
  const {
    PaginaTopo,
    Etiqueta,
    Cartao,
    GraficoLinha,
    Donut,
    Tabela,
    ItemLista,
    Doc,
    StatusBadge,
    Botao
  } = P;
  const D = window.SIA_DADOS;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PaginaTopo, {
    trilha: ['Início', 'Painel geral'],
    titulo: "Painel do 211",
    sub: "Indicadores do per\xEDodo. Remessas paradas mostram a situa\xE7\xE3o de agora.",
    acoes: /*#__PURE__*/React.createElement(Botao, {
      variante: "secundario",
      onClick: () => ir('pedidos')
    }, "Ver fila de pedidos")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Etiqueta, {
    valor: 3,
    legenda: "Pedidos na fila",
    tom: "info",
    serie: [5, 4, 6, 3, 4, 2, 3],
    onClick: () => ir('pedidos')
  }), /*#__PURE__*/React.createElement(Etiqueta, {
    valor: 7,
    legenda: "Remessas em tr\xE2nsito",
    tom: "transito",
    serie: [4, 6, 5, 8, 6, 7, 7],
    onClick: () => ir('remessas')
  }), /*#__PURE__*/React.createElement(Etiqueta, {
    valor: 3,
    legenda: "Diverg\xEAncias abertas",
    tom: "alerta",
    serie: [1, 1, 2, 2, 4, 3, 3],
    onClick: () => ir('divergencias')
  }), /*#__PURE__*/React.createElement(Etiqueta, {
    valor: "96,4%",
    legenda: "Atendimento no per\xEDodo",
    tom: "ok",
    serie: [91, 93, 92, 95, 94, 96, 96.4]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Cartao, {
    titulo: "Remessas enviadas \xD7 recebidas",
    sub: "Por dia, todas as bases",
    periodo: "\xDAltimos 30 dias",
    menu: true
  }, /*#__PURE__*/React.createElement(GraficoLinha, {
    rotulosX: D.dias,
    unidade: " rem.",
    series: [{
      nome: 'Enviadas',
      cor: 'var(--cor-marca)',
      valores: [4, 6, 5, 8, 7, 9, 6, 10, 8, 11]
    }, {
      nome: 'Recebidas',
      cor: 'var(--cor-estrutura)',
      valores: [3, 5, 5, 6, 7, 8, 6, 8, 8, 9]
    }]
  })), /*#__PURE__*/React.createElement(Cartao, {
    titulo: "Remessas por status",
    periodo: "\xDAltimos 30 dias",
    menu: true
  }, /*#__PURE__*/React.createElement(Donut, {
    tamanho: 150,
    espessura: 20,
    centro: 48,
    legendaCentro: "remessas",
    fatias: [{
      rotulo: 'Recebida',
      valor: 31,
      cor: 'var(--st-ok)'
    }, {
      rotulo: 'Em trânsito',
      valor: 7,
      cor: 'var(--st-transito)'
    }, {
      rotulo: 'Com divergência',
      valor: 5,
      cor: 'var(--st-alerta)'
    }, {
      rotulo: 'Cancelada',
      valor: 5,
      cor: 'var(--st-neutro)'
    }]
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
      gap: 16,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(Cartao, {
    titulo: "Fila de pedidos",
    acao: /*#__PURE__*/React.createElement(Botao, {
      variante: "fantasma",
      tamanho: "peq",
      onClick: () => ir('pedidos')
    }, "Ver todos")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, D.pedidos.filter(p => p.status === 'solicitado' || p.status === 'aprovado').map(p => /*#__PURE__*/React.createElement(ItemLista, {
    key: p.numero,
    titulo: /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Doc, {
      prefixo: "PED",
      numero: p.numero
    }), " \xB7 ", p.de),
    direita: /*#__PURE__*/React.createElement(StatusBadge, {
      status: p.status
    }),
    onClick: () => ir('pedido')
  })))), /*#__PURE__*/React.createElement(Cartao, {
    titulo: "Indicadores por almoxarifado",
    sub: "Atendimento = enviado \xF7 solicitado. Diverg\xEAncia = remessas com diferen\xE7a \xF7 recebidas.",
    periodo: "\xDAltimos 30 dias",
    menu: true
  }, /*#__PURE__*/React.createElement(Tabela, {
    chave: "cod",
    linhas: D.indicadores,
    colunas: [{
      chave: 'nome',
      rotulo: 'Almoxarifado',
      render: i => /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
        className: "mono"
      }, i.cod), " ", i.nome)
    }, {
      chave: 'at',
      rotulo: 'Atendimento',
      num: true
    }, {
      chave: 'rec',
      rotulo: 'Recebidas',
      num: true
    }, {
      chave: 'div',
      rotulo: 'Divergência',
      num: true,
      render: i => /*#__PURE__*/React.createElement("span", {
        style: i.div !== '0%' ? {
          color: 'var(--st-alerta-texto)',
          fontWeight: 600
        } : null
      }, i.div)
    }, {
      chave: 'tr',
      rotulo: 'Trânsito (dias)',
      num: true
    }]
  }))), /*#__PURE__*/React.createElement(Cartao, {
    titulo: "Ajustes de invent\xE1rio",
    sub: "Todo ajuste aparece aqui em destaque, com a justificativa de quem contou.",
    fita: true
  }, /*#__PURE__*/React.createElement(Tabela, {
    linhas: [{
      id: 1,
      n: 87,
      a: 'Base Betim',
      d: '24/09/2026',
      j: 'Contagem mensal: 2 rolos de fita a menos',
      i: 1,
      v: 'R$ 48,00'
    }, {
      id: 2,
      n: 86,
      a: 'Almoxarifado regional',
      d: '20/09/2026',
      j: 'Inventário rotativo corredor C',
      i: 3,
      v: 'R$ 212,40'
    }],
    colunas: [{
      chave: 'n',
      rotulo: 'Ajuste',
      render: a => /*#__PURE__*/React.createElement(Doc, {
        prefixo: "AJU",
        numero: a.n
      })
    }, {
      chave: 'a',
      rotulo: 'Almoxarifado'
    }, {
      chave: 'd',
      rotulo: 'Data'
    }, {
      chave: 'j',
      rotulo: 'Justificativa'
    }, {
      chave: 'i',
      rotulo: 'Itens',
      num: true
    }, {
      chave: 'v',
      rotulo: 'Valor absoluto',
      num: true
    }]
  })));
}
window.Painel = Painel;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sia-web/Painel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sia-web/Pedidos.jsx
try { (() => {
const PD = window.SIADesignSystem_ad870b;
function Pedidos({
  ir
}) {
  const {
    PaginaTopo,
    Abas,
    ItemLista,
    Doc,
    StatusBadge,
    Botao,
    Vazio
  } = PD;
  const D = window.SIA_DADOS;
  const [aba, setAba] = React.useState('fila');
  const lista = D.pedidos.filter(p => aba === 'fila' ? ['solicitado', 'aprovado'].includes(p.status) : aba === 'abertos' ? !['encerrado', 'cancelado'].includes(p.status) : true);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PaginaTopo, {
    trilha: ['Operação', 'Pedidos'],
    titulo: "Pedidos",
    acoes: /*#__PURE__*/React.createElement(Botao, null, "Novo pedido")
  }), /*#__PURE__*/React.createElement(Abas, {
    abas: [{
      id: 'fila',
      rotulo: 'Fila do 211',
      contagem: 3
    }, {
      id: 'abertos',
      rotulo: 'Abertos'
    }, {
      id: 'todos',
      rotulo: 'Todos'
    }],
    ativa: aba,
    onChange: setAba
  }), lista.length === 0 ? /*#__PURE__*/React.createElement(Vazio, null, "Nenhum pedido aguardando o 211.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, lista.map(p => /*#__PURE__*/React.createElement(ItemLista, {
    key: p.numero,
    onClick: () => ir('pedido'),
    titulo: /*#__PURE__*/React.createElement("strong", null, /*#__PURE__*/React.createElement(Doc, {
      prefixo: "PED",
      numero: p.numero
    })),
    direita: /*#__PURE__*/React.createElement(StatusBadge, {
      status: p.status
    }),
    sub: p.de + ' → ' + p.para,
    subDireita: p.itens + ' itens · ' + p.quando
  }))));
}
function PedidoDetalhe({
  ir
}) {
  const {
    PaginaTopo,
    Doc,
    StatusBadge,
    Cartao,
    Dados,
    Tabela,
    Entrada,
    Campo,
    Aviso,
    Botao,
    Qtd
  } = PD;
  const D = window.SIA_DADOS;
  const [qtds, setQtds] = React.useState(Object.fromEntries(D.itensPedido.map(i => [i.codigo_sap, String(i.aprovada)])));
  const [doc, setDoc] = React.useState('');
  const [erro, setErro] = React.useState(null);
  const n = s => Number(String(s).replace('.', '').replace(',', '.'));
  function enviar() {
    const f = D.itensPedido.find(i => n(qtds[i.codigo_sap]) > i.saldo);
    if (f) return setErro(f.codigo_sap + ': quantidade acima do saldo do 211.');
    ir('guia');
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(PaginaTopo, {
    trilha: [{
      rotulo: 'Pedidos',
      onClick: () => ir('pedidos')
    }, 'PED-001042'],
    titulo: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Doc, {
      prefixo: "PED",
      numero: 1042
    }), /*#__PURE__*/React.createElement(StatusBadge, {
      status: "aprovado"
    })),
    sub: "Base Contagem \u2192 211 \xB7 Almoxarifado regional"
  }), /*#__PURE__*/React.createElement(Cartao, null, /*#__PURE__*/React.createElement(Dados, {
    itens: [['Criado', '29/09/2026 08:14 por Carlos Lima'], ['Solicitado', '29/09/2026 08:20'], ['Aprovado', '29/09/2026 10:02 por Ana Souza'], ['Observação', 'Material para a obra da Av. Amazonas']]
  })), /*#__PURE__*/React.createElement(Cartao, {
    titulo: "Separa\xE7\xE3o e envio",
    sub: "Informe o que foi efetivamente separado. O que n\xE3o for enviado vira corte."
  }, /*#__PURE__*/React.createElement(Tabela, {
    chave: "codigo_sap",
    linhas: D.itensPedido,
    colunas: [{
      chave: 'm',
      rotulo: 'Material',
      render: i => /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
        className: "mono"
      }, i.codigo_sap), " \xB7 ", i.descricao)
    }, {
      chave: 'aprovada',
      rotulo: 'Aprovada',
      num: true,
      render: i => /*#__PURE__*/React.createElement(Qtd, {
        valor: i.aprovada,
        unidade: i.unidade
      })
    }, {
      chave: 'saldo',
      rotulo: 'Saldo',
      num: true,
      render: i => /*#__PURE__*/React.createElement("span", {
        style: n(qtds[i.codigo_sap]) > i.saldo ? {
          color: 'var(--st-alerta-texto)'
        } : null
      }, /*#__PURE__*/React.createElement(Qtd, {
        valor: i.saldo
      }))
    }, {
      chave: 'env',
      rotulo: 'Enviada',
      largura: 130,
      render: i => /*#__PURE__*/React.createElement(Entrada, {
        num: true,
        value: qtds[i.codigo_sap],
        invalido: n(qtds[i.codigo_sap]) > i.saldo,
        onChange: v => setQtds({
          ...qtds,
          [i.codigo_sap]: v
        }),
        "aria-label": 'Enviada de ' + i.codigo_sap
      })
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Campo, {
    rotulo: "Data do envio"
  }, /*#__PURE__*/React.createElement(Entrada, {
    type: "date",
    value: "2026-09-29"
  })), /*#__PURE__*/React.createElement(Campo, {
    rotulo: "Documento / guia",
    ajuda: "Opcional: n\xFAmero da guia ou do documento SAP."
  }, /*#__PURE__*/React.createElement(Entrada, {
    value: doc,
    onChange: setDoc
  })), /*#__PURE__*/React.createElement(Campo, {
    rotulo: "Observa\xE7\xE3o",
    style: {
      gridColumn: '1 / -1'
    }
  }, /*#__PURE__*/React.createElement(Entrada, null))), /*#__PURE__*/React.createElement(Aviso, {
    tipo: "erro"
  }, erro), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Botao, {
    variante: "perigo"
  }, "Cancelar pedido"), /*#__PURE__*/React.createElement(Botao, {
    onClick: enviar
  }, "Registrar envio"))));
}
window.Pedidos = Pedidos;
window.PedidoDetalhe = PedidoDetalhe;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sia-web/Pedidos.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sia-web/Shell.jsx
try { (() => {
const S = window.SIADesignSystem_ad870b;
function Shell({
  ativo,
  onNavegar,
  children
}) {
  const {
    MenuLateral
  } = S;
  const grupos = [{
    grupo: 'Operação',
    itens: [{
      id: 'inicio',
      rotulo: 'Início'
    }, {
      id: 'saldo',
      rotulo: 'Saldo'
    }, {
      id: 'pedidos',
      rotulo: 'Pedidos',
      contagem: 3
    }, {
      id: 'remessas',
      rotulo: 'Remessas'
    }, {
      id: 'divergencias',
      rotulo: 'Divergências',
      contagem: 3,
      alerta: true
    }, {
      id: 'historico',
      rotulo: 'Histórico'
    }]
  }, {
    grupo: 'Gestão',
    itens: [{
      id: 'painel',
      rotulo: 'Painel da gestão'
    }]
  }, {
    grupo: 'Cadastros',
    itens: [{
      id: 'materiais',
      rotulo: 'Materiais'
    }, {
      id: 'usuarios',
      rotulo: 'Usuários e atribuições'
    }, {
      id: 'saldo-inicial',
      rotulo: 'Saldo inicial'
    }]
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      minHeight: '100dvh'
    }
  }, /*#__PURE__*/React.createElement(MenuLateral, {
    grupos: grupos,
    ativo: ativo,
    onNavegar: onNavegar,
    usuario: {
      nome: 'Ana Souza',
      papel: 'Responsável · 211'
    },
    onSair: () => onNavegar('login')
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '28px 32px 48px',
      maxWidth: 1200,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, children)));
}
window.Shell = Shell;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sia-web/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/sia-web/dados.js
try { (() => {
window.SIA_DADOS = {
  bases: [{
    id: '211',
    codigo: '211',
    nome: 'Almoxarifado regional'
  }, {
    id: 'B03',
    codigo: 'B03',
    nome: 'Base Contagem'
  }, {
    id: 'B05',
    codigo: 'B05',
    nome: 'Base Betim'
  }, {
    id: 'B07',
    codigo: 'B07',
    nome: 'Base Sete Lagoas'
  }, {
    id: 'B09',
    codigo: 'B09',
    nome: 'Base Divinópolis'
  }],
  materiais: [{
    codigo_sap: '10004521',
    descricao: 'Cabo de cobre nu 16mm²',
    unidade: 'M',
    saldo: 1250.5,
    ult: '28/09/2026'
  }, {
    codigo_sap: '10017388',
    descricao: 'Conector cunha estribo',
    unidade: 'UN',
    saldo: 84,
    ult: '27/09/2026'
  }, {
    codigo_sap: '10022010',
    descricao: 'Fita isolante 19mm x 20m',
    unidade: 'RL',
    saldo: 36,
    ult: '26/09/2026'
  }, {
    codigo_sap: '10031877',
    descricao: 'Luva de vaqueta',
    unidade: 'PR',
    saldo: 52,
    ult: '25/09/2026'
  }, {
    codigo_sap: '10040112',
    descricao: 'Isolador pino polimérico 15kV',
    unidade: 'UN',
    saldo: 140,
    ult: '29/09/2026'
  }, {
    codigo_sap: '10055630',
    descricao: 'Parafuso cabeça abaulada M16x150',
    unidade: 'CJ',
    saldo: 310,
    ult: '22/09/2026'
  }, {
    codigo_sap: '10061204',
    descricao: 'Chave fusível 15kV 100A',
    unidade: 'PC',
    saldo: 9,
    ult: '19/09/2026'
  }, {
    codigo_sap: '10070991',
    descricao: 'Brita nº 1',
    unidade: 'M3',
    saldo: 4.5,
    ult: '18/09/2026'
  }],
  pedidos: [{
    numero: 1042,
    status: 'aprovado',
    de: 'Base Contagem',
    para: '211',
    itens: 4,
    quando: '29/09/2026 08:14'
  }, {
    numero: 1041,
    status: 'solicitado',
    de: 'Base Betim',
    para: '211',
    itens: 7,
    quando: '29/09/2026 07:52'
  }, {
    numero: 1039,
    status: 'solicitado',
    de: 'Base Sete Lagoas',
    para: '211',
    itens: 2,
    quando: '28/09/2026 16:30'
  }, {
    numero: 1036,
    status: 'em_transito',
    de: 'Base Divinópolis',
    para: '211',
    itens: 5,
    quando: '27/09/2026 10:05'
  }, {
    numero: 1031,
    status: 'com_divergencia',
    de: 'Base Betim',
    para: '211',
    itens: 3,
    quando: '25/09/2026 09:41'
  }, {
    numero: 1028,
    status: 'encerrado',
    de: 'Base Contagem',
    para: '211',
    itens: 6,
    quando: '24/09/2026 14:12'
  }, {
    numero: 1044,
    status: 'rascunho',
    de: 'Base Contagem',
    para: '211',
    itens: 1,
    quando: '29/09/2026 09:03'
  }],
  itensPedido: [{
    codigo_sap: '10004521',
    descricao: 'Cabo de cobre nu 16mm²',
    unidade: 'M',
    aprovada: 300,
    saldo: 1250.5
  }, {
    codigo_sap: '10017388',
    descricao: 'Conector cunha estribo',
    unidade: 'UN',
    aprovada: 40,
    saldo: 84
  }, {
    codigo_sap: '10061204',
    descricao: 'Chave fusível 15kV 100A',
    unidade: 'PC',
    aprovada: 12,
    saldo: 9
  }, {
    codigo_sap: '10022010',
    descricao: 'Fita isolante 19mm x 20m',
    unidade: 'RL',
    aprovada: 10,
    saldo: 36
  }],
  divergencias: [{
    id: 1,
    rem: 412,
    tipo: 'Atendimento',
    rota: '211 → B05',
    codigo_sap: '10017388',
    descricao: 'Conector cunha estribo',
    motivo: 'Falta',
    dif: 4,
    un: 'UN',
    aberto: 4,
    dias: 5
  }, {
    id: 2,
    rem: 409,
    tipo: 'Atendimento',
    rota: '211 → B07',
    codigo_sap: '10040112',
    descricao: 'Isolador pino polimérico 15kV',
    motivo: 'Avaria',
    dif: 2,
    un: 'UN',
    aberto: 2,
    dias: 7
  }, {
    id: 3,
    rem: 405,
    tipo: 'Transferência',
    rota: 'B03 → B09',
    codigo_sap: '10004521',
    descricao: 'Cabo de cobre nu 16mm²',
    motivo: 'Sobra',
    dif: -15,
    un: 'M',
    aberto: 15,
    dias: 9
  }],
  indicadores: [{
    cod: '211',
    nome: 'Almoxarifado regional',
    at: '96,4%',
    rec: 38,
    div: '0%',
    tr: '1,8',
    perda: '—',
    aj: '1 · R$ 212,40',
    sai: 'R$ 18.402,10'
  }, {
    cod: 'B03',
    nome: 'Base Contagem',
    at: '92,1%',
    rec: 14,
    div: '7,1%',
    tr: '1,5',
    perda: '—',
    aj: '—',
    sai: 'R$ 6.110,00'
  }, {
    cod: 'B05',
    nome: 'Base Betim',
    at: '88,0%',
    rec: 11,
    div: '18,2%',
    tr: '2,4',
    perda: 'R$ 96,00',
    aj: '2 · R$ 540,00',
    sai: 'R$ 4.980,55'
  }, {
    cod: 'B07',
    nome: 'Base Sete Lagoas',
    at: '95,5%',
    rec: 9,
    div: '11,1%',
    tr: '3,1',
    perda: '—',
    aj: '—',
    sai: 'R$ 3.204,90'
  }],
  dias: ['01/09', '04/09', '07/09', '10/09', '13/09', '16/09', '19/09', '22/09', '25/09', '28/09']
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/sia-web/dados.js", error: String((e && e.message) || e) }); }

__ds_ns.Marca = __ds_scope.Marca;

__ds_ns.Simbolo = __ds_scope.Simbolo;

__ds_ns.Donut = __ds_scope.Donut;

__ds_ns.GraficoLinha = __ds_scope.GraficoLinha;

__ds_ns.Sparkline = __ds_scope.Sparkline;

__ds_ns.Dados = __ds_scope.Dados;

__ds_ns.Doc = __ds_scope.Doc;

__ds_ns.Etiqueta = __ds_scope.Etiqueta;

__ds_ns.ItemLista = __ds_scope.ItemLista;

__ds_ns.Qtd = __ds_scope.Qtd;

__ds_ns.Tabela = __ds_scope.Tabela;

__ds_ns.Aviso = __ds_scope.Aviso;

__ds_ns.Carregando = __ds_scope.Carregando;

__ds_ns.Fita = __ds_scope.Fita;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.Vazio = __ds_scope.Vazio;

__ds_ns.Abas = __ds_scope.Abas;

__ds_ns.Botao = __ds_scope.Botao;

__ds_ns.Campo = __ds_scope.Campo;

__ds_ns.Entrada = __ds_scope.Entrada;

__ds_ns.MaterialBusca = __ds_scope.MaterialBusca;

__ds_ns.Selecao = __ds_scope.Selecao;

__ds_ns.CabecalhoMovel = __ds_scope.CabecalhoMovel;

__ds_ns.BarraInferior = __ds_scope.BarraInferior;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.BuscaComando = __ds_scope.BuscaComando;

__ds_ns.Cartao = __ds_scope.Cartao;

__ds_ns.MenuLateral = __ds_scope.MenuLateral;

__ds_ns.PaginaTopo = __ds_scope.PaginaTopo;

})();
