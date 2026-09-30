export interface SelecaoProps {
  value?: string;
  onChange?: (valor: string) => void;
  opcoes: { valor: string; rotulo: string }[];
  /** Primeira opção vazia, ex. "Escolha…". */
  vazio?: string;
}
export declare function Selecao(props: SelecaoProps): JSX.Element;
