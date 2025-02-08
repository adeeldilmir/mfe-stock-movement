import {
    getParcel,
    getColumnsSetting,
    getBag,
    printManifest,
    createManifest,
    getWarehouse,
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

    test("getParcel", async () => {
        expect(await getParcel("abc")).toEqual({
            url: `http://test.com/Parcels/abc?filter=${encodeURIComponent(
                JSON.stringify({
                    include: [
                        "vendor",
                        "city",
                        "parcelStatuses",
                        "shipperAdviceRelation",
                    ],
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

    test("printManifest", async () => {
        expect(await printManifest("abc")).toEqual({
            url: `http://test.com/manifest-detail/abc`,
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

    test("createManifest", async () => {
        const body = { test: "abc" };
        expect(await createManifest(body)).toEqual({
            url: `http://test.com/stock-movement/manifests`,
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
