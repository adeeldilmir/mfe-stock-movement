// NOTE: jest-dom adds handy assertions to Jest and it is recommended, but not required.
import "@testing-library/jest-dom";
import { render, fireEvent, screen } from "@testing-library/svelte";
import Bagging from "./Bagging.svelte";
import * as utils from "../../common/utils/utils";
import * as api from "./api";
import * as settings from "./columnsSetting.json";
import { toast } from "@zerodevx/svelte-toast";
import { Statuses } from "../../common/utils/enums";
import { cities, producttypes, vehicles, warehouses } from "../../store";

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

describe("Bagging", () => {
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
                        code: "",
                    },
                },
                user: {
                    firstName: "",
                    location: {
                        name: "",
                        cityCode: "001",
                    },
                },
            };
        });
        jest.spyOn(api, "getColumnsSetting").mockImplementation(async () => {
            return settings;
        });
        getWarehouse = jest
            .spyOn(api, "getWarehouse")
            .mockImplementation(async () => {
                return [
                    {
                        id: "adc",
                        cityId: "LHE",
                        cityCode: "4124",
                        name: "abc",
                    },
                ];
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
                        id: "512",
                        name: "fasf",
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
        const { getByText } = render(Bagging, {
            progress: { start: () => {}, finish: () => {} },
        });
        expect(getByText("Bagging")).toBeInTheDocument();
    });

    test("handle bagging input error", async () => {
        const { getByLabelText } = render(Bagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        let isEqualSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(false);

        let baggingInput = getByLabelText("Bag ID");
        await fireEvent.change(baggingInput, {
            target: { value: "BAG423411" },
        });

        expect(isEqualSpy).toHaveBeenCalled();

        isEqualSpy.mockRestore();
    });

    test("Bagging submission when no parcels scanned", async () => {
        const { getByText } = render(Bagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        let hasItemsSpy = jest
            .spyOn(utils, "hasItems")
            .mockImplementation(() => {
                return false;
            });

        let createBaggingSpy = jest.spyOn(api, "createBag");
        createBaggingSpy.mockImplementation(async () => {
            return {
                baggingId: "",
            };
        });

        let printBaggingSpy = jest.spyOn(api, "getDetailsLabel");
        printBaggingSpy.mockImplementation(async () => {
            return Promise.resolve({ url: "test" });
        });

        const button = getByText("Submit");
        await fireEvent.click(button);
        expect(toast.push).toHaveBeenCalledWith("List should not be empty", {
            classes: ["error"],
        });

        expect(createBaggingSpy).not.toHaveBeenCalled();
        expect(printBaggingSpy).not.toHaveBeenCalled();

        createBaggingSpy.mockRestore();
        printBaggingSpy.mockRestore();
        hasItemsSpy.mockRestore();
    });

    test("Bagging submission when parcels are scanned. Bagging Created successfully", async () => {
        const { getByText, getByLabelText } = render(Bagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        let checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getParcelSpy = jest.spyOn(api, "getParcelData");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "LHE123412341211",
                weight: "8",
                amount: "100",
                currentStatusId: Statuses.AT_SWYFT_WAREHOUSE,
                city: {
                    cityCode: "001",
                },
            };
        });

        let isEqualSpy = jest.spyOn(utils, "isEqual").mockImplementation(() => {
            return true;
        });

        const input = getByLabelText("CN");
        await fireEvent.change(input, { target: { value: "LHE123412341211" } });

        let hasItemsSpy = jest
            .spyOn(utils, "hasItems")
            .mockImplementation(() => {
                return true;
            });

        let createBaggingSpy = jest.spyOn(api, "createBag");
        createBaggingSpy.mockImplementation(async () => {
            return {
                baggingId: "abc",
            };
        });

        let printBaggingSpy = jest.spyOn(api, "getDetailsLabel");
        printBaggingSpy.mockImplementation(async () => {
            return Promise.resolve({ url: "test" });
        });

        let printLabelSpy = jest.spyOn(api, "getBaggingLabel");
        printLabelSpy.mockImplementation(async () => {
            return Promise.resolve({ url: test });
        });

        const button = getByText("Submit");
        await fireEvent.click(button);

        expect(createBaggingSpy).toHaveBeenCalled();
        expect(printBaggingSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalled();

        createBaggingSpy.mockRestore();
        printBaggingSpy.mockRestore();
        hasItemsSpy.mockRestore();
        isEqualSpy.mockRestore();
    });

    test("Bagging submission when parcels are scanned. Bagging Created successfully and exit", async () => {
        const { getByText, getByLabelText } = render(Bagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        let checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getParcelSpy = jest.spyOn(api, "getParcelData");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "LHE123412341211",
                weight: "8",
                amount: "100",
                currentStatusId: Statuses.AT_SWYFT_WAREHOUSE,
                city: {
                    cityCode: "001",
                },
            };
        });

        let isEqualSpy = jest.spyOn(utils, "isEqual").mockImplementation(() => {
            return true;
        });

        const input = getByLabelText("CN");
        await fireEvent.change(input, { target: { value: "LHE123412341211" } });

        let hasItemsSpy = jest
            .spyOn(utils, "hasItems")
            .mockImplementation(() => {
                return true;
            });

        let createBaggingSpy = jest.spyOn(api, "createBag");
        createBaggingSpy.mockImplementation(async () => {
            return {
                baggingId: "abc",
            };
        });

        let printBaggingSpy = jest.spyOn(api, "getDetailsLabel");
        printBaggingSpy.mockImplementation(async () => {
            return Promise.resolve({ url: "test" });
        });

        let printLabelSpy = jest.spyOn(api, "getBaggingLabel");
        printLabelSpy.mockImplementation(async () => {
            return Promise.resolve({ url: test });
        });

        const button = getByText("Submit");
        await fireEvent.click(button);

        const exitButton = getByText("Exit");
        await fireEvent.click(exitButton);

        expect(createBaggingSpy).toHaveBeenCalled();
        expect(printBaggingSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalled();

        createBaggingSpy.mockRestore();
        printBaggingSpy.mockRestore();
        hasItemsSpy.mockRestore();
        isEqualSpy.mockRestore();
    });

    test("Bagging submission when parcels are scanned but getBagDetailsPrint throw error.", async () => {
        const { getByText } = render(Bagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        let hasItemsSpy = jest
            .spyOn(utils, "hasItems")
            .mockImplementation(() => {
                return true;
            });

        let createBaggingSpy = jest.spyOn(api, "createBag");
        createBaggingSpy.mockImplementation(async () => {
            return {
                error: "Some Error",
            };
        });

        let printBaggingSpy = jest.spyOn(api, "getDetailsLabel");
        printBaggingSpy.mockImplementation(async () => {
            return Promise.resolve({ url: "test" });
        });

        let printLabelSpy = jest.spyOn(api, "getBaggingLabel");
        printLabelSpy.mockImplementation(async () => {
            return Promise.resolve({ url: test });
        });

        const button = getByText("Submit");
        await fireEvent.click(button);

        expect(createBaggingSpy).toHaveBeenCalled();
        expect(printBaggingSpy).not.toHaveBeenCalled();
        // expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
        //     classes: ["error"],
        // });

        createBaggingSpy.mockRestore();
        printBaggingSpy.mockRestore();
        hasItemsSpy.mockRestore();
    });

    test("Scan Parcels", async () => {
        const { getByLabelText } = render(Bagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        jest.spyOn(utils, "isExists").mockImplementation(() => {
            return true;
        });

        let checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getParcelSpy = jest.spyOn(api, "getParcelData");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "LHE123412341211",
                weight: "8",
                amount: "100",
                currentStatusId: Statuses.AT_SWYFT_WAREHOUSE,
                city: {
                    cityCode: "001",
                },
            };
        });

        let isEqualSpy = jest.spyOn(utils, "isEqual").mockImplementation(() => {
            return true;
        });

        const input = getByLabelText("CN");
        await fireEvent.change(input, { target: { value: "LHE123412341211" } });

        expect(input).toHaveValue("LHE123412341211");
        expect(checkDuplicateScanEntrySpy).toHaveBeenCalled();
        expect(getParcelSpy).toHaveBeenCalled();

        getParcelSpy.mockRestore();
        isEqualSpy.mockRestore();
    });

    test("Scan Parcels, but get parcel throw error", async () => {
        const { getByLabelText } = render(Bagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        jest.spyOn(utils, "isExists").mockImplementation(() => {
            return true;
        });

        const input = getByLabelText("CN");
        await fireEvent.change(input, { target: { value: "LHE123412341211" } });

        expect(input).toHaveValue("LHE123412341211");
    });

    test("Scan Parcels, but get invalid parcel entered error", async () => {
        const { getByLabelText } = render(Bagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        jest.spyOn(utils, "isEqual").mockImplementation(() => {
            return true;
        });

        const input = getByLabelText("CN");
        await fireEvent.change(input, { target: { value: "LHE12341234" } });

        expect(input).toHaveValue("LHE12341234");
        expect(toast.push).toHaveBeenCalledWith("Invalid Parcel ID entered", {
            classes: ["error"],
        });
    });

    test("Scan Parcels, but get parcel not at swyft warehouse", async () => {
        const { getByLabelText } = render(Bagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        let validparcelIdSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        jest.spyOn(utils, "isExists").mockImplementation(() => {
            return true;
        });

        jest.spyOn(utils, "checkDuplicateScanEntry").mockImplementation(() => {
            return false;
        });

        let getParcelSpy = jest.spyOn(api, "getParcelData");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "LHE123412341211",
                weight: "8",
                amount: "100",
            };
        });

        let statusCheck = jest.spyOn(utils, "isEqual");
        statusCheck.mockImplementation(() => {
            return false;
        });

        const input = getByLabelText("CN");
        await fireEvent.change(input, { target: { value: "LHE123412341211" } });

        expect(input).toHaveValue("LHE123412341211");
        expect(getParcelSpy).toHaveBeenCalled();

        getParcelSpy.mockRestore();
        statusCheck.mockRestore();
        validparcelIdSpy.mockRestore();
    });

    test("Scan Parcels,item is already scanned", async () => {
        const { getByLabelText } = render(Bagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        let validparcelIdSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        jest.spyOn(utils, "isExists").mockImplementation(() => {
            return true;
        });

        jest.spyOn(utils, "checkDuplicateScanEntry").mockImplementation(() => {
            return true;
        });

        const input = getByLabelText("CN");
        await fireEvent.change(input, { target: { value: "LHE123412341211" } });

        expect(input).toHaveValue("LHE123412341211");
        expect(toast.push).toHaveBeenCalledWith(
            "Parcel: LHE123412341211 Already Scan",
            {
                classes: ["error"],
            }
        );
        validparcelIdSpy.mockRestore();
    });

    test("Refresh Button click", async () => {
        const { getByText, getByLabelText } = render(Bagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        //1:parcel scan

        jest.spyOn(utils, "isExists").mockImplementation(() => {
            return true;
        });

        // jest.spyOn(utils, "maxScanLimit").mockImplementation(() => {
        //     return false;
        // });

        jest.spyOn(utils, "checkDuplicateScanEntry").mockImplementation(() => {
            return false;
        });

        let getParcelSpy = jest.spyOn(api, "getParcelData");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "LHE123412341211",
                weight: "8",
                pieces: 1,
                currentStatusId: "5dd7fa20dcfa9600152cc2d8",
                previousStatusId: "5dd7fa20dcfa9600152cc1234",
                city: {
                    cityCode: "001",
                },
            };
        });

        let statusCheck = jest.spyOn(utils, "isEqual");
        statusCheck.mockReturnValueOnce(true).mockReturnValueOnce(true);

        const CNBagInput = getByLabelText("CN");

        await fireEvent.change(CNBagInput, {
            target: { value: "LHE123412341211" },
        });

        expect(CNBagInput).toHaveValue("LHE123412341211");
        expect(getParcelSpy).toHaveBeenCalled();

        ///2:Submit click
        let hasItemsSpy = jest
            .spyOn(utils, "hasItems")
            .mockImplementation(() => {
                return true;
            });

        let createBaggingSpy = jest.spyOn(api, "createBag");
        createBaggingSpy.mockImplementation(async () => {
            return {
                baggingId: "",
            };
        });

        let printBaggingSpy = jest.spyOn(api, "getDetailsLabel");
        printBaggingSpy.mockImplementation(async () => {
            return Promise.resolve({ url: "test" });
        });

        let printLabelSpy = jest.spyOn(api, "getBaggingLabel");
        printLabelSpy.mockImplementation(async () => {
            return Promise.resolve({ url: test });
        });

        const baggingIdInput = getByLabelText("Bag ID");

        const submitButton = getByText("Submit");
        await fireEvent.click(submitButton);

        expect(createBaggingSpy).toHaveBeenCalled();
        expect(printBaggingSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Bag has been created", {
            classes: ["success"],
        });

        const button = getByText("Clear");
        await fireEvent.click(button);

        expect(baggingIdInput).toHaveValue("");
        //TODO: test case if data grid is empty
        getParcelSpy.mockRestore();
        hasItemsSpy.mockRestore();
        statusCheck.mockRestore();
    });

    afterAll(() => {
        getWarehouse.mockRestore();
    });
});
