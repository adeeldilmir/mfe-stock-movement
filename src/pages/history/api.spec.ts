import {
    getColumnsSettingBags,
    getColumnsSettingManifest,
    getColumnsSettingLoading,
    getBagById,
    getManifestById,
    getAllBags,
    getAllWareHouses,
    getAllManifest,
    getAllLoading,
    getLoadingById,
    printManifest,
    getDetailsLabel,
    getBaggingLabel,
    getLoadingPrint,
    getFilteredLoading,
    getFilteredManifest,
    getFilteredBags,
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
        expect(getColumnsSettingBags()).toEqual(Promise.resolve({}));
    });
    test("getColumnsSettingManifest", () => {
        expect(getColumnsSettingManifest()).toEqual(Promise.resolve({}));
    });
    test("getColumnsSettingLoading", () => {
        expect(getColumnsSettingLoading()).toEqual(Promise.resolve({}));
    });
    test("getBagById", async () => {
        expect(await getBagById("abcd")).toEqual({
            url: `http://test.com/stock-movement/bags/abcd`,
            token: "abc",
            options: {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "GET",
            },
        });
    });
    test("getManifestById", async () => {
        expect(await getManifestById("abcd")).toEqual({
            url: `http://test.com/stock-movement/manifests/abcd`,
            token: "abc",
            options: {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "GET",
            },
        });
    });

    test("getAllBags", async () => {
        expect(await getAllBags(50, 0)).toEqual({
            url: `http://test.com/stock-movement/bags/find-by-filters?skip=0&limit=50&sortField=createdAt&order=-1`,
            token: "abc",
            options: {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
            },
        });
    });
    test("getAllWareHouses", async () => {
        expect(await getAllWareHouses()).toEqual({
            url: `http://test.com/WarehouseLocations`,
            token: "abc",
            options: {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "GET",
            },
        });
    });
    test("getAllManifest", async () => {
        expect(await getAllManifest(50, 0)).toEqual({
            url: `http://test.com/stock-movement/Manifests/find-by-filters?skip=0&limit=50&sortField=createdAt&order=-1`,
            token: "abc",
            options: {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
            },
        });
    });

    test("getAllLoading", async () => {
        expect(await getAllLoading(50, 0)).toEqual({
            url: `http://test.com/stock-movement/Loadings/find-by-filters?skip=0&limit=50&sortField=createdAt&order=-1`,
            token: "abc",
            options: {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
            },
        });
    });
    test("getLoadingById", async () => {
        expect(await getLoadingById("abcd")).toEqual({
            url: `http://test.com/stock-movement/loadings/abcd`,
            token: "abc",
        });
    });
    test("printManifest", async () => {
        expect(await printManifest("abcd")).toEqual({
            url: `http://test.com/manifest-detail/abcd`,
            token: "abc",
        });
    });
    test("getDetailsLabel", async () => {
        expect(await getDetailsLabel("abcd")).toEqual({
            url: `http://test.com/bagging-details/abcd`,
            token: "abc",
        });
    });
    test("getBaggingLabel", async () => {
        expect(await getBaggingLabel("abcd")).toEqual({
            url: `http://test.com/bagging-label/abcd`,
            token: "abc",
        });
    });
    test("getLoadingPrint", async () => {
        expect(await getLoadingPrint("abcd")).toEqual({
            url: `http://test.com/loading-details/abcd`,
            token: "abc",
        });
    });
    test("getFilteredLoading", async () => {
        const filters = { currentStatusId: "New" };
        const filterOptions = { filters: filters };
        expect(await getFilteredLoading(50, 0, filters)).toEqual({
            url: `http://test.com/stock-movement/Loadings/find-by-filters?skip=0&limit=50&sortField=createdAt&order=-1`,
            token: "abc",
            options: {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify(filterOptions),
            },
        });
    });
    test("getFilteredBags", async () => {
        const filters = { currentStatusId: "New" };
        const filterOptions = { filters: filters };
        expect(await getFilteredBags(50, 0, filters)).toEqual({
            url: `http://test.com/stock-movement/Bags/find-by-filters?skip=0&limit=50&sortField=createdAt&order=-1`,
            token: "abc",
            options: {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify(filterOptions),
            },
        });
    });
    test("getFilteredManifest", async () => {
        const filters = { currentStatusId: "New" };
        const filterOptions = { filters: filters };
        expect(await getFilteredManifest(50, 0, filters)).toEqual({
            url: `http://test.com/stock-movement/Manifests/find-by-filters?skip=0&limit=50&sortField=createdAt&order=-1`,
            token: "abc",
            options: {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify(filterOptions),
            },
        });
    });

    afterAll(() => {});
});
