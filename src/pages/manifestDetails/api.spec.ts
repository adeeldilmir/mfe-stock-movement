import { getPanelSetting, getManifest } from "./api";

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

    test("getManifest", async () => {
        expect(await getManifest("abc")).toEqual({
            url: `http://test.com/stock-movement/manifests/abc`,
            token: "abc",
        });
    });

    afterAll(() => {});
});
