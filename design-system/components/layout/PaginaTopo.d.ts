export interface PaginaTopoProps {
  titulo: React.ReactNode;
  /** Uma frase que explica a regra da tela. */
  sub?: React.ReactNode;
  /** Link "← Rótulo" acima do título (celular). */
  voltar?: { rotulo: string; onClick?: () => void };
  /** Breadcrumb acima do título (desktop). */
  trilha?: (string | { rotulo: string; onClick?: () => void })[];
  acoes?: React.ReactNode;
}
export declare function PaginaTopo(props: PaginaTopoProps): JSX.Element;
