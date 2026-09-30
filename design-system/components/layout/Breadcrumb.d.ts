export interface BreadcrumbProps {
  itens: (string | { rotulo: string; onClick?: () => void })[];
}
export declare function Breadcrumb(props: BreadcrumbProps): JSX.Element;
