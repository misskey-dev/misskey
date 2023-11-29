export type PageHeaderItem = {
    text: string;
    icon: string;
    highlighted?: boolean;
    handler: (ev: MouseEvent) => void;
};
