export interface BarraInferiorProps {
  itens: { id: string; rotulo: string }[];
  ativo?: string;
  onNavegar?: (id: string) => void;
  onMais?: () => void;
}
export declare function BarraInferior(props: BarraInferiorProps): JSX.Element;
export interface CabecalhoMovelProps { nome?: string; }
export declare function CabecalhoMovel(props: CabecalhoMovelProps): JSX.Element;
