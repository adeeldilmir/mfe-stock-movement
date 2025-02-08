// @ts-ignore
import { authenticatedFetchLegacy } from "@swyft-logistics/api";
import * as settings from "./columnsSetting.json";
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

export async function getManifest(manifestId) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/manifests/${manifestId}`,
        token
    );
}

export async function getParcel(parcelId) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${
            process.env.PARCEL_MANAGEMENT_API_BASE_URL
        }/Parcels/${parcelId}?filter=${encodeURIComponent(
            JSON.stringify({
                include: ["vendor"],
            })
        )}`,
        token
    );
}

export async function getBag(bagId) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/bags/${bagId}`,
        token
    );
}

export async function getWareHouseByCode(cityCode, warehouseCode) {
    const adminData = getUser();
    const token = adminData.id;

    const filter = {
        where: { and: [{ cityCode }, { warehouseCode }] },
        fields: { id: true, name: true, warehouseCode: true },
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

export async function updateManifestStatus(body) {
    const adminData = getUser();
    const token = adminData.id;

    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/manifests/update-status`,
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
    // const adminData = JSON.parse(localStorage.getItem("pc_admin_data"));
    // const token = adminData.id;
    // return await authenticatedFetchLegacy(`${process.env.PARCEL_MANAGEMENT_API_BASE_URL}/column-settings`, token)
    return settings;
}

export async function getLoadingsByManifestId(body) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/loadings/find-by-filters?skip=0&limit=1&sortField=createdAt&order=-1`,
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
