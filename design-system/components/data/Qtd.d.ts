export interface QtdProps {
  valor: number | string | null | undefined;
  /** Código da unidade (UN, M, KG, PC…). */
  unidade?: string | null;
  /** Mostra sinal explícito (+/−). */
  sinal?: boolean;
}
export declare function Qtd(props: QtdProps): JSX.Element;
