export interface BotaoProps {
  /** primario = cobre; secundario = contorno aço; perigo = contorno vermelho; fantasma = só texto. */
  variante?: 'primario' | 'secundario' | 'perigo' | 'fantasma';
  /** normal = 42px; peq = 32px. */
  tamanho?: 'normal' | 'peq';
  disabled?: boolean;
  /** Ocupa 100% da largura (ações fixas no celular). */
  largo?: boolean;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  /** Rótulo começando por verbo. */
  children: React.ReactNode;
}
export declare function Botao(props: BotaoProps): JSX.Element;
