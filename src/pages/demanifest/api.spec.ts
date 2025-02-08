import {
    getParcel,
    getColumnsSetting,
    getBag,
    getAdministrator,
    getWareHouseByCode,
    getManifest,
    updateManifestStatus,
    getLoadingsByManifestId,
} from "./api";
import * as settings from "./columnsSetting.json";

jest.mock("../../common/utils/utils", () => ({
    getUser: () => {
        return { id: "abc" };
    },
}));

describe("api", () => {
    beforeAll(() => {
        global.process.env.APP_API_BASE_URL = "http://test.com/stock-movement";
        global.process.env.PARCEL_MANAGEMENT_API_BASE_URL = "http://test.com";
    });

    test("getAdministrator", async () => {
        const filter = {
            where: {
                id: "abc",
            },
            fields: { id: true, firstName: true, lastName: true },
        };
        expect(await getAdministrator("abc")).toEqual({
            url: `http://test.com/Administrators?filter=${encodeURIComponent(
                JSON.stringify(filter)
            )}`,
            token: "abc",
        });
    });

    test("getManifest", async () => {
        expect(await getManifest("abc")).toEqual({
            url: `http://test.com/stock-movement/manifests/abc`,
            token: "abc",
        });
    });

    test("getParcel", async () => {
        expect(await getParcel("abc")).toEqual({
            url: `http://test.com/Parcels/abc?filter=${encodeURIComponent(
                JSON.stringify({
                    include: ["vendor"],
                })
            )}`,
            token: "abc",
        });
    });

    test("getBag", async () => {
        expect(await getBag("abc")).toEqual({
            url: `http://test.com/stock-movement/bags/abc`,
            token: "abc",
        });
    });

    test("getWareHouseCode", async () => {
        const filter = {
            where: {
                and: [{ cityCode: "001" }, { warehouseCode: "01" }],
            },
            fields: { id: true, name: true, warehouseCode: true },
        };

        expect(await getWareHouseByCode("001", "01")).toEqual({
            url: `http://test.com/WarehouseLocations?filter=${encodeURIComponent(
                JSON.stringify(filter)
            )}`,
            token: "abc",
        });
    });

    test("updateManifestStatus", async () => {
        const body = { test: "abc" };
        expect(await updateManifestStatus(body)).toEqual({
            url: `http://test.com/stock-movement/manifests/update-status`,
            token: "abc",
            options: {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            },
        });
    });

    test("getLoadingsByManifestId", async () => {
        const body = { test: "abc" };
        expect(await getLoadingsByManifestId(body)).toEqual({
            url: `http://test.com/stock-movement/loadings/find-by-filters?skip=0&limit=1&sortField=createdAt&order=-1`,
            token: "abc",
            options: {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            },
        });
    });

    test("getColumnsSetting", async () => {
        expect(await getColumnsSetting()).toEqual(settings);
    });

    afterAll(() => {});
});
