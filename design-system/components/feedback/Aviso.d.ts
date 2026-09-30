export interface AvisoProps {
  tipo?: 'erro' | 'sucesso' | 'info' | 'atencao';
  /** Sem conteúdo, não renderiza nada. */
  children?: React.ReactNode;
}
export declare function Aviso(props: AvisoProps): JSX.Element | null;
