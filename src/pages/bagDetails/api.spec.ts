import { getPanelSetting, getBag } from "./api";

jest.mock("../../common/utils/utils", () => ({
    getUser: () => {
        return {
            id: "abc",
            user: { email: "abc" },
            roleData: { roleCode: "abc" },
        };
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
    test("getBag", async () => {
        expect(await getBag("abc")).toEqual({
            url: `http://test.com/stock-movement/bags/abc`,
            token: "abc",
        });
    });

    afterAll(() => {});
});
