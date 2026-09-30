export interface ColunaTabela<T = any> {
  chave: string;
  rotulo: React.ReactNode;
  /** Alinha à direita, mono tabular, sem quebra. */
  num?: boolean;
  /** Mono sem alinhar à direita (códigos SAP). */
  mono?: boolean;
  largura?: number | string;
  render?: (linha: T) => React.ReactNode;
}
export interface TabelaProps<T = any> {
  colunas: ColunaTabela<T>[];
  linhas: T[];
  /** Campo usado como key. Padrão "id". */
  chave?: string;
  /** Torna a linha clicável (hover cobre suave). */
  onLinha?: (linha: T) => void;
  /** Rolagem vertical com cabeçalho fixo. */
  alturaMax?: number;
}
export declare function Tabela<T = any>(props: TabelaProps<T>): JSX.Element;
