/**
 * @startingPoint section="Painel" subtitle="KPI em etiqueta de prateleira com mini-gráfico" viewport="700x300"
 */
export interface EtiquetaProps {
  valor: React.ReactNode;
  legenda: React.ReactNode;
  /** Cor da borda esquerda. Sem tom = cobre. */
  tom?: 'alerta' | 'transito' | 'ok' | 'info';
  /** Versão menor, para a grade 2×2 de "Minhas bases". */
  compacta?: boolean;
  /** Série para o mini-gráfico à direita (KPI do painel). */
  serie?: number[];
  /** Texto curto de variação ao lado da legenda, ex. "+3 vs. sem. ant." */
  variacao?: string;
  onClick?: () => void;
  href?: string;
}
export declare function Etiqueta(props: EtiquetaProps): JSX.Element;
