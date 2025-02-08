import { getPanelSetting, getLoad } from "./api";

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
        expect(getPanelSetting()).toEqual(Promise.resolve({}));
    });

    test("getLoad", async () => {
        expect(await getLoad("abc")).toEqual({
            url: `http://test.com/stock-movement/loadings/abc`,
            token: "abc",
        });
    });

    afterAll(() => {});
});
