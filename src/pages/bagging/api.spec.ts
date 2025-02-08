import {
    getColumnsSetting,
    getWareHouseByName,
    getParcelData,
    createBag,
    getDetailsLabel,
    getWarehouse,
    getBaggingLabel,
    getBagCode,
    getBag,
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

    test("getParcelData", async () => {
        expect(await getParcelData("abc")).toEqual({
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

    test("getBagDetailsPrint", async () => {
        const body = { test: "abc" };
        expect(await createBag(body)).toEqual({
            url: `http://test.com/stock-movement/bags`,
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

    test("getBagCode", async () => {
        expect(await getBagCode("abc")).toEqual({
            url: `http://test.com/BarCodes/abc`,
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

    test("getBaggingDetailsPrint", async () => {
        expect(await getDetailsLabel("abc")).toEqual({
            url: `http://test.com/bagging-details/abc`,
            token: "abc",
        });
    });

    test("getBaggingLabelPrint", async () => {
        expect(await getBaggingLabel("abc")).toEqual({
            url: `http://test.com/bagging-label/abc`,
            token: "abc",
        });
    });

    test("getWareHouseByName", async () => {
        const filter = {
            where: {
                name: "abc",
            },
        };
        expect(await getWareHouseByName("abc")).toEqual({
            url: `http://test.com/WarehouseLocations?filter=${encodeURIComponent(
                JSON.stringify(filter)
            )}`,
            token: "abc",
        });
    });

    test("getColumnsSetting", () => {
        expect(getColumnsSetting()).toEqual(Promise.resolve({}));
    });

    test("getBag", async () => {
        expect(await getBag("abc")).toEqual({
            url: `http://test.com/stock-movement/bags/abc`,
            token: "abc",
        });
    });

    afterAll(() => {});
});
