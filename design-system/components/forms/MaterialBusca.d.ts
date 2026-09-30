export interface Material { codigo_sap: string; descricao: string; unidade: string; }
export interface MaterialBuscaProps {
  rotulo?: string;
  materiais: Material[];
  onEscolher?: (m: Material) => void;
  /** Mostra a lista mesmo sem termo (demonstração). */
  aberta?: boolean;
}
export declare function MaterialBusca(props: MaterialBuscaProps): JSX.Element;
