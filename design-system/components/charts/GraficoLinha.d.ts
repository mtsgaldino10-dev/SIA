export interface SerieLinha { nome: string; cor: string; valores: number[]; }
export interface GraficoLinhaProps {
  series: SerieLinha[];
  /** Rótulos do eixo X (datas dd/mm). */
  rotulosX: string[];
  altura?: number;
  /** Sufixo no tooltip, ex. " itens". */
  unidade?: string;
}
export declare function GraficoLinha(props: GraficoLinhaProps): JSX.Element;
