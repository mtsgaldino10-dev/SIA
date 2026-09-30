export interface AbasProps {
  abas: { id: string; rotulo: string; contagem?: number }[];
  ativa: string;
  onChange?: (id: string) => void;
}
export declare function Abas(props: AbasProps): JSX.Element;
