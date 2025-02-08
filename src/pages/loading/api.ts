import * as settings from "./columnsSetting.json";
// @ts-ignore
import { authenticatedFetchLegacy } from "@swyft-logistics/api";
import { getUser } from "../../common/utils/utils";

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

export async function getVehicleDuplicateCheck(id: string) {
    const adminData = getUser();
    const token = adminData.id;

    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/loadings/${id}`,
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

export async function getVehicleCode(code: string) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.PARCEL_MANAGEMENT_API_BASE_URL}/BarCodes/${code}`,
        token
    );
}

export async function getWarehouseByCity(params: string) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${
            process.env.PARCEL_MANAGEMENT_API_BASE_URL
        }/WarehouseLocations?filter=${encodeURIComponent(
            JSON.stringify({ where: { cityId: params } })
        )}`,
        token
    );
}

export async function getManifest(manifestId) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/manifests/${manifestId}`,
        token
    );
}

export async function createLoading(payload) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/loadings`,
        token,
        {
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            method: "POST",
        }
    );
}

export async function getDrivers() {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${
            process.env.PARCEL_MANAGEMENT_API_BASE_URL
        }/Drivers?filter=${encodeURIComponent(
            JSON.stringify({
                where: { and: [{ types: "linehaul" }, { isActive: true }] },
            })
        )}`,
        token
    );
}

export async function loadingDetails(loadingId): Promise<{ url: string }> {
    const adminData = getUser();
    const token = adminData.identity;
    return await authenticatedFetchLegacy(
        `${process.env.PARCEL_MANAGEMENT_API_BASE_URL}/loading-details/${loadingId}`,
        token
    );
}

export async function getColumnsSetting() {
    return settings;
}
