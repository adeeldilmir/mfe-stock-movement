// NOTE: jest-dom adds handy assertions to Jest and it is recommended, but not required.
import "@testing-library/jest-dom";
import { render, fireEvent } from "@testing-library/svelte";
import Debagging from "./Debagging.svelte";
import * as utils from "../../common/utils/utils";
import * as api from "./api";
import * as settings from "./columnsSetting.json";
import { toast } from "@zerodevx/svelte-toast";
import { cities, warehouses } from "../../store";

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

describe("Debagging", () => {
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

        let getManifestSpy = jest.spyOn(api, "getManifestByBagId");
        getManifestSpy.mockImplementation(async () => {
            return {
                results: [
                    {
                        _id: "63b0063837c60a30fc9691ae",
                        destinationCity: "001",
                        statusHistory: [
                            {
                                location: {
                                    cityCode: "001",
                                    warehouseCode: "01",
                                },
                            },
                        ],
                    },
                ],
                count: 5,
            };
        });
    });

    test("shows proper label when rendered", () => {
        const { getByText } = render(Debagging, {
            progress: { start: () => {}, finish: () => {} },
        });
        expect(getByText("Debagging")).toBeInTheDocument();
    });

    test("check for weight entered and bag existence", async () => {
        const { getByLabelText } = render(Debagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        let isExistsSpy = jest.spyOn(utils, "isExists");
        isExistsSpy.mockImplementation(() => {
            return true;
        });

        let isEqualSpy = jest.spyOn(utils, "isEqual");
        isEqualSpy.mockReturnValueOnce(true).mockReturnValueOnce(true);

        let weightEnteredSpy = jest.spyOn(utils, "isExists");
        weightEnteredSpy.mockImplementation(() => {
            return true;
        });

        let bagExistsSpy = jest.spyOn(api, "bagExists");
        bagExistsSpy.mockImplementation(async () => {
            return {
                weight: "1",
                parcelIds: ["LHE123"],
                journeyTypeCode: "",
                productTypeCode: "",
                serviceTypeCode: "",
                originCity: "001",
                destinationCity: "001",
                originWarehouse: "01",
            };
        });

        // const weightInput = getByLabelText("Weight");
        // await fireEvent.change(weightInput, { target: { value: "1" } });

        const bagInput = getByLabelText("Bag");
        await fireEvent.change(bagInput, { target: { value: "BAG123456789" } });

        expect(isExistsSpy).toHaveBeenCalled();
        expect(isEqualSpy).toHaveBeenCalled();
        expect(weightEnteredSpy).toHaveBeenCalled();

        isExistsSpy.mockRestore();
        isEqualSpy.mockRestore();
        weightEnteredSpy.mockRestore();
    });
    test("check if weight is entered and bag exists is successful", async () => {
        const { getByLabelText, getByText } = render(Debagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        let isExistsSpy = jest.spyOn(utils, "isExists");
        isExistsSpy.mockImplementation(() => {
            return true;
        });

        let isEqualSpy = jest.spyOn(utils, "isEqual");
        isEqualSpy
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let weightEnteredSpy = jest.spyOn(utils, "isExists");
        weightEnteredSpy.mockImplementation(() => {
            return true;
        });

        let demanifestCheckSpy = jest.spyOn(utils, "isEqual");
        demanifestCheckSpy.mockImplementation(() => {
            return true;
        });

        // let weightSpy = jest.spyOn(utils, "isTolerated");
        // weightSpy.mockImplementation(() => {
        //     return true;
        // });

        let bagExistsSpy = jest.spyOn(api, "bagExists");
        bagExistsSpy.mockImplementation(async () => {
            return {
                weight: "1",
                parcelIds: ["LHE123412341211", "LHE123412341221"],
                journeyTypeCode: "",
                productTypeCode: "",
                currentStatusId: "Demanifested",
                serviceTypeCode: "",
                originCity: "001",
                destinationCity: "001",
                originWarehouse: "01",
            };
        });

        let parcelExistSpy = jest.spyOn(utils, "isExists");
        parcelExistSpy.mockImplementation(() => {
            return true;
        });

        let parcelSpy = jest.spyOn(api, "getParcelData");
        parcelSpy.mockImplementation(async () => {
            return {
                id: "LHE123412341211",
                weight: "8",
                amount: "100",
            };
        });

        // const weightInput = getByLabelText("Weight");
        // await fireEvent.change(weightInput, { target: { value: "1" } });

        // expect(weightInput).toHaveValue("1");

        const bagInput = getByLabelText("Bag");
        await fireEvent.change(bagInput, { target: { value: "BAG123456789" } });

        expect(bagInput).toHaveValue("BAG123456789");

        const input = getByLabelText("CN");
        await fireEvent.change(input, { target: { value: "LHE123412341211" } });

        expect(input).toHaveValue("LHE123412341211");

        let submitWeightSpy = jest.spyOn(utils, "isEqual");
        submitWeightSpy.mockImplementation(() => {
            return true;
        });

        const confirmDebaggingButton = getByText("Submit");
        await fireEvent.click(confirmDebaggingButton);

        expect(toast.push).toHaveBeenCalledWith(
            "Parcel(s) debagged Successfully",
            {
                classes: ["success"],
            }
        );

        expect(isExistsSpy).toHaveBeenCalled();
        expect(isEqualSpy).toHaveBeenCalled();
        expect(weightEnteredSpy).toHaveBeenCalled();
        expect(demanifestCheckSpy).toHaveBeenCalled();
        // expect(weightSpy).toHaveBeenCalled();
        expect(parcelSpy).toHaveBeenCalled();
        expect(parcelExistSpy).toHaveBeenCalled();
        expect(submitWeightSpy).toHaveBeenCalled();

        // weightSpy.mockRestore();
        isExistsSpy.mockRestore();
        parcelSpy.mockRestore();
        parcelExistSpy.mockRestore();
        submitWeightSpy.mockRestore();
    });

    test("check if bag exists and parcels populated then exit", async () => {
        const { getByLabelText, getByText } = render(Debagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        let isExistsSpy = jest.spyOn(utils, "isExists");
        isExistsSpy.mockImplementation(() => {
            return true;
        });

        let isEqualSpy = jest.spyOn(utils, "isEqual");
        isEqualSpy
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let weightEnteredSpy = jest.spyOn(utils, "isExists");
        weightEnteredSpy.mockImplementation(() => {
            return true;
        });

        let demanifestCheckSpy = jest.spyOn(utils, "isEqual");
        demanifestCheckSpy.mockImplementation(() => {
            return true;
        });

        // let weightSpy = jest.spyOn(utils, "isTolerated");
        // weightSpy.mockImplementation(() => {
        //     return true;
        // });

        let bagExistsSpy = jest.spyOn(api, "bagExists");
        bagExistsSpy.mockImplementation(async () => {
            return {
                weight: "1",
                parcelIds: ["LHE123412341211", "LHE123412341221"],
                journeyTypeCode: "",
                productTypeCode: "",
                currentStatusId: "Demanifested",
                serviceTypeCode: "",
                originCity: "001",
                destinationCity: "001",
                originWarehouse: "01",
            };
        });

        let parcelExistSpy = jest.spyOn(utils, "isExists");
        parcelExistSpy.mockImplementation(() => {
            return true;
        });

        let parcelSpy = jest.spyOn(api, "getParcelData");
        parcelSpy.mockImplementation(async () => {
            return {
                id: "LHE123412341211",
                weight: "8",
                amount: "100",
            };
        });

        // const weightInput = getByLabelText("Weight");
        // await fireEvent.change(weightInput, { target: { value: "1" } });

        // expect(weightInput).toHaveValue("1");

        const bagInput = getByLabelText("Bag");
        await fireEvent.change(bagInput, { target: { value: "BAG123456789" } });

        expect(bagInput).toHaveValue("BAG123456789");

        const input = getByLabelText("CN");
        await fireEvent.change(input, { target: { value: "LHE123412341211" } });

        expect(input).toHaveValue("LHE123412341211");

        let submitWeightSpy = jest.spyOn(utils, "isEqual");
        submitWeightSpy.mockImplementation(() => {
            return true;
        });

        const confirmDebaggingButton = getByText("Submit");
        await fireEvent.click(confirmDebaggingButton);

        expect(toast.push).toHaveBeenCalledWith(
            "Parcel(s) debagged Successfully",
            {
                classes: ["success"],
            }
        );

        const button = getByText("Exit");
        await fireEvent.click(button);

        const journey = getByLabelText("Debagging Type");
        const destinationCity = getByLabelText("Destination City");
        const productType = getByLabelText("Product Type");
        const serviceType = getByLabelText("Service");

        expect(isExistsSpy).toHaveBeenCalled();
        expect(isEqualSpy).toHaveBeenCalled();
        expect(weightEnteredSpy).toHaveBeenCalled();
        expect(demanifestCheckSpy).toHaveBeenCalled();
        // expect(weightSpy).toHaveBeenCalled();
        expect(parcelSpy).toHaveBeenCalled();
        expect(parcelExistSpy).toHaveBeenCalled();
        expect(submitWeightSpy).toHaveBeenCalled();
        expect(journey).toHaveValue("");
        expect(destinationCity).toHaveValue("");
        expect(productType).toHaveValue("");
        expect(serviceType).toHaveValue("");

        // weightSpy.mockRestore();
        demanifestCheckSpy.mockRestore();
        isExistsSpy.mockRestore();
        parcelSpy.mockRestore();
        parcelExistSpy.mockRestore();
        submitWeightSpy.mockRestore();
    });

    test("Scan Parcels,item is already scanned", async () => {
        const { getByLabelText } = render(Debagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        jest.spyOn(utils, "checkDuplicateScanEntry").mockImplementation(() => {
            return true;
        });

        const input = getByLabelText("CN");
        await fireEvent.change(input, { target: { value: "LHE123412341211" } });

        expect(input).toHaveValue("LHE123412341211");
        expect(toast.push).toHaveBeenCalledWith("Parcel already scanned", {
            classes: ["error"],
        });
    });

    test("Scan Parcels, but get parcel throw error", async () => {
        const { getByLabelText } = render(Debagging, {
            progress: { start: () => {}, finish: () => {} },
        });

        jest.spyOn(utils, "checkDuplicateScanEntry").mockImplementation(() => {
            return false;
        });

        let getParcelSpy = jest.spyOn(api, "getParcelData");
        getParcelSpy.mockImplementation(async () => {
            return {
                error: "Some Error",
            };
        });

        const input = getByLabelText("CN");
        await fireEvent.change(input, { target: { value: "LHE123412341211" } });

        expect(input).toHaveValue("LHE123412341211");
        expect(getParcelSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
            classes: ["error"],
        });

        getParcelSpy.mockRestore();
    });

    afterAll(() => {});
});
