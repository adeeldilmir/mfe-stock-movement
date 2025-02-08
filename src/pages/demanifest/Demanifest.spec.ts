// NOTE: jest-dom adds handy assertions to Jest and it is recommended, but not required.
import "@testing-library/jest-dom";
import { render, fireEvent, getByText } from "@testing-library/svelte";
import Demanifest from "./Demanifest.svelte";
import * as utils from "../../common/utils/utils";
import * as api from "./api";
import * as settings from "./columnsSetting.json";
import { toast } from "@zerodevx/svelte-toast";
import { cities } from "../../store";

jest.mock("../../common/utils/utils");
jest.mock("./api");
let openSpy;
let getWareHouseByNameSpy;
let getUserSpy;

jest.mock("@zerodevx/svelte-toast", () => ({
    ...jest.requireActual("@zerodevx/svelte-toast"),
    toast: {
        push: jest.fn(),
    },
}));

describe("Demanifest", () => {
    beforeAll(() => {
        openSpy = jest.spyOn(window, "open").mockImplementation((value) => {
            return window;
        });

        getUserSpy = jest.spyOn(utils, "getUser").mockImplementation(() => {
            return {
                userId: "",
                user: {
                    allowedLocations: ["001", "002", "003"],
                    firstName: "",
                    location: {
                        name: "",
                        cityCode: "",
                        warehouseCode: "",
                    },
                },
            };
        });

        jest.spyOn(api, "getColumnsSetting").mockImplementation(async () => {
            return settings;
        });

        cities.init({
            url: ``,
            items: [
                {
                    name: "Lahore",
                    id: "abc123",
                    cityCode: "001",
                    code: "001",
                },
            ],
        });
    });

    test("shows proper label when rendered", () => {
        const { getByText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });
        expect(getByText("De-manifest")).toBeInTheDocument();
    });

    test("Scan Manifest but id is not valid", async () => {
        const { getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        let IsManifestScanSpy = jest
            .spyOn(utils, "isExists")
            .mockReturnValue(true);

        let IsManifestSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        const manifestIdInput = getByLabelText("Manifest ID");
        await fireEvent.change(manifestIdInput, {
            target: { value: "12345678" },
        });

        expect(manifestIdInput).toHaveValue("12345678");
        expect(toast.push).toHaveBeenCalledWith("Invalid Manifest Id", {
            classes: ["error"],
        });

        IsManifestScanSpy.mockRestore();
        IsManifestSpy.mockRestore();
    });

    test("Scan Manifest but server return error", async () => {
        const { getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        let IsManifestScanSpy = jest
            .spyOn(utils, "isExists")
            .mockReturnValueOnce(true);

        let IsManifestSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let manifestLengthCheck = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let checkManifest = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                error: "Some Error",
            };
        });

        const manifestIdInput = getByLabelText("Manifest ID");
        await fireEvent.change(manifestIdInput, {
            target: { value: "MAN12345678" },
        });

        expect(manifestIdInput).toHaveValue("MAN12345678");
        expect(getManifestSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
            classes: ["error"],
        });

        IsManifestScanSpy.mockRestore();
        IsManifestSpy.mockRestore();
        manifestLengthCheck.mockRestore();
        checkManifest.mockRestore();
    });

    test("Scan Manifest but  Destination city is invalid", async () => {
        const { getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        let IsManifestScanSpy = jest
            .spyOn(utils, "isExists")
            .mockReturnValueOnce(true);

        let IsManifestSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let manifestLengthCheck = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let getLoadSpy = jest.spyOn(api, "getLoadingsByManifestId");
        getLoadSpy.mockImplementation(async () => {
            return {
                results: [
                    {
                        _id: "63b0063837c60a30fc9691ae",
                        destinationCity: "001",
                        destinationWarehouse: "01",
                        manifestIds: ["MAN12345678"],
                    },
                ],
                count: 5,
            };
        });

        let checkManifest = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let checkLoad = jest.spyOn(utils, "isEqual").mockReturnValueOnce(true);
        let checkManifestInLoad = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let loadDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let manifestDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                destinationCity: "001",
                journeyTypeCode: "Forward",
                originCity: "004",
                originWarehouse: "01",
                productTypeCode: "Corporate",
                serviceTypeCode: "Express",
                weight: 126,
                content: [
                    { id: "BAG-98765432", pieces: 3, type: "BAG", weight: 15 },
                ],
            };
        });

        const manifestIdInput = getByLabelText("Manifest ID");
        await fireEvent.change(manifestIdInput, {
            target: { value: "MAN12345678" },
        });

        expect(manifestIdInput).toHaveValue("MAN12345678");
        expect(getManifestSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Invalid Destination City", {
            classes: ["error"],
        });

        IsManifestScanSpy.mockRestore();
        IsManifestSpy.mockRestore();
        checkManifestInLoad.mockRestore();
        manifestLengthCheck.mockRestore();
        checkLoad.mockRestore();
        checkManifest.mockRestore();
        manifestDestinationSpy.mockRestore();
        loadDestinationSpy.mockRestore();
        getLoadSpy.mockRestore();
    });

    test("Scan Manifest but bu Maifest is not found", async () => {
        const { getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        let IsManifestScanSpy = jest
            .spyOn(utils, "isExists")
            .mockReturnValueOnce(true);

        let IsManifestSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                message: "Manifest not found",
                statusCode: 404,
            };
        });
        let manifestLengthCheck = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let checkManifest = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        const manifestIdInput = getByLabelText("Manifest ID");
        await fireEvent.change(manifestIdInput, {
            target: { value: "MAN12345678" },
        });

        expect(manifestIdInput).toHaveValue("MAN12345678");
        expect(getManifestSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Manifest not found", {
            classes: ["error"],
        });

        IsManifestScanSpy.mockRestore();
        IsManifestSpy.mockRestore();
        manifestLengthCheck.mockRestore();
        checkManifest.mockRestore();
    });

    test("Scan Manifest ", async () => {
        const { getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                destinationCity: "5dd7fa20dcfa9600152cc2e6",
                journeyTypeCode: "Forward",
                originCity: "5dd7fa20dcfa9600152cc2e6",
                originWarehouse: "62760aa9011e4122d3ae0a21",
                productTypeCode: "Corporate",
                serviceTypeCode: "Express",
                weight: 126,
                content: [
                    { id: "BAG-98765432", pieces: 3, type: "BAG", weight: 15 },
                ],
            };
        });

        let IsManifestScanSpy = jest
            .spyOn(utils, "isExists")
            .mockReturnValue(true);

        let IsManifestSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let manifestLengthCheck = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let getLoadSpy = jest.spyOn(api, "getLoadingsByManifestId");
        getLoadSpy.mockImplementation(async () => {
            return {
                results: [
                    {
                        _id: "63b0063837c60a30fc9691ae",
                        destinationCity: "001",
                        destinationWarehouse: "01",
                        manifestIds: ["MAN12345678"],
                    },
                ],
                count: 5,
            };
        });
        let checkManifest = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let checkLoad = jest.spyOn(utils, "isEqual").mockReturnValueOnce(true);
        let checkManifestInLoad = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let loadDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let manifestDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let IsManifestStatusMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValue(true);

        let getWarehouseSpy = jest.spyOn(api, "getWareHouseByCode");
        getWarehouseSpy.mockImplementation(async () => {
            return [
                {
                    name: "Lahore",
                },
            ];
        });

        let getAdministratorSpy = jest.spyOn(api, "getAdministrator");
        getAdministratorSpy.mockImplementation(async () => {
            return [
                {
                    firstName: "Adeel",
                    lastName: "Khan",
                },
            ];
        });
        const manifestIdInput = getByLabelText("Manifest ID");
        await fireEvent.change(manifestIdInput, {
            target: { value: "MAN12345678" },
        });

        expect(manifestIdInput).toHaveValue("MAN12345678");
        expect(getManifestSpy).toHaveBeenCalled();
        expect(getWarehouseSpy).toHaveBeenCalled();
        expect(getAdministratorSpy).toHaveBeenCalled();

        // getBagSpy.mockRestore();
        getManifestSpy.mockRestore();
        getWarehouseSpy.mockRestore();
        getAdministratorSpy.mockRestore();
        manifestLengthCheck.mockRestore();
        checkManifestInLoad.mockRestore();

        IsManifestStatusMatchSpy.mockRestore();
        checkManifest.mockRestore();
        checkLoad.mockRestore();
        IsManifestScanSpy.mockRestore();
        IsManifestSpy.mockRestore();
        manifestDestinationSpy.mockRestore();
        getLoadSpy.mockRestore();
        loadDestinationSpy.mockRestore();
    });

    test("Scan Manifest, But manifest is not at unloaded Status  ", async () => {
        const { getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });
        const manifest = {
            destinationCity: "5dd7fa20dcfa9600152cc2e6",
            journeyTypeCode: "Forward",
            originCity: "5dd7fa20dcfa9600152cc2e6",
            originWarehouse: "62760aa9011e4122d3ae0a21",
            productTypeCode: "Corporate",
            serviceTypeCode: "Express",
            currentStatusId: "loaded",
            weight: 126,
            content: [
                { id: "BAG-98765432", pieces: 3, type: "BAG", weight: 15 },
            ],
        };
        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return manifest;
        });

        let IsManifestScanSpy = jest
            .spyOn(utils, "isExists")
            .mockReturnValue(true);

        let IsManifestSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let manifestLengthCheck = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let getLoadSpy = jest.spyOn(api, "getLoadingsByManifestId");
        getLoadSpy.mockImplementation(async () => {
            return {
                results: [
                    {
                        _id: "63b0063837c60a30fc9691ae",
                        destinationCity: "001",
                        destinationWarehouse: "01",
                        manifestIds: ["MAN12345678"],
                    },
                ],
                count: 5,
            };
        });
        let checkManifest = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let checkLoad = jest.spyOn(utils, "isEqual").mockReturnValueOnce(true);
        let checkManifestInLoad = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let loadDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let manifestDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let IsManifestStatusMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        const manifestIdInput = getByLabelText("Manifest ID");
        await fireEvent.change(manifestIdInput, {
            target: { value: "MAN12345678" },
        });

        expect(manifestIdInput).toHaveValue("MAN12345678");
        expect(getManifestSpy).toHaveBeenCalled();

        getManifestSpy.mockRestore();

        expect(toast.push).toHaveBeenCalledWith(
            `Manifest Status (${manifest.currentStatusId}) is incorrect`,
            {
                classes: ["error"],
            }
        );

        IsManifestStatusMatchSpy.mockRestore();
        IsManifestSpy.mockRestore();
        IsManifestScanSpy.mockRestore();
        manifestLengthCheck.mockRestore();
        checkManifestInLoad.mockRestore();
        checkManifest.mockRestore();
        checkLoad.mockRestore();
        manifestDestinationSpy.mockRestore();
        getLoadSpy.mockRestore();
        loadDestinationSpy.mockRestore();
    });

    test("Scan Bags and Bag is not in manifest", async () => {
        const { getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                destinationCity: "5dd7fa20dcfa9600152cc2e6",
                journeyTypeCode: "Forward",
                originCity: "5dd7fa20dcfa9600152cc2e6",
                originWarehouse: "62760aa9011e4122d3ae0a21",
                productTypeCode: "Corporate",
                serviceTypeCode: "Express",
                currentStatusId: "Unloaded",
                weight: 126,
                content: [
                    { id: "BAG-98765432", pieces: 3, type: "BAG", weight: 15 },
                ],
            };
        });

        let IsManifestScanSpy = jest
            .spyOn(utils, "isExists")
            .mockReturnValue(true);

        let IsManifestSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let manifestLengthCheck = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let getLoadSpy = jest.spyOn(api, "getLoadingsByManifestId");
        getLoadSpy.mockImplementation(async () => {
            return {
                results: [
                    {
                        _id: "63b0063837c60a30fc9691ae",
                        destinationCity: "001",
                        destinationWarehouse: "01",
                        manifestIds: ["MAN12345678"],
                    },
                ],
                count: 5,
            };
        });
        let checkManifest = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let checkLoad = jest.spyOn(utils, "isEqual").mockReturnValueOnce(true);
        let checkManifestInLoad = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let loadDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let manifestDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let IsManifestStatusMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        const checkDuplicateScanEntryspy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getBagSpy = jest.spyOn(api, "getBag");
        getBagSpy.mockImplementation(async () => {
            return {
                baggingLabel: "BAG12345678",
                weight: "8",
                parcelIds: ["CN12344", "CN12345"],
            };
        });

        const scannedItemIsInManifestSpy = jest
            .spyOn(utils, "findIndexInArray")
            .mockReturnValue(-1);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "BAG12345678" } });

        expect(input).toHaveValue("BAG12345678");
        expect(getBagSpy).toHaveBeenCalled();

        getBagSpy.mockRestore();
        checkDuplicateScanEntryspy.mockRestore();
        scannedItemIsInManifestSpy.mockRestore();
        getManifestSpy.mockRestore();
        manifestLengthCheck.mockRestore();
        checkManifestInLoad.mockRestore();
        IsManifestStatusMatchSpy.mockRestore();
        checkManifest.mockRestore();
        checkLoad.mockRestore();
        IsManifestSpy.mockRestore();
        IsManifestScanSpy.mockRestore();
        manifestDestinationSpy.mockRestore();

        getLoadSpy.mockRestore();
        loadDestinationSpy.mockRestore();
    });

    test("Scan Bags and Bag is part of manifest", async () => {
        const { getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                destinationCity: "5dd7fa20dcfa9600152cc2e6",
                journeyTypeCode: "Forward",
                originCity: "5dd7fa20dcfa9600152cc2e6",
                originWarehouse: "62760aa9011e4122d3ae0a21",
                productTypeCode: "Corporate",
                serviceTypeCode: "Express",
                weight: 126,
                content: [
                    { id: "BAG-98765432", pieces: 3, type: "BAG", weight: 15 },
                ],
            };
        });

        let IsManifestScanSpy = jest
            .spyOn(utils, "isExists")
            .mockReturnValue(true);

        let IsManifestSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let getLoadSpy = jest.spyOn(api, "getLoadingsByManifestId");
        getLoadSpy.mockImplementation(async () => {
            return {
                results: [
                    {
                        _id: "63b0063837c60a30fc9691ae",
                        destinationCity: "001",
                        destinationWarehouse: "01",
                        manifestIds: ["MAN12345678"],
                    },
                ],
                count: 5,
            };
        });
        let checkManifest = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let checkLoad = jest.spyOn(utils, "isEqual").mockReturnValueOnce(false);
        let loadDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let manifestDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let IsManifestStatusMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let checkManifestInLoad = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        const manifestIdInput = getByLabelText("Manifest ID");
        await fireEvent.change(manifestIdInput, {
            target: { value: "MAN12345678" },
        });
        expect(manifestIdInput).toHaveValue("MAN12345678");
        expect(getManifestSpy).toHaveBeenCalled();

        const checkDuplicateScanEntryspy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getBagSpy = jest.spyOn(api, "getBag");
        getBagSpy.mockImplementation(async () => {
            return {
                baggingLabel: "BAG-98765432",
                weight: "8",
                parcelIds: ["CN12344", "CN12345"],
            };
        });

        jest.spyOn(utils, "removeDuplicateItemsById").mockImplementation(() => {
            return [{}];
        });

        const scannedItemIsInManifestSpy = jest
            .spyOn(utils, "findIndexInArray")
            .mockReturnValue(0);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "BAG12345678" } });

        expect(input).toHaveValue("BAG12345678");
        expect(getBagSpy).toHaveBeenCalled();

        getBagSpy.mockRestore();
        checkDuplicateScanEntryspy.mockRestore();
        scannedItemIsInManifestSpy.mockRestore();
        getManifestSpy.mockRestore();

        checkManifestInLoad.mockRestore();
        IsManifestStatusMatchSpy.mockRestore();
        checkManifest.mockRestore();
        checkLoad.mockRestore();
        IsManifestSpy.mockRestore();
        IsManifestScanSpy.mockRestore();
        manifestDestinationSpy.mockRestore();

        getLoadSpy.mockRestore();
        loadDestinationSpy.mockRestore();
    });

    test("Scan Bags,getBag throw error", async () => {
        const { getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntryspy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getBagSpy = jest.spyOn(api, "getBag");
        getBagSpy.mockImplementation(async () => {
            return {
                error: "Some Error",
            };
        });

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "BAG12345678" } });

        expect(input).toHaveValue("BAG12345678");
        expect(getBagSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
            classes: ["error"],
        });

        getBagSpy.mockRestore();
        checkDuplicateScanEntryspy.mockRestore();
    });

    test("Scan Parcels ,parcel is not in manifest", async () => {
        const { getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntryspy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getParcelSpy = jest.spyOn(api, "getParcel");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "CN123456789",
                weight: "8",
                pieces: 1,
            };
        });
        const scannedItemIsInManifestSpy = jest
            .spyOn(utils, "findIndexInArray")
            .mockReturnValue(-1);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "CN123456789" } });

        expect(input).toHaveValue("CN123456789");
        expect(getParcelSpy).toHaveBeenCalled();

        checkDuplicateScanEntryspy.mockRestore();
        scannedItemIsInManifestSpy.mockRestore();
        getParcelSpy.mockRestore();
    });

    test("Scan Parcels ,parcel is in manifest", async () => {
        const { getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                destinationCity: "5dd7fa20dcfa9600152cc2e6",
                journeyTypeCode: "Forward",
                originCity: "5dd7fa20dcfa9600152cc2e6",
                originWarehouse: "62760aa9011e4122d3ae0a21",
                productTypeCode: "Corporate",
                serviceTypeCode: "Express",
                weight: 126,
                content: [
                    { id: "CN123456789", pieces: 3, type: "CN", weight: 15 },
                ],
            };
        });

        let IsManifestScanSpy = jest
            .spyOn(utils, "isExists")
            .mockReturnValue(true);

        let IsManifestSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let manifestLengthCheck = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let getLoadSpy = jest.spyOn(api, "getLoadingsByManifestId");
        getLoadSpy.mockImplementation(async () => {
            return {
                results: [
                    {
                        _id: "63b0063837c60a30fc9691ae",
                        destinationCity: "001",
                        destinationWarehouse: "01",
                        manifestIds: ["MAN12345678"],
                    },
                ],
                count: 5,
            };
        });
        let checkManifest = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let checkLoad = jest.spyOn(utils, "isEqual").mockReturnValueOnce(true);
        let checkManifestInLoad = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let loadDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let manifestDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let IsManifestStatusMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        const manifestIdInput = getByLabelText("Manifest ID");
        await fireEvent.change(manifestIdInput, {
            target: { value: "MAN12345678" },
        });
        expect(manifestIdInput).toHaveValue("MAN12345678");
        expect(getManifestSpy).toHaveBeenCalled();

        const checkDuplicateScanEntryspy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getParcelSpy = jest.spyOn(api, "getParcel");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "CN123456789",
                weight: "8",
                pieces: 1,
            };
        });

        jest.spyOn(utils, "removeDuplicateItemsById").mockImplementation(() => {
            return [{}];
        });

        const scannedItemIsInManifestSpy = jest
            .spyOn(utils, "findIndexInArray")
            .mockReturnValue(0);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "CN123456789" } });

        expect(input).toHaveValue("CN123456789");
        expect(getParcelSpy).toHaveBeenCalled();

        checkDuplicateScanEntryspy.mockRestore();
        scannedItemIsInManifestSpy.mockRestore();
        getParcelSpy.mockRestore();
        manifestLengthCheck.mockRestore();
        checkManifestInLoad.mockRestore();
        IsManifestStatusMatchSpy.mockRestore();
        IsManifestSpy.mockRestore();
        IsManifestScanSpy.mockRestore();
        getManifestSpy.mockRestore();
        manifestDestinationSpy.mockRestore();
        checkManifest.mockRestore();
        checkLoad.mockRestore();
        getLoadSpy.mockRestore();
        loadDestinationSpy.mockRestore();
    });

    test("Scan Parcels, but get parcel throw error", async () => {
        const { getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntryspy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getParcelSpy = jest.spyOn(api, "getParcel");
        getParcelSpy.mockImplementation(async () => {
            return {
                error: "Some Error",
            };
        });

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "CN123456789" } });

        expect(input).toHaveValue("CN123456789");
        expect(getParcelSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
            classes: ["error"],
        });

        getParcelSpy.mockRestore();
        checkDuplicateScanEntryspy.mockRestore();
    });

    test("Scan Parcels,item is already scaned", async () => {
        const { getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntryspy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return true;
            });

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "CN123456789" } });

        expect(input).toHaveValue("CN123456789");
        expect(toast.push).toHaveBeenCalledWith("Item Already Scan", {
            classes: ["error"],
        });
        checkDuplicateScanEntryspy.mockRestore();
    });

    test("Entered weight does not matched the actual weight", async () => {
        const { getByLabelText, getByText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                destinationCity: "5dd7fa20dcfa9600152cc2e6",
                journeyTypeCode: "Forward",
                originCity: "5dd7fa20dcfa9600152cc2e6",
                originWarehouse: "62760aa9011e4122d3ae0a21",
                productTypeCode: "Corporate",
                serviceTypeCode: "Express",
                weight: 126,
                content: [
                    { id: "CN123456789", pieces: 3, type: "CN", weight: 15 },
                ],
            };
        });

        let IsManifestScanSpy = jest
            .spyOn(utils, "isExists")
            .mockReturnValue(true);

        let IsManifestSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let manifestLengthCheck = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let getLoadSpy = jest.spyOn(api, "getLoadingsByManifestId");
        getLoadSpy.mockImplementation(async () => {
            return {
                results: [
                    {
                        _id: "63b0063837c60a30fc9691ae",
                        destinationCity: "001",
                        destinationWarehouse: "01",
                        manifestIds: ["MAN12345678"],
                    },
                ],
                count: 5,
            };
        });
        let getBagSpy = jest.spyOn(api, "getBag");
        getBagSpy.mockImplementation(async () => {
            return {
                baggingLabel: "BAG12345678",
                weight: "8",
                parcelIds: ["CN12344", "CN12345"],
            };
        });

        jest.spyOn(utils, "removeDuplicateItemsById").mockImplementation(() => {
            return [{}];
        });

        let checkManifest = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let checkLoad = jest.spyOn(utils, "isEqual").mockReturnValueOnce(true);
        let checkManifestInLoad = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let loadDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let manifestDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let IsManifestStatusMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        const manifestIdInput = getByLabelText("Manifest ID");
        await fireEvent.change(manifestIdInput, {
            target: { value: "MAN12345678" },
        });
        expect(manifestIdInput).toHaveValue("MAN12345678");
        expect(getManifestSpy).toHaveBeenCalled();

        const isweightMatchSpy = jest
            .spyOn(utils, "isTolerated")
            .mockReturnValue(false);

        const cnInput = getByLabelText("CN/Bag");
        await fireEvent.input(cnInput, {
            target: { value: "BAG12345678" },
        });

        getManifestSpy.mockRestore();
        getBagSpy.mockRestore();
        isweightMatchSpy.mockRestore();
        IsManifestStatusMatchSpy.mockRestore();
        IsManifestSpy.mockRestore();
        manifestLengthCheck.mockRestore();
        checkManifestInLoad.mockRestore();
        IsManifestScanSpy.mockRestore();
        manifestDestinationSpy.mockRestore();
        checkManifest.mockRestore();
        checkLoad.mockRestore();
        getLoadSpy.mockRestore();
        loadDestinationSpy.mockRestore();
    });

    test("Entered weight matched the actual weight", async () => {
        const { getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                destinationCity: "5dd7fa20dcfa9600152cc2e6",
                journeyTypeCode: "Forward",
                originCity: "5dd7fa20dcfa9600152cc2e6",
                originWarehouse: "62760aa9011e4122d3ae0a21",
                productTypeCode: "Corporate",
                serviceTypeCode: "Express",
                weight: 126,
                content: [
                    { id: "CN123456789", pieces: 3, type: "CN", weight: 15 },
                ],
            };
        });

        let IsManifestScanSpy = jest
            .spyOn(utils, "isExists")
            .mockReturnValue(true);

        let IsManifestSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let manifestLengthCheck = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let getLoadSpy = jest.spyOn(api, "getLoadingsByManifestId");
        getLoadSpy.mockImplementation(async () => {
            return {
                results: [
                    {
                        _id: "63b0063837c60a30fc9691ae",
                        destinationCity: "001",
                        destinationWarehouse: "01",
                        manifestIds: ["MAN12345678"],
                    },
                ],
                count: 5,
            };
        });
        let checkManifest = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let checkLoad = jest.spyOn(utils, "isEqual").mockReturnValueOnce(true);
        let checkManifestInLoad = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let loadDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let manifestDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let IsManifestStatusMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        const manifestIdInput = getByLabelText("Manifest ID");
        await fireEvent.change(manifestIdInput, {
            target: { value: "MAN12345678" },
        });
        expect(manifestIdInput).toHaveValue("MAN12345678");
        expect(getManifestSpy).toHaveBeenCalled();

        let isweightMatchSpy = jest
            .spyOn(utils, "isTolerated")
            .mockReturnValue(true);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "CN123456789" } });

        expect(input).toHaveValue("CN123456789");

        isweightMatchSpy.mockRestore();
        IsManifestStatusMatchSpy.mockRestore();
        IsManifestSpy.mockRestore();

        manifestLengthCheck.mockRestore();
        checkManifestInLoad.mockRestore();
        IsManifestScanSpy.mockRestore();
        manifestDestinationSpy.mockRestore();
        checkLoad.mockRestore();
        checkManifest.mockRestore();
        getLoadSpy.mockRestore();
        loadDestinationSpy.mockRestore();
    });

    test("Exit Button click", async () => {
        const { getByText, getByLabelText } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        ///2:Submit click

        const journey = getByLabelText("Journey");
        const destinationCity = getByLabelText("Destination City");
        const productType = getByLabelText("Product Type");
        const serviceType = getByLabelText("Service");
        const manifestIdInput = getByLabelText("Manifest ID");

        const button = getByText("Exit");
        await fireEvent.click(button);

        expect(journey).toHaveValue("");
        expect(destinationCity).toHaveValue("");
        expect(productType).toHaveValue("");
        expect(serviceType).toHaveValup;
        expect(manifestIdInput).toHaveValue("");

        //TODO: test case if data grid is empty
    });

    test("Demanifest Button click,but item is missing", async () => {
        const { getByText, getByLabelText, getByTestId } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                destinationCity: "5dd7fa20dcfa9600152cc2e6",
                journeyTypeCode: "Forward",
                originCity: "5dd7fa20dcfa9600152cc2e6",
                originWarehouse: "62760aa9011e4122d3ae0a21",
                productTypeCode: "Corporate",
                serviceTypeCode: "Express",
                weight: 126,
                content: [
                    { id: "CN123456789", pieces: 3, type: "CN", weight: 15 },
                ],
            };
        });

        let IsManifestScanSpy = jest
            .spyOn(utils, "isExists")
            .mockReturnValue(true);

        let IsManifestSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let checkManifestInLoad = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let getLoadSpy = jest.spyOn(api, "getLoadingsByManifestId");
        getLoadSpy.mockImplementation(async () => {
            return {
                results: [
                    {
                        _id: "63b0063837c60a30fc9691ae",
                        destinationCity: "001",
                        destinationWarehouse: "01",
                        manifestIds: ["MAN12345678"],
                    },
                ],
                count: 5,
            };
        });
        let checkManifest = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let checkLoad = jest.spyOn(utils, "isEqual").mockReturnValueOnce(true);
        let manifestLengthCheck = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let loadDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let manifestDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let IsManifestStatusMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        const manifestIdInput = getByLabelText("Manifest ID");
        await fireEvent.change(manifestIdInput, {
            target: { value: "MAN12345678" },
        });
        expect(manifestIdInput).toHaveValue("MAN12345678");
        expect(getManifestSpy).toHaveBeenCalled();

        const button = getByTestId("Demanifest");
        await fireEvent.click(button);

        getManifestSpy.mockRestore();
        IsManifestStatusMatchSpy.mockRestore();
        IsManifestSpy.mockRestore();
        IsManifestScanSpy.mockRestore();

        manifestLengthCheck.mockRestore();
        checkManifestInLoad.mockRestore();
        manifestDestinationSpy.mockRestore();
        checkLoad.mockRestore();
        checkManifest.mockRestore();
        getLoadSpy.mockRestore();
        loadDestinationSpy.mockRestore();
    });

    test("Demanifest Button click", async () => {
        const { getByText, getByLabelText, getByTestId } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        let getWarehouseSpy = jest.spyOn(api, "getWareHouseByCode");
        getWarehouseSpy.mockImplementation(async () => {
            return [
                {
                    name: "Lahore",
                },
            ];
        });

        let getAdministratorSpy = jest.spyOn(api, "getAdministrator");
        getAdministratorSpy.mockImplementation(async () => {
            return [
                {
                    firstName: "Adeel",
                    lastName: "Khan",
                },
            ];
        });

        let manifestRes1 = {
            destinationCity: "5dd7fa20dcfa9600152cc2e6",
            journeyTypeCode: "Forward",
            originCity: "5dd7fa20dcfa9600152cc2e6",
            originWarehouse: "62760aa9011e4122d3ae0a21",
            productTypeCode: "Corporate",
            serviceTypeCode: "Express",
            currentStatusId: "Unloaded",
            weight: 126,
            sourceId: "",
            content: [{ id: "CN123456789", pieces: 3, type: "CN", weight: 15 }],
        };
        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return { ...manifestRes1 };
        });

        let IsManifestScanSpy = jest
            .spyOn(utils, "isExists")
            .mockReturnValue(true);

        let IsManifestSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let manifestLengthCheck = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let getLoadSpy = jest.spyOn(api, "getLoadingsByManifestId");
        getLoadSpy.mockImplementation(async () => {
            return {
                results: [
                    {
                        _id: "63b0063837c60a30fc9691ae",
                        destinationCity: "001",
                        destinationWarehouse: "01",
                        manifestIds: ["MAN12345678"],
                    },
                ],
                count: 5,
            };
        });
        let checkManifest = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let checkLoad = jest.spyOn(utils, "isEqual").mockReturnValueOnce(true);
        let checkManifestInLoad = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let loadDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let manifestDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let IsManifestStatusMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        const manifestIdInput = getByLabelText("Manifest ID");
        await fireEvent.change(manifestIdInput, {
            target: { value: "MAN12345678" },
        });
        expect(manifestIdInput).toHaveValue("MAN12345678");
        expect(getManifestSpy).toHaveBeenCalled();

        const checkDuplicateScanEntryspy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getParcelSpy = jest.spyOn(api, "getParcel");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "CN123456789",
                weight: "8",
                pieces: 1,
                originCityId: "abc123",
                cityId: "abc123",
                vendor: { name: "Adeel" },
            };
        });

        jest.spyOn(utils, "removeDuplicateItemsById").mockImplementation(() => {
            return [{}];
        });

        const scannedItemIsInManifestSpy = jest
            .spyOn(utils, "findIndexInArray")
            .mockReturnValue(0);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "CN123456789" } });

        expect(input).toHaveValue("CN123456789");
        expect(getParcelSpy).toHaveBeenCalled();

        const button = getByTestId("Demanifest");
        await fireEvent.click(button);

        expect(toast.push).toHaveBeenCalledWith(
            "Parcel/Bag demanifested Successfully!",
            {
                classes: ["success"],
            }
        );

        getManifestSpy.mockRestore();
        checkDuplicateScanEntryspy.mockRestore();
        getParcelSpy.mockRestore();
        scannedItemIsInManifestSpy.mockRestore();
        IsManifestStatusMatchSpy.mockRestore();
        IsManifestSpy.mockRestore();

        manifestLengthCheck.mockRestore();
        checkManifestInLoad.mockRestore();
        IsManifestScanSpy.mockRestore();
        checkLoad.mockRestore();
        checkManifest.mockRestore();
        manifestDestinationSpy.mockRestore();
        getLoadSpy.mockRestore();
        loadDestinationSpy.mockRestore();
    });

    test("Marked Disputed Button click", async () => {
        const { getByText, getByLabelText, getByTestId } = render(Demanifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        let manifestRes1 = {
            destinationCity: "5dd7fa20dcfa9600152cc2e6",
            journeyTypeCode: "Forward",
            originCity: "5dd7fa20dcfa9600152cc2e6",
            originWarehouse: "62760aa9011e4122d3ae0a21",
            productTypeCode: "Corporate",
            serviceTypeCode: "Express",
            currentStatusId: "Unloaded",
            weight: 126,
            sourceId: "",
            content: [{ id: "CN123456789", pieces: 3, type: "CN", weight: 15 }],
        };
        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return manifestRes1;
        });

        let IsManifestScanSpy = jest
            .spyOn(utils, "isExists")
            .mockReturnValue(true);

        let IsManifestSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        let manifestLengthCheck = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let getLoadSpy = jest.spyOn(api, "getLoadingsByManifestId");
        getLoadSpy.mockImplementation(async () => {
            return {
                results: [
                    {
                        _id: "63b0063837c60a30fc9691ae",
                        destinationCity: "001",
                        destinationWarehouse: "01",
                        manifestIds: ["MAN12345678"],
                    },
                ],
                count: 5,
            };
        });
        let checkManifest = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let checkLoad = jest.spyOn(utils, "isEqual").mockReturnValueOnce(true);
        let checkManifestInLoad = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);
        let loadDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let manifestDestinationSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let IsManifestStatusMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        const manifestIdInput = getByLabelText("Manifest ID");
        await fireEvent.change(manifestIdInput, {
            target: { value: "MAN12345678" },
        });
        expect(manifestIdInput).toHaveValue("MAN12345678");
        expect(getManifestSpy).toHaveBeenCalled();

        const cofirmDemanifestButton = getByTestId("Demanifest");
        await fireEvent.click(cofirmDemanifestButton);

        const button = getByText("Mark Disputed");
        await fireEvent.click(button);

        expect(toast.push).toHaveBeenCalledWith(
            "Parcel/Bag demanifested Successfully!",
            {
                classes: ["success"],
            }
        );

        expect(toast.push).toHaveBeenCalledWith(
            "Parcel/Bag marked disputed successfully",
            {
                classes: ["success"],
            }
        );

        IsManifestStatusMatchSpy.mockRestore();
        IsManifestSpy.mockRestore();
        IsManifestScanSpy.mockRestore();
        manifestLengthCheck.mockRestore();
        checkManifestInLoad.mockRestore();
        manifestDestinationSpy.mockRestore();
        checkLoad.mockRestore();
        checkManifest.mockRestore();
        getLoadSpy.mockRestore();
        loadDestinationSpy.mockRestore();
    });

    afterAll(() => {
        getUserSpy.mockRestore();
    });
});
