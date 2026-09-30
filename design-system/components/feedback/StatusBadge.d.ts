export type Tom = 'info' | 'transito' | 'ok' | 'alerta' | 'neutro';
export type Status = 'rascunho' | 'solicitado' | 'aprovado' | 'em_transito' | 'recebido' | 'recebida' | 'com_divergencia' | 'divergencia' | 'encerrado' | 'encerrada' | 'cancelado';
export interface StatusBadgeProps {
  /** Chave do status no banco; define rótulo e tom. */
  status?: Status | string;
  /** Força o tom (ex.: "12 dias" em trânsito). */
  tom?: Tom;
  /** Texto próprio; substitui o rótulo do status. */
  children?: React.ReactNode;
}
export declare function StatusBadge(props: StatusBadgeProps): JSX.Element;
