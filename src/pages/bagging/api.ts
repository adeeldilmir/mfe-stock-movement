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
                include: [
                    "vendor",
                    "city",
                    "parcelStatuses",
                    "shipperAdviceRelation",
                ],
            })
        )}`,
        token
    );
}

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

export async function getBagCode(code: string) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.PARCEL_MANAGEMENT_API_BASE_URL}/BarCodes/${code}`,
        token
    );
}

export async function getWareHouseByName(warehouseName) {
    const adminData = getUser();
    const token = adminData.id;

    const filter = {
        where: {
            name: warehouseName,
        },
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

export async function createBag(body) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/bags`,
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

export async function getDetailsLabel(bagId: string) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.PARCEL_MANAGEMENT_API_BASE_URL}/bagging-details/${bagId}`,
        token
    );
}

export async function getBaggingLabel(bagId: string) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.PARCEL_MANAGEMENT_API_BASE_URL}/bagging-label/${bagId}`,
        token
    );
}

export async function getColumnsSetting() {
    return settings;
}

export async function getBag(id: string) {
    const adminData = getUser();
    const token = adminData.id;

    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/bags/${id}`,
        token
    );
}
