export interface IDriver {
    id?: string;
    driverCode?: string;
    name?: string;
    firstName: string;
    lastName: string;
    updatedAt: string;
    createdAt: string;
    phone: string;
    CNIC: string;
    isActive: boolean;
    profilePicture: string;
    address?: string;
    employeeCode?: string;
    baseWarehouse: {
        cityCode: string;
        warehoiseCode: string;
    };
    operationalWarehouse: [
        {
            cityCode: string;
            warehoiseCode: string;
        }
    ];
    types: string[];
    password: string;
    email?: string;
    driverSupervisor: string;
    employmentStatus: string;
    documents?: [string];
}
