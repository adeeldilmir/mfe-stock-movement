// NOTE: jest-dom adds handy assertions to Jest and it is recommended, but not required.
import "@testing-library/jest-dom";
import { render } from "@testing-library/svelte";
import Loading from "./Loading.svelte";
import * as api from "./api";
import * as settings from "./columnsSetting.json";
import * as utils from "../../common/utils/utils";
import { fireEvent } from "@testing-library/dom";
import { toast } from "@zerodevx/svelte-toast";
import { cities, producttypes, vehicles, warehouses } from "../../store";

jest.mock("../../common/utils/utils");
jest.mock("./api");
let openSpy;

jest.mock("@zerodevx/svelte-toast", () => ({
    ...jest.requireActual("@zerodevx/svelte-toast"),
    toast: {
        push: jest.fn(),
    },
}));

describe("Loading", () => {
    beforeAll(() => {
        openSpy = jest.spyOn(window, "open").mockImplementation((value) => {
            return window;
        });

        jest.spyOn(utils, "getUser").mockImplementation(() => {
            return {
                userId: "",
                adminUser: {
                    firstName: "",
                    lastName: "",
                    location: {
                        name: "",
                        warehouseCode: "",
                    },
                },
                user: {
                    firstName: "",
                    location: {
                        name: "",
                    },
                },
            };
        });

        jest.spyOn(api, "getDrivers").mockImplementation(async () => {
            return [
                {
                    id: "1",
                    firstName: "sfaafs",
                    lastName: "tadfgs",
                },
            ];
        });

        jest.spyOn(api, "getColumnsSetting").mockImplementation(async () => {
            return settings;
        });
        cities.init({
            url: ``,
            items: [
                {
                    name: "Lahore",
                    id: "1",
                    cityCode: "001",
                    code: "LHE",
                },
            ],
        });
        vehicles.init({
            url: ``,
            items: [
                {
                    plateNumber: "1234",
                    modelNumber: 2017,
                    isActive: true,
                    isOwned: true,
                    id: "1",
                    vehicleTypeId: "1",
                    createdAt: new Date("2017/1/1"),
                    updatedAt: new Date("2017/1/1"),
                    vehicleType: {
                        id: "341",
                        name: "Shezore",
                    },
                },
            ],
        });
        warehouses.init({
            url: ``,
            items: [
                {
                    name: "Gajjumata",
                    warehouseCode: "01",
                    address: "Gajjumata",
                    id: "1",
                    cityCode: "001",
                    cityId: "123",
                    createdAt: new Date("2017/1/1"),
                    updatedAt: new Date("2017/1/1"),
                },
            ],
        });
        producttypes.init({
            url: ``,
            items: [
                {
                    code: "Corporate",
                    id: "Corporate",
                    name: "Corporate",
                },
                {
                    code: "Standard",
                    id: "Standard",
                    name: "Standard",
                },
            ],
        });
    });

    test("shows proper label when rendered", () => {
        const { getByText } = render(Loading, {
            progress: { start: () => {}, finish: () => {} },
        });
        expect(getByText("Loading")).toBeInTheDocument();
    });

    test("Select destination city and destination hub not get fetched and throw error", async () => {
        const { getByLabelText } = render(Loading, {
            progress: { start: () => {}, finish: () => {} },
        });
        const routeInput = getByLabelText("Route");
        await fireEvent.change(routeInput, { target: { value: ["001"] } });
        expect(routeInput).toHaveValue("001");

        jest.spyOn(utils, "isExists").mockImplementation(() => {
            return true;
        });

        let getDestinationWarehouseSpy = jest.spyOn(api, "getWarehouseByCity");
        getDestinationWarehouseSpy.mockImplementation(async () => {
            return {
                error: "Some Error",
            };
        });

        expect(getDestinationWarehouseSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
            classes: ["error"],
        });

        getDestinationWarehouseSpy.mockRestore();
    });

    test("Select destination city and destination hub get fetched but is empty", async () => {
        const { getByLabelText } = render(Loading, {
            progress: { start: () => {}, finish: () => {} },
        });
        const routeInput = getByLabelText("Route");
        await fireEvent.change(routeInput, { target: { value: ["001"] } });
        expect(routeInput).toHaveValue("001");

        let getDestinationWarehouseSpy = jest.spyOn(api, "getWarehouseByCity");
        getDestinationWarehouseSpy.mockImplementation(async () => {
            return [{ id: "241234" }];
        });

        jest.spyOn(utils, "isExists").mockImplementation(() => {
            return false;
        });

        expect(getDestinationWarehouseSpy).toHaveBeenCalled();

        getDestinationWarehouseSpy.mockRestore();
    });

    test("Scan manifest and throw error", async () => {
        const { getByLabelText } = render(Loading, {
            progress: { start: () => {}, finish: () => {} },
        });

        jest.spyOn(utils, "checkDuplicateScanEntry").mockImplementation(() => {
            return false;
        });

        const getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                error: "Some error",
            };
        });

        const input = getByLabelText("Manifest #");
        await fireEvent.change(input, { target: { value: "MAN6351351234" } });
        expect(input).toHaveValue("MAN6351351234");

        expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
            classes: ["error"],
        });

        getManifestSpy.mockRestore();
    });

    test("Scan manifest and check duplicates", async () => {
        const { getByLabelText } = render(Loading, {
            progress: { start: () => {}, finish: () => {} },
        });

        jest.spyOn(utils, "checkDuplicateScanEntry").mockImplementation(() => {
            return true;
        });

        const getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                content: [
                    {
                        id: "LHE41234124",
                        weight: 12,
                        amount: 1000,
                    },
                ],
                manifestId: "MAN635135123",
                id: "42134123421",
                weight: 26,
            };
        });

        const input = getByLabelText("Manifest #");
        await fireEvent.change(input, { target: { value: "MAN635135123" } });
        expect(input).toHaveValue("MAN635135123");

        expect(toast.push).toHaveBeenCalledWith("Item Already Scan", {
            classes: ["error"],
        });

        getManifestSpy.mockRestore();
    });

    test("Scan manifest", async () => {
        const { getByLabelText } = render(Loading, {
            progress: { start: () => {}, finish: () => {} },
        });

        jest.spyOn(utils, "checkDuplicateScanEntry").mockImplementation(() => {
            return false;
        });

        const getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                content: [
                    {
                        id: "LHE41234124",
                        weight: 12,
                        amount: 1000,
                    },
                ],
                manifestId: "MAN6351351234",
                id: "42134123421",
                weight: 26,
            };
        });

        const input = getByLabelText("Manifest #");
        await fireEvent.change(input, { target: { value: "MAN6351351234" } });
        expect(input).toHaveValue("MAN6351351234");

        getManifestSpy.mockRestore();
    });

    test("Submit button throws error", async () => {
        const { getByLabelText, getByText } = render(Loading, {
            progress: { start: () => {}, finish: () => {} },
        });

        jest.spyOn(utils, "checkDuplicateScanEntry").mockImplementation(() => {
            return false;
        });

        const getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                content: [
                    {
                        id: "LHE41234124",
                        weight: 12,
                        amount: 1000,
                    },
                ],
                manifestId: "MAN635135123",
                id: "42134123421",
                weight: 26,
            };
        });

        const input = getByLabelText("Manifest #");
        await fireEvent.change(input, { target: { value: "MAN635135123" } });
        expect(input).toHaveValue("MAN635135123");

        const createLoadingSpy = jest.spyOn(api, "createLoading");
        createLoadingSpy.mockImplementation(async () => {
            return {
                error: "Some Error",
            };
        });

        jest.spyOn(utils, "isExists").mockImplementation(() => {
            return false;
        });

        const button = getByText("Submit");
        await fireEvent.submit(button);

        expect(getManifestSpy).toHaveBeenCalled();
        expect(createLoadingSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
            classes: ["error"],
        });

        getManifestSpy.mockRestore();
        createLoadingSpy.mockRestore();
    });

    test("Submit button works and refresh", async () => {
        const { getByLabelText, getByText } = render(Loading, {
            progress: { start: () => {}, finish: () => {} },
        });

        const getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                content: [
                    {
                        id: "LHE41234124",
                        weight: 12,
                        amount: 1000,
                    },
                ],
                manifestId: "MAN635135123",
                id: "42134123421",
                weight: 26,
            };
        });

        const input = getByLabelText("Manifest #");
        await fireEvent.change(input, { target: { value: "MAN635135123" } });
        expect(input).toHaveValue("MAN635135123");

        const createLoadingSpy = jest.spyOn(api, "createLoading");
        createLoadingSpy.mockImplementation(async () => {
            return {
                id: "234123412341241",
                loadingId: "VHI6456232345",
                originCity: "5123412412",
                originHub: "Gajjumatta",
            };
        });

        jest.spyOn(utils, "isExists").mockImplementation(() => {
            return true;
        });

        const createDetailDocSpy = jest.spyOn(api, "loadingDetails");
        createDetailDocSpy.mockImplementation(async () => {
            return {
                url: "https://url",
            };
        });

        const button = getByText("Submit");
        await fireEvent.submit(button);

        const refreshButton = getByText("Clear");
        await fireEvent.click(refreshButton);

        expect(getManifestSpy).toHaveBeenCalled();
        expect(createLoadingSpy).toHaveBeenCalled();
        expect(createDetailDocSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Loading created", {
            classes: ["success"],
        });

        getManifestSpy.mockRestore();
        createLoadingSpy.mockRestore();
    });

    test("Submit button works and exit", async () => {
        const { getByLabelText, getByText } = render(Loading, {
            progress: { start: () => {}, finish: () => {} },
        });

        const getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                content: [
                    {
                        id: "LHE41234124",
                        weight: 12,
                        amount: 1000,
                    },
                ],
                manifestId: "MAN635135123",
                id: "42134123421",
                weight: 26,
            };
        });

        const input = getByLabelText("Manifest #");
        await fireEvent.change(input, { target: { value: "MAN635135123" } });
        expect(input).toHaveValue("MAN635135123");

        const createLoadingSpy = jest.spyOn(api, "createLoading");
        createLoadingSpy.mockImplementation(async () => {
            return {
                id: "234123412341241",
                loadingId: "VHI6456232345",
                originCity: "5123412412",
                originHub: "Gajjumatta",
            };
        });

        jest.spyOn(utils, "isExists").mockImplementation(() => {
            return true;
        });

        const createDetailDocSpy = jest.spyOn(api, "loadingDetails");
        createDetailDocSpy.mockImplementation(async () => {
            return {
                url: "https://url",
            };
        });

        const button = getByText("Submit");
        await fireEvent.submit(button);

        const exitButton = getByText("Exit");
        await fireEvent.click(exitButton);

        expect(getManifestSpy).toHaveBeenCalled();
        expect(createLoadingSpy).toHaveBeenCalled();
        expect(createDetailDocSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Loading created", {
            classes: ["success"],
        });

        getManifestSpy.mockRestore();
        createLoadingSpy.mockRestore();
    });
});
