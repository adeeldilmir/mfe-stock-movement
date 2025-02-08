export interface ITableMetaData {
    pageSize: number;
    currentPage?: number;
    total?: number;
    isMultiline: boolean;
    rowMenuOptions: {
        label: string;
        action: string;
    }[];
    rowContextMenuOptions?: IMenuOptions[];
}

interface IMenuOptions {
    label: string;
    action: string;
}
