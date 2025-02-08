// NOTE: jest-dom adds handy assertions to Jest and it is recommended, but not required.
import "@testing-library/jest-dom";

import History from "./History.svelte";
import * as utils from "../../common/utils/utils";
import * as api from "./api";
import * as settings from "./columnsSetting.json";
import * as manifestTable from "./columnsSettingManifest.json";
import * as loadingTable from "./columnsSettingLoading.json";
import { toast } from "@zerodevx/svelte-toast";
import { fireEvent, getByLabelText, render } from "@testing-library/svelte";
jest.mock("../../common/utils/utils");
jest.mock("./api");
let openSpy;
let getWarehouse;

jest.mock("@zerodevx/svelte-toast", () => ({
    ...jest.requireActual("@zerodevx/svelte-toast"),
    toast: {
        push: jest.fn(),
    },
}));

describe("History", () => {
    beforeAll(() => {
        openSpy = jest.spyOn(window, "open").mockImplementation((value) => {
            return window;
        });

        jest.spyOn(utils, "getUser").mockImplementation(() => {
            return {
                userId: "",
                user: {
                    firstName: "",
                    lastName: "",
                    location: {
                        name: "",
                    },
                },
            };
        });
        jest.spyOn(api, "getColumnsSettingBags").mockImplementation(
            async () => {
                return settings;
            }
        );

        jest.spyOn(api, "getColumnsSettingManifest").mockImplementation(
            async () => {
                return manifestTable;
            }
        );
        jest.spyOn(api, "getColumnsSettingLoading").mockImplementation(
            async () => {
                return loadingTable;
            }
        );
    });

    test("shows proper label when rendered", () => {
        const { getByText } = render(History, {
            progress: { start: () => {}, finish: () => {} },
        });
        expect(getByText("History")).toBeInTheDocument();
    });

    test("shows all data when click loading tab throw error", async () => {
        const { getByText } = render(History, {
            progress: { start: () => {}, finish: () => {} },
        });

        let getAllLoadingMock = jest.spyOn(api, "getAllLoading");
        getAllLoadingMock.mockImplementation(async () => {
            return Promise.resolve({
                error: "Some Error",
            });
        });
        const loadingTab = getByText("Loading");
        await fireEvent.click(loadingTab);
        expect(await getAllLoadingMock).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
            classes: ["error"],
        });
        getAllLoadingMock.mockRestore();
    });

    test("shows all data when click loading tab", async () => {
        const { getByText } = render(History, {
            progress: { start: () => {}, finish: () => {} },
        });
        let cityMap = {};
        cityMap["LHE12"] = { name: "Lahore", code: "LHE" };

        let response: { results: any[]; count: number } = {
            results: [
                {
                    id: "VHI141123434",
                    manifestIds: ["MAN2323223", "MAN232323", "MAN3232323"],
                    weight: 12,
                    route: ["LHE12"],
                    vehicleNumber: "125679",
                    currentStatusId: "New",
                    statusHistory: [
                        {
                            status: "New",
                            createdAt: "2022-05-05T12:00:00Z",
                        },
                    ],
                    createdAt: "2022-05-05T12:00:00Z",
                    originCity: "2329323",
                    originWarehouse: "232355",
                    destinationCity: "2323555",
                    destinationWarehouse: "223245565",
                },
                {
                    id: "VHI141123434",
                    manifestIds: ["MAN2323223", "MAN232323", "MAN3232323"],
                    weight: 12,
                    route: ["LHE12"],
                    currentStatusId: "New",
                    statusHistory: [
                        {
                            status: "New",
                            createdAt: "2022-05-05T12:00:00Z",
                        },
                    ],
                    createdAt: "2022-05-05T12:00:00Z",
                    vehicleNumber: "125679",
                    originCity: "2329323",
                    originWarehouse: "232355",
                    destinationCity: "2323555",
                    destinationWarehouse: "223245565",
                },
            ],
            count: 0,
        };

        let getAllLoadingMock = jest.spyOn(api, "getAllLoading");

        getAllLoadingMock.mockImplementation(async () => {
            return Promise.resolve(response);
        });
        const loadingTab = getByText("Loading");
        await fireEvent.click(loadingTab);
        expect(await getAllLoadingMock).toHaveBeenCalled();

        getAllLoadingMock.mockRestore();
    });
    test("shows all data when click Bags tab throw error", async () => {
        const { getByText } = render(History, {
            progress: { start: () => {}, finish: () => {} },
        });

        let getAllBagsMock = jest.spyOn(api, "getAllBags");
        getAllBagsMock.mockImplementation(async () => {
            return Promise.resolve({
                error: "Some Error",
            });
        });
        const bagsTab = getByText("Bags");
        await fireEvent.click(bagsTab);
        expect(await getAllBagsMock).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
            classes: ["error"],
        });
        getAllBagsMock.mockRestore();
    });

    test("shows all data when click bags tab", async () => {
        const { getByText } = render(History, {
            progress: { start: () => {}, finish: () => {} },
        });

        let response: { results: any[]; count: number } = {
            results: [
                {
                    id: "BAG-1243343",
                    parcelIds: ["LHE1243343", "LHE30934"],

                    weight: "1243343",
                    productTypeCode: "1243343",
                    journeyTypeCode: "1243343",
                    serviceTypeCode: "1243343",
                    originCity: "1243343",
                    currentStatusId: "New",
                    statusHistory: [
                        {
                            status: "New",
                            createdAt: "2022-05-05T12:00:00Z",
                        },
                    ],
                    createdAt: "2022-05-05T12:00:00Z",
                    originWarehouse: "1243343",
                    destinationCity: "1243343",
                    baggingLabel: "1243343",
                },
                {
                    id: "BAG-1243343",
                    parcelIds: ["LHE1243343", "LHE30934"],
                    weight: "1243343",
                    productTypeCode: "1243343",
                    journeyTypeCode: "1243343",
                    serviceTypeCode: "1243343",
                    originCity: "1243343",
                    currentStatusId: "New",
                    statusHistory: [
                        {
                            status: "New",
                            createdAt: "2022-05-05T12:00:00Z",
                        },
                    ],
                    createdAt: "2022-05-05T12:00:00Z",
                    originWarehouse: "1243343",
                    destinationCity: "1243343",
                    baggingLabel: "1243343",
                },
            ],
            count: 0,
        };

        let getAllBagsMock = jest.spyOn(api, "getAllBags");
        getAllBagsMock.mockImplementation(async () => {
            return Promise.resolve([response]);
        });
        const bagsTab = getByText("Bags");
        await fireEvent.click(bagsTab);
        expect(await getAllBagsMock).toHaveBeenCalled();
        getAllBagsMock.mockRestore();
    });
    test("shows all data when click Manifest tab throw error", async () => {
        const { getByText } = render(History, {
            progress: { start: () => {}, finish: () => {} },
        });

        let getAllManifestsMock = jest.spyOn(api, "getAllManifest");
        getAllManifestsMock.mockImplementation(async () => {
            return Promise.resolve({
                error: "Some Error",
            });
        });
        const manifestTab = getByText("Manifest");
        await fireEvent.click(manifestTab);
        expect(await getAllManifestsMock).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
            classes: ["error"],
        });
        getAllManifestsMock.mockRestore();
    });
    test("shows all data when click Manifest tab", async () => {
        const { getByText } = render(History, {
            progress: { start: () => {}, finish: () => {} },
        });

        let getAllManifestsMock = jest.spyOn(api, "getAllManifest");

        getAllManifestsMock.mockImplementation(async () => {
            let response: { results: any[]; count: number } = {
                results: [
                    {
                        id: "MAN-123434",
                        content: ["BAG2323223", "BAG23232323", "BAG3232323"],
                        weight: 12,
                        productTypeCode: "125679",
                        journeyTypeCode: "2329323",
                        serviceTypeCode: "232355",
                        originCity: "2323555",
                        currentStatusId: "New",
                        statusHistory: [
                            {
                                status: "New",
                                createdAt: "2022-05-05T12:00:00Z",
                            },
                        ],
                        createdAt: "2022-05-05T12:00:00Z",
                        originWarehouse: "223245565",
                        destinationCity: "349809384",
                    },
                    {
                        id: "MAN-123434",
                        content: ["BAG2323223", "BAG23232323", "BAG3232323"],
                        weight: 12,
                        productTypeCode: "125679",
                        journeyTypeCode: "2329323",
                        serviceTypeCode: "232355",
                        originCity: "2323555",
                        currentStatusId: "New",
                        statusHistory: [
                            {
                                status: "New",
                                createdAt: "2022-05-05T12:00:00Z",
                            },
                        ],
                        createdAt: "2022-05-05T12:00:00Z",
                        originWarehouse: "223245565",
                        destinationCity: "349809384",
                    },
                ],
                count: 0,
            };
            response.count = 2;

            return Promise.resolve(response);
        });
        const manifestTab = getByText("Manifest");
        await fireEvent.click(manifestTab);
        expect(await getAllManifestsMock).toHaveBeenCalled();

        getAllManifestsMock.mockRestore();
    });
    test("get Bag by id if error", async () => {
        const { getByTestId, getByLabelText } = render(History, {
            progress: { start: () => {}, finish: () => {} },
        });

        let getBagByIdMock = jest.spyOn(api, "getFilteredBags");
        getBagByIdMock.mockImplementation(async () => {
            return Promise.resolve({
                error: "Some Error",
            });
        });
        const input = getByLabelText("Bag Number:");
        await fireEvent.input(input, { target: { value: "BAG-124" } });
        const searchBag = getByTestId("search-bag");
        await fireEvent.click(searchBag);

        expect(input).toHaveValue("BAG-124");
        expect(getBagByIdMock).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
            classes: ["error"],
        });
        getBagByIdMock.mockRestore();
    });
    test("get Bag by id ", async () => {
        const { getByTestId, getByLabelText } = render(History, {
            progress: { start: () => {}, finish: () => {} },
        });

        let response: { results: any[]; count: number } = {
            results: [
                {
                    id: "BAG-1243343",
                    parcelIds: ["LHE1243343", "LHE30934"],

                    weight: "1243343",
                    productTypeCode: "1243343",
                    journeyTypeCode: "1243343",
                    serviceTypeCode: "1243343",
                    originCity: "1243343",
                    currentStatusId: "New",
                    statusHistory: [
                        {
                            status: "New",
                            createdAt: "2022-05-05T12:00:00Z",
                        },
                    ],
                    createdAt: "2022-05-05T12:00:00Z",
                    originWarehouse: "1243343",
                    destinationCity: "1243343",
                    baggingLabel: "1243343",
                },
                {
                    id: "BAG-1243343",
                    parcelIds: ["LHE1243343", "LHE30934"],
                    weight: "1243343",
                    productTypeCode: "1243343",
                    journeyTypeCode: "1243343",
                    serviceTypeCode: "1243343",
                    originCity: "1243343",
                    currentStatusId: "New",
                    statusHistory: [
                        {
                            status: "New",
                            createdAt: "2022-05-05T12:00:00Z",
                        },
                    ],
                    createdAt: "2022-05-05T12:00:00Z",
                    originWarehouse: "1243343",
                    destinationCity: "1243343",
                    baggingLabel: "1243343",
                },
            ],
            count: 0,
        };
        let getBagByIdMock = jest.spyOn(api, "getFilteredManifest");
        getBagByIdMock.mockImplementation(async () => {
            return Promise.resolve([response]);
        });
        const input = getByLabelText("Bag Number:");
        await fireEvent.input(input, { target: { value: "BAG-124" } });
        const searchBag = getByTestId("search-bag");
        await fireEvent.click(searchBag);

        expect(input).toHaveValue("BAG-124");
        expect(getBagByIdMock).toHaveBeenCalled();
        getBagByIdMock.mockRestore();
    });
    test("get Manifest by id with error", async () => {
        const { getByTestId, getByText, getByLabelText } = render(History, {
            progress: { start: () => {}, finish: () => {} },
        });
        const manifestTab = getByText("Manifest");
        await fireEvent.click(manifestTab);
        let getManifestByIdMock = jest.spyOn(api, "getFilteredManifest");
        getManifestByIdMock.mockImplementation(async () => {
            return Promise.resolve({
                error: "Some Error",
            });
        });

        const input = getByLabelText("Manifest Number:");
        await fireEvent.input(input, { target: { value: "MAN3873" } });
        const searchManifest = getByTestId("search-manifest");
        await fireEvent.click(searchManifest);
        expect(input).toHaveValue("MAN3873");
        expect(getManifestByIdMock).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
            classes: ["error"],
        });
        getManifestByIdMock.mockRestore();
    });
    test("get Manifest by id", async () => {
        const { getByTestId, getByText, getByLabelText } = render(History, {
            progress: { start: () => {}, finish: () => {} },
        });
        const manifestTab = getByText("Manifest");
        await fireEvent.click(manifestTab);
        let getManifestByIdMock = jest.spyOn(api, "getFilteredManifest");
        getManifestByIdMock.mockImplementation(async () => {
            let response: { results: any[]; count: number } = {
                results: [
                    {
                        id: "MAN-123434",
                        content: ["BAG2323223", "BAG23232323", "BAG3232323"],
                        weight: 12,
                        productTypeCode: "125679",
                        journeyTypeCode: "2329323",
                        serviceTypeCode: "232355",
                        originCity: "2323555",
                        currentStatusId: "New",
                        statusHistory: [
                            {
                                status: "New",
                                createdAt: "2022-05-05T12:00:00Z",
                            },
                        ],
                        createdAt: "2022-05-05T12:00:00Z",
                        originWarehouse: "223245565",
                        destinationCity: "349809384",
                    },
                    {
                        id: "MAN-123434",
                        content: ["BAG2323223", "BAG23232323", "BAG3232323"],
                        weight: 12,
                        productTypeCode: "125679",
                        journeyTypeCode: "2329323",
                        serviceTypeCode: "232355",
                        originCity: "2323555",
                        currentStatusId: "New",
                        statusHistory: [
                            {
                                status: "New",
                                createdAt: "2022-05-05T12:00:00Z",
                            },
                        ],
                        createdAt: "2022-05-05T12:00:00Z",
                        originWarehouse: "223245565",
                        destinationCity: "349809384",
                    },
                ],
                count: 0,
            };
            response.count = 2;

            return Promise.resolve(response);
        });
        const input = getByLabelText("Manifest Number:");
        await fireEvent.input(input, { target: { value: "MAN3873" } });
        const searchManifest = getByTestId("search-manifest");
        await fireEvent.click(searchManifest);
        expect(input).toHaveValue("MAN3873");
        expect(getManifestByIdMock).toHaveBeenCalled();

        getManifestByIdMock.mockRestore();
    });
    test("get Loading by id with error", async () => {
        const { getByTestId, getByText, getByLabelText } = render(History, {
            progress: { start: () => {}, finish: () => {} },
        });
        const loadingTab = getByText("Loading");
        await fireEvent.click(loadingTab);
        let getLoadingByIdMock = jest.spyOn(api, "getFilteredLoading");
        getLoadingByIdMock.mockImplementation(async () => {
            return Promise.resolve({
                error: "Some Error",
            });
        });
        const input = getByLabelText("Loading Number:");
        await fireEvent.input(input, { target: { value: "VHI213238321" } });
        const loadingBtn = getByTestId("search-loading");
        await fireEvent.click(loadingBtn);
        expect(input).toHaveValue("VHI213238321");
        expect(getLoadingByIdMock).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
            classes: ["error"],
        });
        getLoadingByIdMock.mockRestore();
    });
    test("get Loading by id", async () => {
        const { getByTestId, getByText, getByLabelText } = render(History, {
            progress: { start: () => {}, finish: () => {} },
        });
        const loadingTab = getByText("Loading");
        await fireEvent.click(loadingTab);
        let getLoadingByIdMock = jest.spyOn(api, "getFilteredLoading");

        getLoadingByIdMock.mockImplementation(async () => {
            let response: { results: any[]; count: number } = {
                results: [
                    {
                        id: "VHI141123434",
                        manifestIds: ["MAN2323223", "MAN232323", "MAN3232323"],
                        weight: 12,
                        route: ["LHE12"],
                        vehicleNumber: "125679",
                        originCity: "2329323",
                        currentStatusId: "New",
                        statusHistory: [
                            {
                                status: "New",
                                createdAt: "2022-05-05T12:00:00Z",
                            },
                        ],
                        createdAt: "2022-05-05T12:00:00Z",
                        originWarehouse: "232355",
                        destinationCity: "2323555",
                        destinationWarehouse: "223245565",
                    },
                    {
                        id: "VHI141123434",
                        manifestIds: ["MAN2323223", "MAN232323", "MAN3232323"],
                        weight: 12,
                        route: ["LHE12"],
                        vehicleNumber: "125679",
                        originCity: "2329323",
                        currentStatusId: "New",
                        statusHistory: [
                            {
                                status: "New",
                                createdAt: "2022-05-05T12:00:00Z",
                            },
                        ],
                        createdAt: "2022-05-05T12:00:00Z",
                        originWarehouse: "232355",
                        destinationCity: "2323555",
                        destinationWarehouse: "223245565",
                    },
                ],
                count: 0,
            };
            response.count = 2;

            return Promise.resolve(response);
        });
        const input = getByLabelText("Loading Number:");
        await fireEvent.input(input, { target: { value: "VHI213238321" } });
        const loadingBtn = getByTestId("search-loading");
        await fireEvent.click(loadingBtn);
        expect(input).toHaveValue("VHI213238321");
        expect(getLoadingByIdMock).toHaveBeenCalled();
        getLoadingByIdMock.mockRestore();
    });
    afterAll(() => {});
});
