// NOTE: jest-dom adds handy assertions to Jest and it is recommended, but not required.
import "@testing-library/jest-dom";
import { render, fireEvent } from "@testing-library/svelte";
import Manifest from "./Manifest.svelte";
import * as utils from "../../common/utils/utils";
import * as api from "./api";
import * as settings from "./columnsSetting.json";
import { toast } from "@zerodevx/svelte-toast";
import { cities } from "../../store";

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

describe("Manifest", () => {
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
                    },
                ];
            });
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
    test("shows proper label when rendered", () => {
        const { getByText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });
        expect(getByText("Manifest")).toBeInTheDocument();
    });

    test("Manifest submission when no parcels scanned", async () => {
        const { getByText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        jest.spyOn(utils, "hasItems").mockImplementation(() => {
            return false;
        });

        let createManifestSpy = jest.spyOn(api, "createManifest");
        createManifestSpy.mockImplementation(async () => {
            return {
                manifestId: "",
            };
        });

        let printManifestSpy = jest.spyOn(api, "printManifest");
        printManifestSpy.mockImplementation(async () => {
            return Promise.resolve({ url: "test" });
        });

        const button = getByText("Submit");
        await fireEvent.click(button);

        // expect(toast.push).toHaveBeenCalledWith("List should not be empty", {
        //     classes: ["error"],
        // });
        expect(createManifestSpy).not.toHaveBeenCalled();
        expect(printManifestSpy).not.toHaveBeenCalled();

        createManifestSpy.mockRestore();
        printManifestSpy.mockRestore();
    });

    test("Manifest submission when parcels are scanned.Manifest Created successfully", async () => {
        const { getByText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        jest.spyOn(utils, "hasItems").mockImplementation(() => {
            return true;
        });

        let createManifestSpy = jest.spyOn(api, "createManifest");
        createManifestSpy.mockImplementation(async () => {
            return {
                manifestId: "abc",
            };
        });

        let printManifestSpy = jest.spyOn(api, "printManifest");
        printManifestSpy.mockImplementation(async () => {
            return Promise.resolve({ url: "test" });
        });

        const button = getByText("Submit");
        await fireEvent.click(button);

        expect(createManifestSpy).toHaveBeenCalled();
        expect(printManifestSpy).toHaveBeenCalled();
        // expect(toast.push).toHaveBeenCalled();

        createManifestSpy.mockRestore();
        printManifestSpy.mockRestore();
    });

    test("Manifest submission when parcels are scanned but createdManifest throw error.", async () => {
        const { getByText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        jest.spyOn(utils, "hasItems").mockImplementation(() => {
            return true;
        });

        let createManifestSpy = jest.spyOn(api, "createManifest");
        createManifestSpy.mockImplementation(async () => {
            return {
                error: "Some Error",
            };
        });

        let printManifestSpy = jest.spyOn(api, "printManifest");

        printManifestSpy.mockImplementation(async () => {
            return Promise.resolve({ url: "test" });
        });

        const button = getByText("Submit");
        await fireEvent.click(button);

        expect(createManifestSpy).toHaveBeenCalled();
        expect(printManifestSpy).not.toHaveBeenCalled();
        // expect(toast.push).toHaveBeenCalledWith("Something went wrong", {
        //     classes: ["error"],
        // });

        createManifestSpy.mockRestore();
        printManifestSpy.mockRestore();
    });

    test("Scan Bags", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getBagSpy = jest.spyOn(api, "getBag");
        getBagSpy.mockImplementation(async () => {
            return {
                baggingLabel: "BAG12345678",
                weight: 8,
                parcelIds: ["CN12344", "CN12345"],
            };
        });

        jest.spyOn(utils, "removeDuplicateItemsById").mockImplementation(() => {
            return [{}];
        });
        let journeyTypeForwardSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);
        let isDestinationCityMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValue(true);

        let isParcelAtSwyftWarehouseSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "BAG12345678" } });

        expect(input).toHaveValue("BAG12345678");
        expect(getBagSpy).toHaveBeenCalled();

        getBagSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
        isDestinationCityMatchSpy.mockRestore();
        journeyTypeForwardSpy.mockRestore();
        isParcelAtSwyftWarehouseSpy.mockRestore();
    });

    test("Scan Bags,but destination is invalid", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getBagSpy = jest.spyOn(api, "getBag");
        getBagSpy.mockImplementation(async () => {
            return {
                baggingLabel: "BAG12345678",
                weight: 8,
                parcelIds: ["CN12344", "CN12345"],
            };
        });

        let journeyTypeForwardSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);
        let isDestinationCityMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValue(false);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "BAG12345678" } });

        expect(input).toHaveValue("BAG12345678");
        expect(getBagSpy).toHaveBeenCalled();
        // expect(toast.push).toHaveBeenCalledWith("Invalid Destination City", {
        //     classes: ["error"],
        // });

        getBagSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
        isDestinationCityMatchSpy.mockRestore();
        journeyTypeForwardSpy.mockRestore();
    });

    test("Scan Bags,but origin city is invalid,In case of return manifest ", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getBagSpy = jest.spyOn(api, "getBag");
        getBagSpy.mockImplementation(async () => {
            return {
                baggingLabel: "BAG12345678",
                weight: 8,
                parcelIds: ["CN12344", "CN12345"],
                originCity: "001",
            };
        });

        let journeyTypeForwardSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let journeyTypeReturnSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let isDestinationCityMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValue(false);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "BAG12345678" } });

        expect(input).toHaveValue("BAG12345678");
        expect(getBagSpy).toHaveBeenCalled();
        // expect(toast.push).toHaveBeenCalledWith("Invalid Origin City", {
        //     classes: ["error"],
        // });

        getBagSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
        isDestinationCityMatchSpy.mockRestore();
        journeyTypeForwardSpy.mockRestore();
        journeyTypeReturnSpy.mockRestore();
    });

    test("Scan Bags,but Bag is not at require status", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getBagSpy = jest.spyOn(api, "getBag");
        getBagSpy.mockImplementation(async () => {
            return {
                baggingLabel: "BAG12345678",
                weight: 8,
                parcelIds: ["CN12344", "CN12345"],
            };
        });

        let journeyTypeForwardSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let isDestinationCityMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let isStatusMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "BAG12345678" } });

        expect(input).toHaveValue("BAG12345678");
        expect(getBagSpy).toHaveBeenCalled();
        // expect(toast.push).toHaveBeenCalledWith(
        //     "Bag is not at Required status",
        //     { classes: ["error"] }
        // );

        getBagSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
        isDestinationCityMatchSpy.mockRestore();
        isStatusMatchSpy.mockRestore();
        journeyTypeForwardSpy.mockRestore();
    });

    test("Scan Bags,but Bag jouney is not Forward ,in case of Forward manifest", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getBagSpy = jest.spyOn(api, "getBag");
        getBagSpy.mockImplementation(async () => {
            return {
                baggingLabel: "BAG12345678",
                weight: 8,
                parcelIds: ["CN12344", "CN12345"],
            };
        });

        let journeyTypeForwardSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "BAG12345678" } });

        expect(input).toHaveValue("BAG12345678");
        expect(getBagSpy).toHaveBeenCalled();
        // expect(toast.push).toHaveBeenCalledWith(
        //     "Bag Journey type must be Forward.",
        //     { classes: ["error"] }
        // );

        getBagSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
        journeyTypeForwardSpy.mockRestore();
    });

    test("Scan Bags,but Bag jouney is not Return ,in case of Return manifest.", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getBagSpy = jest.spyOn(api, "getBag");
        getBagSpy.mockImplementation(async () => {
            return {
                baggingLabel: "BAG12345678",
                weight: 8,
                parcelIds: ["CN12344", "CN12345"],
            };
        });

        let journeyTypeForwardSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let journeyTypeReturnSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "BAG12345678" } });

        expect(input).toHaveValue("BAG12345678");
        expect(getBagSpy).toHaveBeenCalled();
        // expect(toast.push).toHaveBeenCalledWith(
        //     "Bag Journey type must be Return.",
        //     { classes: ["error"] }
        // );

        getBagSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
        journeyTypeForwardSpy.mockRestore();
        journeyTypeReturnSpy.mockRestore();
    });

    test("Scan Bags,getBag throw error", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
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
        // expect(toast.push).toHaveBeenCalledWith("Invalid Bag Id", {
        //     classes: ["error"],
        // });

        getBagSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
    });

    test("Scan Parcels", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getParcelSpy = jest.spyOn(api, "getParcel");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "CN123456789",
                weight: 8,
                pieces: 1,
                city: {
                    id: "abc123",
                },
            };
        });

        jest.spyOn(utils, "removeDuplicateItemsById").mockImplementation(() => {
            return [{}];
        });

        let journeyTypeForwardSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let journeyTypeReturnSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let isDestinationCityMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValue(true);

        let isParcelAtSwyftWarehouseSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "CN123456789" } });

        expect(input).toHaveValue("CN123456789");
        expect(getParcelSpy).toHaveBeenCalled();

        isDestinationCityMatchSpy.mockRestore();
        getParcelSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
        journeyTypeForwardSpy.mockRestore();
        journeyTypeReturnSpy.mockRestore();
        isParcelAtSwyftWarehouseSpy.mockRestore();
    });

    test("Scan Parcels,But parcel is not At swyft warehouse Status", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getParcelSpy = jest.spyOn(api, "getParcel");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "CN123456789",
                weight: 8,
                pieces: 1,
                currentStatusId: "abcd12333",
                city: {
                    id: "abc123",
                },
            };
        });

        let journeyTypeForwardSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let journeyTypeReturnSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let isParcelAtSwyftWarehouseSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "CN123456789" } });

        expect(input).toHaveValue("CN123456789");
        expect(getParcelSpy).toHaveBeenCalled();
        // expect(toast.push).toHaveBeenCalledWith(
        //     "Parcel is not at Swyft Warehouse",
        //     { classes: ["error"] }
        // );

        getParcelSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
        isParcelAtSwyftWarehouseSpy.mockRestore();
        journeyTypeForwardSpy.mockRestore();
        journeyTypeReturnSpy.mockRestore();
    });

    test("Scan Parcels,But Parcel previous Status is Cancelled, on Forward journey", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getParcelSpy = jest.spyOn(api, "getParcel");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "CN123456789",
                weight: 8,
                pieces: 1,
                currentStatusId: "abcd12333",
                city: {
                    id: "abc123",
                },
            };
        });

        let journeyTypeForwardSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let isPreviousStatusCancelledSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "CN123456789" } });

        expect(input).toHaveValue("CN123456789");
        expect(getParcelSpy).toHaveBeenCalled();
        // expect(toast.push).toHaveBeenCalledWith(
        //     "Parcel previous Status can not be cancelled",
        //     { classes: ["error"] }
        // );

        getParcelSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
        journeyTypeForwardSpy.mockRestore();
        isPreviousStatusCancelledSpy.mockRestore();
    });

    test("Scan Parcels,But Parcel previous Status is not cancelled, on Return journey", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getParcelSpy = jest.spyOn(api, "getParcel");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "CN123456789",
                weight: 8,
                pieces: 1,
                currentStatusId: "abcd12333",
                city: {
                    id: "abc123",
                },
            };
        });

        let journeyTypeForwardSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let journeyTypeReturnSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let isPreviousStatusCancelledSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "CN123456789" } });

        expect(input).toHaveValue("CN123456789");
        expect(getParcelSpy).toHaveBeenCalled();
        // expect(toast.push).toHaveBeenCalledWith(
        //     "Parcel previous Status must be cancelled",
        //     { classes: ["error"] }
        // );

        getParcelSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
        journeyTypeForwardSpy.mockRestore();
        isPreviousStatusCancelledSpy.mockRestore();
        journeyTypeReturnSpy.mockRestore();
    });

    test("Scan Parcels,But Parcel has Invalid Destination city,In Case of forward jouney", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getParcelSpy = jest.spyOn(api, "getParcel");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "CN123456789",
                weight: 8,
                pieces: 1,
                currentStatusId: "abcd12333",
                city: {
                    id: "abc123",
                },
            };
        });

        let journeyTypeForwardSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let isPreviousStatusCancelledSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let isDestinationCityMatchSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "CN123456789" } });

        expect(input).toHaveValue("CN123456789");
        expect(getParcelSpy).toHaveBeenCalled();
        // expect(toast.push).toHaveBeenCalledWith("Invalid Destination City", {
        //     classes: ["error"],
        // });

        getParcelSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
        journeyTypeForwardSpy.mockRestore();
        isDestinationCityMatchSpy.mockRestore();
        isPreviousStatusCancelledSpy.mockRestore();
    });

    test("Scan Parcels,But Parcel has Invalid Origin city,In case of return jouney", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getParcelSpy = jest.spyOn(api, "getParcel");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "CN123456789",
                weight: 8,
                pieces: 1,
                currentStatusId: "abcd12333",
                city: {
                    id: "abc123",
                },
            };
        });

        let journeyTypeForwardSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let journeyTypeReturnSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let isPreviousStatusCancelledSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);

        let isOriginCityMatchSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "CN123456789" } });

        expect(input).toHaveValue("CN123456789");
        expect(getParcelSpy).toHaveBeenCalled();
        // expect(toast.push).toHaveBeenCalledWith("Invalid Origin City", {
        //     classes: ["error"],
        // });

        getParcelSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
        journeyTypeForwardSpy.mockRestore();
        // isDestinationCityMatchSpy.mockRestore();
        isOriginCityMatchSpy.mockRestore();
        journeyTypeReturnSpy.mockRestore();
        isPreviousStatusCancelledSpy.mockRestore();
    });

    test("Scan Parcels, but get parcel throw error", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
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
        // expect(toast.push).toHaveBeenCalledWith("Invalid Parcel Id", {
        //     classes: ["error"],
        // });

        getParcelSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
    });

    test("Scan Parcels,item is already scaned", async () => {
        const { getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return true;
            });

        const input = getByLabelText("CN/Bag");
        await fireEvent.change(input, { target: { value: "CN123456789" } });

        expect(input).toHaveValue("CN123456789");
        // expect(toast.push).toHaveBeenCalledWith("Item Already Scan", {
        //     classes: ["error"],
        // });

        checkDuplicateScanEntrySpy.mockRestore();
    });

    test("Refresh Button click", async () => {
        const { getByText, getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let journeyTypeForwardSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let journeyTypeReturnSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let isDestinationCityMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValue(true);

        let isParcelAtSwyftWarehouseSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        //1:parcel scan

        let getParcelSpy = jest.spyOn(api, "getParcel");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "CN123456789",
                weight: 8,
                pieces: 1,
                originCityId: "abc123",
                cityId: "abc123",
                vendor: { name: "Adeel" },
                city: {
                    cityCode: "abc123456",
                },
            };
        });

        jest.spyOn(utils, "removeDuplicateItemsById").mockImplementation(() => {
            return [{}];
        });

        const CNBagInput = getByLabelText("CN/Bag");

        await fireEvent.change(CNBagInput, {
            target: { value: "CN123456789" },
        });

        expect(CNBagInput).toHaveValue("CN123456789");
        expect(getParcelSpy).toHaveBeenCalled();

        ///2:Submit click
        jest.spyOn(utils, "hasItems").mockImplementation(() => {
            return true;
        });

        let createManifestSpy = jest.spyOn(api, "createManifest");
        createManifestSpy.mockImplementation(async () => {
            return {
                manifestId: "",
            };
        });

        let printManifestSpy = jest.spyOn(api, "printManifest");
        printManifestSpy.mockImplementation(async () => {
            return Promise.resolve({ url: "test" });
        });

        const manifestIdInput = getByLabelText("Manifest ID");

        const submitButton = getByText("Submit");
        await fireEvent.click(submitButton);

        expect(createManifestSpy).toHaveBeenCalled();
        expect(printManifestSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith(
            "Manifest created successfully...",
            {
                classes: ["success"],
            }
        );

        ///3:Refresh Click

        const button = getByText("Clear");
        await fireEvent.click(button);

        expect(manifestIdInput).toHaveValue("");
        //TODO: test case if data grid is empty
        isDestinationCityMatchSpy.mockRestore();
        getParcelSpy.mockRestore();
        createManifestSpy.mockRestore();
        printManifestSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
        journeyTypeForwardSpy.mockRestore();
        journeyTypeReturnSpy.mockRestore();
        isParcelAtSwyftWarehouseSpy.mockRestore();
    });

    test("Exit Button click", async () => {
        const { getByText, getByLabelText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });

        let journeyTypeForwardSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let journeyTypeReturnSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(false);

        let isDestinationCityMatchSpy = jest
            .spyOn(utils, "isEqual")
            .mockReturnValue(true);

        let isParcelAtSwyftWarehouseSpy = await jest
            .spyOn(utils, "isEqual")
            .mockReturnValueOnce(true);
        //1:parcel scan

        const checkDuplicateScanEntrySpy = jest
            .spyOn(utils, "checkDuplicateScanEntry")
            .mockImplementation(() => {
                return false;
            });

        let getParcelSpy = jest.spyOn(api, "getParcel");
        getParcelSpy.mockImplementation(async () => {
            return {
                id: "CN123456789",
                weight: 8,
                pieces: 1,
                originCityId: "abc123",
                cityId: "abc123",
                vendor: { name: "Adeel" },
                city: {
                    cityCode: "abc123456",
                },
            };
        });

        jest.spyOn(utils, "removeDuplicateItemsById").mockImplementation(() => {
            return [{}];
        });

        const CNBagInput = getByLabelText("CN/Bag");

        await fireEvent.change(CNBagInput, {
            target: { value: "CN123456789" },
        });

        expect(CNBagInput).toHaveValue("CN123456789");
        expect(getParcelSpy).toHaveBeenCalled();

        ///2:Submit click

        const journey = getByLabelText("Journey");
        const destinationCity = getByLabelText("Destination City");
        const productType = getByLabelText("Product Type");
        const serviceType = getByLabelText("Service");

        await fireEvent.input(journey, { target: { value: "Forward" } });
        await fireEvent.input(destinationCity, {
            target: { value: ["Lahore"] },
        });
        await fireEvent.input(productType, { target: { value: "Corporate" } });
        await fireEvent.input(serviceType, { target: { value: "Express" } });

        jest.spyOn(utils, "hasItems").mockImplementation(() => {
            return true;
        });

        let createManifestSpy = jest.spyOn(api, "createManifest");
        createManifestSpy.mockImplementation(async () => {
            return {
                manifestId: "",
            };
        });

        let printManifestSpy = jest.spyOn(api, "printManifest");
        printManifestSpy.mockImplementation(async () => {
            return Promise.resolve({ url: "test" });
        });

        const manifestIdInput = getByLabelText("Manifest ID");

        const submitButton = getByText("Submit");
        await fireEvent.click(submitButton);

        expect(journey).toHaveValue("Forward");
        expect(destinationCity).toHaveValue("Lahore");
        expect(productType).toHaveValue("Corporate");
        expect(serviceType).toHaveValue("Express");

        expect(createManifestSpy).toHaveBeenCalled();
        expect(printManifestSpy).toHaveBeenCalled();
        expect(toast.push).toHaveBeenCalledWith(
            "Manifest created successfully...",
            {
                classes: ["success"],
            }
        );

        ///3:Exit Click

        const button = getByText("Exit");
        await fireEvent.click(button);

        expect(journey).toHaveValue("");
        expect(destinationCity).toHaveValue("");
        expect(productType).toHaveValue("");
        expect(serviceType).toHaveValue("");
        expect(manifestIdInput).toHaveValue("");

        //TODO: test case if data grid is empty
        getParcelSpy.mockRestore();
        isDestinationCityMatchSpy.mockRestore();
        createManifestSpy.mockRestore();
        printManifestSpy.mockRestore();
        checkDuplicateScanEntrySpy.mockRestore();
        journeyTypeForwardSpy.mockRestore();
        journeyTypeReturnSpy.mockRestore();
        isParcelAtSwyftWarehouseSpy.mockRestore();
    });

    afterAll(() => {});
});
