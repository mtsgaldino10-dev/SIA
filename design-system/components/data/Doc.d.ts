export interface DocProps {
  prefixo: 'PED' | 'REM' | 'SAI' | 'AJU';
  numero: number;
  forte?: boolean;
}
export declare function Doc(props: DocProps): JSX.Element;
