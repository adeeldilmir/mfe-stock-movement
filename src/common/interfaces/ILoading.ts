export interface ILoading {
    currentStatusId?: string;
    previousStatusId?: string;
    manifestIds: string[];
    updatedAt?: Date;
    createdAt?: Date;
    originCity: string;
    originWarehouse: string;
    destinationCity: string;
    destinationWarehouse: string;
    source: string;
    sourceId: string;
    weight: number;
    driverName: string;
    vehicleNumber: string;
    loadingId: string;
    route: string[];
}
