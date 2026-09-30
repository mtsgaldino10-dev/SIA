/**
 * @startingPoint section="Painel" subtitle="Cartão com filtro de período e menu" viewport="700x320"
 */
export interface CartaoProps {
  titulo?: React.ReactNode;
  sub?: React.ReactNode;
  /** Ação à direita do título (ex.: Botao fantasma "Ver saldo"). */
  acao?: React.ReactNode;
  /** Rótulo do filtro de período, ex. "Últimos 30 dias". */
  periodo?: string;
  onPeriodo?: () => void;
  /** Mostra o botão "…". */
  menu?: boolean;
  onMenu?: () => void;
  /** Faixa de atenção âmbar sob o cabeçalho. */
  fita?: boolean;
  espacamento?: number;
  children?: React.ReactNode;
}
export declare function Cartao(props: CartaoProps): JSX.Element;
