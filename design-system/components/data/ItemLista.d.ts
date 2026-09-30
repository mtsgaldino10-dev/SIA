export interface ItemListaProps {
  titulo: React.ReactNode;
  /** Normalmente um StatusBadge. */
  direita?: React.ReactNode;
  sub?: React.ReactNode;
  subDireita?: React.ReactNode;
  onClick?: () => void;
  href?: string;
}
export declare function ItemLista(props: ItemListaProps): JSX.Element;
