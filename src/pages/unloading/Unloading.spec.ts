// NOTE: jest-dom adds handy assertions to Jest and it is recommended, but not required.
import "@testing-library/jest-dom";
import { render } from "@testing-library/svelte";
import Unloading from "./Unloading.svelte";
import * as api from "./api";
import * as settings from "./columnsSetting.json";
import * as utils from "../../common/utils/utils";
import { fireEvent } from "@testing-library/dom";
import { toast } from "@zerodevx/svelte-toast";
import exp from "constants";

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
                        code: "",
                    },
                },
                user: {
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
    });

    test("shows proper label when rendered", () => {
        const { getByText } = render(Unloading, {
            progress: { start: () => {}, finish: () => {} },
        });
        expect(getByText("Unloading")).toBeInTheDocument();
    });

    test("fetch loading data", async () => {
        const { getByLabelText } = render(Unloading, {
            progress: { start: () => {}, finish: () => {} },
        });

        let isEqualSpy = jest.spyOn(utils, "isEqual");
        isEqualSpy
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let getVehicleSpy = jest.spyOn(api, "getLoading");
        getVehicleSpy.mockImplementation(async () => {
            return {
                loadingId: "VHI1251241243",
                route: ["001", "002"],
                manifestIds: ["MAN5145213412", "MAN354124121"],
                driverName: "John Doe",
                weight: 2,
                destinationCity: "",
                destinationWarehouse: "",
            };
        });

        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                manifestId: "MAN135412341",
                pieces: 4,
                weight: 2,
            };
        });

        const input = getByLabelText("Vehicle Seal #");
        await fireEvent.change(input, { target: { value: "VHI1251241243" } });

        expect(input).toHaveValue("VHI1251241243");
        expect(getVehicleSpy).toHaveBeenCalled();
        expect(isEqualSpy).toHaveBeenCalled();
        expect(getManifestSpy).toHaveBeenCalled();

        isEqualSpy.mockRestore();
        getVehicleSpy.mockRestore();
        getManifestSpy.mockRestore();
    });

    test("Vehicle not loaded yet", async () => {
        const { getByLabelText } = render(Unloading, {
            progress: { start: () => {}, finish: () => {} },
        });

        let isEqualSpy = jest.spyOn(utils, "isEqual");
        isEqualSpy
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false);

        let getVehicleSpy = jest.spyOn(api, "getLoading");
        getVehicleSpy.mockImplementation(async () => {
            return {
                loadingId: "VHI1251241243",
                route: ["001", "002"],
                manifestIds: ["MAN5145213412", "MAN354124121"],
                driverName: "John Doe",
                weight: 2,
            };
        });

        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                manifestId: "MAN135412341",
                pieces: 4,
                weight: 2,
            };
        });

        const input = getByLabelText("Vehicle Seal #");
        await fireEvent.change(input, { target: { value: "VHI125124124" } });

        expect(input).toHaveValue("VHI125124124");
        expect(isEqualSpy).toHaveBeenCalled();
        expect(getVehicleSpy).toHaveBeenCalled();

        expect(toast.push).toHaveBeenCalledWith("Vehicle hasn't Loaded yet", {
            classes: ["error"],
        });

        isEqualSpy.mockRestore();
        getVehicleSpy.mockRestore();
        getManifestSpy.mockRestore();
    });

    test("Vehicle hasn't arrived at location", async () => {
        const { getByLabelText } = render(Unloading, {
            progress: { start: () => {}, finish: () => {} },
        });

        let isEqualSpy = jest.spyOn(utils, "isEqual");
        isEqualSpy
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);

        let getVehicleSpy = jest.spyOn(api, "getLoading");
        getVehicleSpy.mockImplementation(async () => {
            return {
                loadingId: "VHI1251241243",
                route: ["001", "002"],
                manifestIds: ["MAN5145213412", "MAN354124121"],
                driverName: "John Doe",
                weight: 2,
            };
        });

        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                manifestId: "MAN135412341",
                pieces: 4,
                weight: 2,
            };
        });

        const input = getByLabelText("Vehicle Seal #");
        await fireEvent.change(input, { target: { value: "VHI125124124" } });

        expect(input).toHaveValue("VHI125124124");
        expect(isEqualSpy).toHaveBeenCalled();
        expect(getVehicleSpy).toHaveBeenCalled();

        expect(toast.push).toHaveBeenCalledWith(
            "Vehicle hasn't arrived at the destination city/warehouse",
            {
                classes: ["error"],
            }
        );

        isEqualSpy.mockRestore();
        getVehicleSpy.mockRestore();
        getManifestSpy.mockRestore();
    });

    test("fetch loading data but throws error", async () => {
        const { getByLabelText } = render(Unloading, {
            progress: { start: () => {}, finish: () => {} },
        });

        const input = getByLabelText("Vehicle Seal #");
        await fireEvent.change(input, { target: { value: "V12345678" } });

        expect(input).toHaveValue("V12345678");
    });

    test("exit after fetching data", async () => {
        const { getByLabelText, getByText } = render(Unloading, {
            progress: { start: () => {}, finish: () => {} },
        });

        let isEqualSpy = jest.spyOn(utils, "isEqual");
        isEqualSpy
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(true);

        let getVehicleSpy = jest.spyOn(api, "getLoading");
        getVehicleSpy.mockImplementation(async () => {
            return {
                loadingId: "VHI1251241243",
                route: ["001", "002"],
                manifestIds: ["MAN5145213412", "MAN354124121"],
                driverName: "John Doe",
                weight: 2,
                destinationCity: "",
                destinationWarehouse: "",
            };
        });

        let getManifestSpy = jest.spyOn(api, "getManifest");
        getManifestSpy.mockImplementation(async () => {
            return {
                manifestId: "MAN135412341",
                pieces: 4,
                weight: 2,
            };
        });

        const input = getByLabelText("Vehicle Seal #");
        await fireEvent.change(input, { target: { value: "VHI1251241243" } });

        expect(input).toHaveValue("VHI1251241243");
        expect(getVehicleSpy).toHaveBeenCalled();
        expect(isEqualSpy).toHaveBeenCalled();
        expect(getManifestSpy).toHaveBeenCalled();

        const button = getByText("Exit");
        await fireEvent.click(button);

        getVehicleSpy.mockRestore();
        isEqualSpy.mockRestore();
        getManifestSpy.mockRestore();
    });
});
