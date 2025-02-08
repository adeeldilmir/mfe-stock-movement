import * as settings from "./columnsSetting.json";
// @ts-ignore
import { authenticatedFetchLegacy } from "@swyft-logistics/api";
import { getUser } from "../../common/utils/utils";

export async function getParcelData(id: string) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${
            process.env.PARCEL_MANAGEMENT_API_BASE_URL
        }/Parcels/${id}?filter=${encodeURIComponent(
            JSON.stringify({
                fields: [
                    "currentStatusId",
                    "previousStatusId",
                    "amount",
                    "weight",
                    "vendorId",
                    "id",
                    "cityId",
                    "createdAt",
                    "originCityId",
                    "vendor",
                    "city",
                ],
                include: [
                    "city",
                    {
                        relation: "vendor",
                        scope: {
                            fields: ["name"],
                        },
                    },
                ],
            })
        )}`,
        token
    );
}
// fields: ["amount", "weight", "id",'city','vendor'],
export async function getWarehouse(filter) {
    const adminData = getUser();
    const token = adminData.id;

    return await authenticatedFetchLegacy(
        `${
            process.env.PARCEL_MANAGEMENT_API_BASE_URL
        }/WarehouseLocations?filter=${encodeURIComponent(
            JSON.stringify(filter)
        )}`,
        token
    );
}

export async function getAdministrator(adminId) {
    const adminData = getUser();
    const token = adminData.id;

    const filter = {
        where: {
            id: adminId,
        },
        fields: { id: true, firstName: true, lastName: true },
    };
    return await authenticatedFetchLegacy(
        `${
            process.env.PARCEL_MANAGEMENT_API_BASE_URL
        }/Administrators?filter=${encodeURIComponent(JSON.stringify(filter))}`,
        token
    );
}

export async function getWareHouseById(warehouseId) {
    const adminData = getUser();
    const token = adminData.id;

    const filter = {
        where: {
            id: warehouseId,
        },
        fields: { id: true, name: true },
    };
    return await authenticatedFetchLegacy(
        `${
            process.env.PARCEL_MANAGEMENT_API_BASE_URL
        }/WarehouseLocations?filter=${encodeURIComponent(
            JSON.stringify(filter)
        )}`,
        token
    );
}

export async function bagExists(bagId) {
    const adminData = getUser();
    const token = adminData.id;

    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/bags/${bagId}`,
        token
    );
}

export async function updateBagStatus(bagId, body) {
    const adminData = getUser();
    const token = adminData.id;

    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/bags/update-status/${bagId}`,
        token,
        {
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            method: "PATCH",
        }
    );
}
export async function getColumnsSetting() {
    return settings;
}
export async function getManifestByBagId(body) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/manifests/find-by-filters?skip=0&limit=1&sortField=createdAt&order=-1`,
        token,
        {
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            method: "POST",
        }
    );
}
