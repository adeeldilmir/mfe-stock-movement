// @ts-ignore
import { authenticatedFetchLegacy } from "@swyft-logistics/api";
import type { ILoading } from "../../common/interfaces/ILoading";
import { getUser } from "../../common/utils/utils";
import * as settings from "./columnsSetting.json";

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

export async function getLoading(loadingId) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/loadings/${loadingId}`,
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

export async function updateLoadingStatus(loadingId, body) {
    const adminData = getUser();
    const token = adminData.id;

    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/loadings/update-status/${loadingId}`,
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

export async function getColumnsSetting(): Promise<{
    columns: {
        name: string;
        mapping: {
            line1: {
                path: string;
                type: string;
            };
        };
    }[];
    tableMetadata: {
        pageSize: number;
        isMultiline: boolean;
        rowMenuOptions: {
            label: string;
            action: string;
        }[];
    };
}> {
    return settings;
}
