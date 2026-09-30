export interface CampoProps {
  rotulo: React.ReactNode;
  ajuda?: React.ReactNode;
  /** Substitui a ajuda, em vermelho. */
  erro?: string | null;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Campo(props: CampoProps): JSX.Element;
