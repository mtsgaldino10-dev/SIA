export interface ItemMenu { id: string; rotulo: string; contagem?: number; alerta?: boolean; }
/**
 * @startingPoint section="Estrutura" subtitle="Menu lateral grafite com grupos" viewport="700x560"
 */
export interface MenuLateralProps {
  /** Grupos na ordem: Operação, Gestão, Cadastros. */
  grupos: { grupo: string; itens: ItemMenu[] }[];
  ativo?: string;
  onNavegar?: (id: string) => void;
  usuario?: { nome: string; papel: string };
  /** Mostra o gatilho ⌘K. */
  busca?: boolean;
  onBusca?: () => void;
  onSair?: () => void;
  altura?: number | string;
}
export declare function MenuLateral(props: MenuLateralProps): JSX.Element;
