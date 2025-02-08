// NOTE: jest-dom adds handy assertions to Jest and it is recommended, but not required.
import "@testing-library/jest-dom";
import { render, fireEvent } from "@testing-library/svelte";
import Counter from "./Counter.svelte";

describe("Counter", () => {
    test("shows proper label when rendered", () => {
        const { getByText } = render(Counter, {
            progress: { start: () => {}, finish: () => {} },
        });

        expect(getByText("Count is 0")).toBeInTheDocument();
    });

    test("count increments when button is clicked", async () => {
        const { getByText } = render(Counter, {
            progress: { start: () => {}, finish: () => {} },
        });
        const button = getByText("Count is 0");

        // Option 1.
        await fireEvent.click(button);
        expect(button).toHaveTextContent("Count is 1");

        // Option 2.
        await fireEvent(
            button,
            new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
            })
        );
        expect(button).toHaveTextContent("Count is 2");
    });
});
