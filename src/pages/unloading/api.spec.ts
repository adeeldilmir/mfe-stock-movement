import {
    createLoading,
    getAdministrator,
    getColumnsSetting,
    getLoading,
    getWarehouse,
    getWarehouseByCity,
    updateLoadingStatus,
} from "./api";

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

    test("getWarehouse", async () => {
        const filter = {
            where: {
                cityCode: "abc",
                WarehouseCode: "abs",
            },
        };
        expect(
            await getWarehouse({
                where: { cityCode: "abc", WarehouseCode: "abs" },
            })
        ).toEqual({
            url: `http://test.com/WarehouseLocations?filter=${encodeURIComponent(
                JSON.stringify(filter)
            )}`,
            token: "abc",
        });
    });

    test("getWarehouseByCity", async () => {
        const filter = {
            where: {
                cityId: "412341234123",
            },
        };
        expect(await getWarehouseByCity("412341234123")).toEqual({
            url: `http://test.com/WarehouseLocations?filter=${encodeURIComponent(
                JSON.stringify(filter)
            )}`,
            token: "abc",
        });
    });

    test("getLoading", async () => {
        expect(await getLoading("abc")).toEqual({
            url: `http://test.com/stock-movement/loadings/abc`,
            token: "abc",
        });
    });

    test("createLoading", async () => {
        const body = { test: "abc" };
        expect(await createLoading(body)).toEqual({
            url: `http://test.com/stock-movement/loadings`,
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

    test("updateManifestStatus", async () => {
        const body = { test: "abc" };
        expect(await updateLoadingStatus("abc", body)).toEqual({
            url: `http://test.com/stock-movement/loadings/update-status/abc`,
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

    test("getColumnsSetting", () => {
        expect(getColumnsSetting()).toEqual(Promise.resolve({}));
    });

    afterAll(() => {});
});
