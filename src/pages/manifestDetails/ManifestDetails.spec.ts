import "@testing-library/jest-dom";

import Manifest from "./ManifestDetails.svelte";
import * as api from "./api";
import * as settings from "./panelSetting.json";
import { render } from "@testing-library/svelte";
jest.mock("../../common/utils/utils");
jest.mock("./api");
let openSpy;

jest.mock("@zerodevx/svelte-toast", () => ({
    ...jest.requireActual("@zerodevx/svelte-toast"),
    toast: {
        push: jest.fn(),
    },
}));
describe("Manifest", () => {
    beforeAll(() => {});

    test("shows proper label when rendered", () => {
        const { getByText } = render(Manifest, {
            progress: { start: () => {}, finish: () => {} },
        });
        expect(getByText("Manifest")).toBeInTheDocument();
    });

    afterAll(() => {});
});
