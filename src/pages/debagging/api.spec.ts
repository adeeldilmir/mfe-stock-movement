import {
    getColumnsSetting,
    bagExists,
    getParcelData,
    getAdministrator,
    getWareHouseById,
    updateBagStatus,
    getManifestByBagId,
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

    test("getColumnsSetting", () => {
        expect(getColumnsSetting()).toEqual(Promise.resolve({}));
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

    test("getWareHouseById", async () => {
        const filter = {
            where: {
                id: "abc",
            },
            fields: { id: true, name: true },
        };

        expect(await getWareHouseById("abc")).toEqual({
            url: `http://test.com/WarehouseLocations?filter=${encodeURIComponent(
                JSON.stringify(filter)
            )}`,
            token: "abc",
        });
    });

    test("getParcelData", async () => {
        expect(await getParcelData("abc")).toEqual({
            url: `http://test.com/Parcels/abc?filter=${encodeURIComponent(
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
            token: "abc",
        });
    });

    test("bagExists", async () => {
        expect(await bagExists("abc")).toEqual({
            url: `http://test.com/stock-movement/bags/abc`,
            token: "abc",
        });
    });
    test("updateBagStatus", async () => {
        const body = { test: "abc" };
        expect(await updateBagStatus("abc", body)).toEqual({
            url: `http://test.com/stock-movement/bags/update-status/abc`,
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

    test("getManifestByBagId", async () => {
        const body = { test: "abc" };
        expect(await getManifestByBagId(body)).toEqual({
            url: `http://test.com/stock-movement/manifests/find-by-filters?skip=0&limit=1&sortField=createdAt&order=-1`,
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
});
