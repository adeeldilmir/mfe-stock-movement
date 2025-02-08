export interface IVehicle {
    plateNumber: string;
    modelNumber: number;
    isActive: boolean;
    isOwned: boolean;
    id: string;
    vehicleTypeId: string;
    createdAt: Date;
    updatedAt: Date;
    vehicleType: IVehicleType;
}

export interface IVehicleType {
    id: string;
    name: string;
}
