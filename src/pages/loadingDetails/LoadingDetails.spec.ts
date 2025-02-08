import "@testing-library/jest-dom";

import Loading from "./LoadingDetails.svelte";
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
describe("Loading", () => {
    beforeAll(() => {});

    test("shows proper label when rendered", () => {
        const { getByText } = render(Loading, {
            progress: { start: () => {}, finish: () => {} },
        });
        expect(getByText("Loading")).toBeInTheDocument();
    });

    afterAll(() => {});
});
