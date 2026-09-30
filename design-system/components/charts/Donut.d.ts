export interface FatiaDonut { rotulo: string; valor: number; /** Use os tokens de status. */ cor: string; }
export interface DonutProps {
  fatias: FatiaDonut[];
  /** Número no centro (mono). */
  centro?: React.ReactNode;
  legendaCentro?: string;
  tamanho?: number;
  espessura?: number;
}
export declare function Donut(props: DonutProps): JSX.Element;
