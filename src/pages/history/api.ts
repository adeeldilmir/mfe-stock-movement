import * as settingsBags from "./columnsSetting.json";
import * as manifestTable from "./columnsSettingManifest.json";
import * as loadingTable from "./columnsSettingLoading.json";
// @ts-ignore
import { authenticatedFetchLegacy } from "@swyft-logistics/api";
import { getUser } from "../../common/utils/utils";

export async function getBagById(bagId) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/bags/${bagId}`,
        token,
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "GET",
        }
    );
}
export async function getLoadingById(loadingId) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/loadings/${loadingId}`,
        token
    );
}
export async function getAllBags(limit: number, skip: number) {
    const adminData = getUser();
    const token = adminData.id;
    const paginatorParams = { skip: skip, limit: limit };
    const sortField = "createdAt";

    return await authenticatedFetchLegacy(
        `${
            process.env.APP_API_BASE_URL
        }/bags/find-by-filters?${new URLSearchParams({
            skip: paginatorParams.skip.toString(),
            limit: paginatorParams.limit.toString(),
            sortField: sortField,
            order: "-1",
        })}`,
        token,
        {
            headers: {
                "Content-Type": "application/json",
            },

            method: "POST",
        }
    );
}
export async function getFilteredBags(limit: number, skip: number, filters) {
    const adminData = getUser();
    const token = adminData.id;
    const paginatorParams = { skip: skip, limit: limit };
    const sortField = "createdAt";
    const filterOptions = { filters: filters };
    return await authenticatedFetchLegacy(
        `${
            process.env.APP_API_BASE_URL
        }/Bags/find-by-filters?${new URLSearchParams({
            skip: paginatorParams.skip.toString(),
            limit: paginatorParams.limit.toString(),
            sortField: sortField,
            order: "-1",
        })}`,
        token,
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify(filterOptions),
        }
    );
}
export async function getFilteredManifest(
    limit: number,
    skip: number,
    filters
) {
    const adminData = getUser();
    const token = adminData.id;
    const paginatorParams = { skip: skip, limit: limit };
    const sortField = "createdAt";
    const filterOptions = { filters: filters };
    return await authenticatedFetchLegacy(
        `${
            process.env.APP_API_BASE_URL
        }/Manifests/find-by-filters?${new URLSearchParams({
            skip: paginatorParams.skip.toString(),
            limit: paginatorParams.limit.toString(),
            sortField: sortField,
            order: "-1",
        })}`,
        token,
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify(filterOptions),
        }
    );
}
export async function getFilteredLoading(limit: number, skip: number, filters) {
    const adminData = getUser();
    const token = adminData.id;
    const paginatorParams = { skip: skip, limit: limit };
    const sortField = "createdAt";
    const filterOptions = { filters: filters };
    return await authenticatedFetchLegacy(
        `${
            process.env.APP_API_BASE_URL
        }/Loadings/find-by-filters?${new URLSearchParams({
            skip: paginatorParams.skip.toString(),
            limit: paginatorParams.limit.toString(),
            sortField: sortField,
            order: "-1",
        })}`,
        token,
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify(filterOptions),
        }
    );
}
export async function getAllLoading(limit: number, skip: number) {
    const adminData = getUser();
    const token = adminData.id;
    const paginatorParams = { skip: skip, limit: limit };
    const sortField = "createdAt";

    return await authenticatedFetchLegacy(
        `${
            process.env.APP_API_BASE_URL
        }/Loadings/find-by-filters?${new URLSearchParams({
            skip: paginatorParams.skip.toString(),
            limit: paginatorParams.limit.toString(),
            sortField: sortField,
            order: "-1",
        })}`,
        token,
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
        }
    );
}

export async function getAllManifest(limit: number, skip: number) {
    const adminData = getUser();
    const token = adminData.id;
    const paginatorParams = { skip: skip, limit: limit };
    const sortField = "createdAt";

    return await authenticatedFetchLegacy(
        `${
            process.env.APP_API_BASE_URL
        }/Manifests/find-by-filters?${new URLSearchParams({
            skip: paginatorParams.skip.toString(),
            limit: paginatorParams.limit.toString(),
            sortField: sortField,
            order: "-1",
        })}`,
        token,
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
        }
    );
}
export async function getManifestById(manifestId) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.APP_API_BASE_URL}/manifests/${manifestId}`,
        token,
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "GET",
        }
    );
}

export async function getAllWareHouses() {
    const adminData = getUser();
    const token = adminData.id;

    return await authenticatedFetchLegacy(
        `${process.env.PARCEL_MANAGEMENT_API_BASE_URL}/WarehouseLocations`,
        token,
        {
            headers: {
                "Content-Type": "application/json",
            },
            method: "GET",
        }
    );
}

export async function getColumnsSettingBags() {
    return settingsBags;
}
export async function getColumnsSettingManifest() {
    return manifestTable;
}
export async function getColumnsSettingLoading() {
    return loadingTable;
}
export async function printManifest(manifestId) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.PARCEL_MANAGEMENT_API_BASE_URL}/manifest-detail/${manifestId}`,
        token
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

export async function getLoadingPrint(loadingId: string) {
    const adminData = getUser();
    const token = adminData.id;
    return await authenticatedFetchLegacy(
        `${process.env.PARCEL_MANAGEMENT_API_BASE_URL}/loading-details/${loadingId}`,
        token
    );
}
