export interface EntradaProps {
  value?: string;
  onChange?: (valor: string) => void;
  /** Quantidade: IBM Plex Mono, alinhado à direita, teclado decimal. */
  num?: boolean;
  invalido?: boolean;
  type?: 'text' | 'search' | 'password' | 'date' | 'file';
  placeholder?: string;
  /** Vira textarea (72px mín.). */
  multilinha?: boolean;
  [attr: string]: any;
}
export declare function Entrada(props: EntradaProps): JSX.Element;
