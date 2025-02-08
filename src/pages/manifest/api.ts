// @ts-ignore
import { authenticatedFetchLegacy } from "@swyft-logistics/api";
import * as settings from "./columnsSetting.json";
import { getUser } from "../../common/utils/utils";

export async function getParcel(parcelId) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${
            process.env.PARCEL_MANAGEMENT_API_BASE_URL
        }/Parcels/${parcelId}?filter=${encodeURIComponent(
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

export async function getBag(bagId) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/bags/${bagId}`,
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

export async function createManifest(payload) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/manifests`,
        token,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }
    );
}

export async function printManifest(manifestId) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.PARCEL_MANAGEMENT_API_BASE_URL}/manifest-detail/${manifestId}`,
        token
    );
}
export async function getColumnsSetting() {
    // const adminData = JSON.parse(localStorage.getItem("pc_admin_data"));
    // const token = adminData.id;
    // return await authenticatedFetchLegacy(`${process.env.PARCEL_MANAGEMENT_API_BASE_URL}/column-settings`, token)
    return settings;
}
