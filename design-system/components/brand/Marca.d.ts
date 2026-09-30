export interface MarcaProps {
  /** Mostra "Sistema Integrado de Almoxarifado" sob a sigla. */
  comNome?: boolean;
  /** Cor da sigla. Herda por padrão (papel no menu, grafite no login). */
  cor?: string;
}
export declare function Marca(props: MarcaProps): JSX.Element;
