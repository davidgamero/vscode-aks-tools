import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchableDropdown } from "./SearchableDropdown";
import { newLoading, newLoaded } from "../utilities/lazy";

const FRUITS = ["Banana", "apple", "Cherry"];

function renderDropdown(overrides: Partial<Parameters<typeof SearchableDropdown<string>>[0]> = {}) {
    const onSelect = vi.fn();
    const utils = render(
        <SearchableDropdown<string>
            id="fruit"
            items={FRUITS}
            selectedValue={null}
            getValue={(s) => s}
            onSelect={onSelect}
            {...overrides}
        />,
    );
    return { onSelect, ...utils };
}

function combobox() {
    return screen.getByRole("combobox");
}

function optionLabels() {
    return screen.getAllByRole("option").map((o) => o.textContent);
}

describe("SearchableDropdown", () => {
    describe("aria wiring", () => {
        it("puts combobox on the input, not a wrapper", () => {
            renderDropdown();
            expect(combobox().tagName).toBe("INPUT");
        });

        it("reflects open state and links to the listbox", async () => {
            const user = userEvent.setup();
            renderDropdown();
            expect(combobox()).toHaveAttribute("aria-expanded", "false");

            await user.click(combobox());

            expect(combobox()).toHaveAttribute("aria-expanded", "true");
            const listboxId = combobox().getAttribute("aria-controls");
            expect(listboxId).toBeTruthy();
            expect(screen.getByRole("listbox")).toHaveAttribute("id", listboxId!);
        });

        it("wires activedescendant to the highlighted option even with no caller id", async () => {
            const user = userEvent.setup();
            renderDropdown({ id: undefined });
            await user.click(combobox());

            const active = combobox().getAttribute("aria-activedescendant");
            expect(active).toBeTruthy();
            expect(document.getElementById(active!)).toHaveAttribute("role", "option");
        });
    });

    describe("keyboard navigation", () => {
        it("opens on ArrowDown and wraps around both ends", async () => {
            const user = userEvent.setup();
            renderDropdown();
            combobox().focus();

            await user.keyboard("{ArrowDown}");
            expect(screen.getByRole("listbox")).toBeInTheDocument();

            // Default order is sortKey ascending, locale-aware: apple, Banana, Cherry.
            expect(optionLabels()).toEqual(["apple", "Banana", "Cherry"]);

            const activeLabel = () =>
                document.getElementById(combobox().getAttribute("aria-activedescendant")!)?.textContent;

            expect(activeLabel()).toBe("apple");
            await user.keyboard("{ArrowUp}");
            expect(activeLabel()).toBe("Cherry"); // wrapped backwards off the top
            await user.keyboard("{ArrowDown}");
            expect(activeLabel()).toBe("apple"); // wrapped forwards off the bottom
        });

        it("supports Home and End", async () => {
            const user = userEvent.setup();
            renderDropdown();
            combobox().focus();
            await user.keyboard("{ArrowDown}");

            const activeLabel = () =>
                document.getElementById(combobox().getAttribute("aria-activedescendant")!)?.textContent;

            await user.keyboard("{End}");
            expect(activeLabel()).toBe("Cherry");
            await user.keyboard("{Home}");
            expect(activeLabel()).toBe("apple");
        });

        it("commits the highlighted option on Enter and closes", async () => {
            const user = userEvent.setup();
            const { onSelect } = renderDropdown();
            combobox().focus();

            await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

            expect(onSelect).toHaveBeenCalledExactlyOnceWith("Banana");
            expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        });

        it("closes on Escape without selecting", async () => {
            const user = userEvent.setup();
            const { onSelect } = renderDropdown();
            combobox().focus();

            await user.keyboard("{ArrowDown}{Escape}");

            expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
            expect(onSelect).not.toHaveBeenCalled();
        });
    });

    describe("filtering", () => {
        it("fuzzy-filters as you type and reports no matches", async () => {
            const user = userEvent.setup();
            renderDropdown();
            await user.click(combobox());

            await user.type(combobox(), "ch");
            expect(optionLabels()).toEqual(["Cherry"]);

            await user.clear(combobox());
            await user.type(combobox(), "zzzz");
            expect(screen.queryAllByRole("option")).toHaveLength(0);
            expect(within(screen.getByRole("listbox")).getByText("No matches")).toBeInTheDocument();
        });

        it("re-highlights the selected item on reopen, not a stale filtered index", async () => {
            const user = userEvent.setup();
            renderDropdown({ selectedValue: "Cherry" });

            // Open, type a filter that excludes the selection, then close via Escape.
            await user.click(combobox());
            await user.type(combobox(), "app");
            await user.keyboard("{Escape}");

            // Reopening resets the search, so the highlight must land on the selected item.
            await user.click(combobox());
            const active = document.getElementById(combobox().getAttribute("aria-activedescendant")!);
            expect(active).toHaveTextContent("Cherry");
        });
    });

    describe("labels and ordering", () => {
        it("uses toLabel for display and search, and sortKey for order", async () => {
            const user = userEvent.setup();
            const onSelect = vi.fn();
            render(
                <SearchableDropdown<{ id: string; name: string; rank: string }>
                    id="repo"
                    items={[
                        { id: "b", name: "beta (private)", rank: "2" },
                        { id: "a", name: "alpha", rank: "1" },
                    ]}
                    selectedValue={null}
                    getValue={(r) => r.id}
                    toLabel={(r) => r.name}
                    sortKey={(r) => r.rank}
                    onSelect={onSelect}
                />,
            );

            await user.click(combobox());
            expect(optionLabels()).toEqual(["alpha", "beta (private)"]);

            await user.click(screen.getByText("beta (private)"));
            expect(onSelect).toHaveBeenCalledExactlyOnceWith("b");
        });

        it("shows the selected label when closed", () => {
            renderDropdown({ selectedValue: "Banana" });
            expect(combobox()).toHaveValue("Banana");
        });
    });

    describe("loading and disabled", () => {
        it("shows a spinner while items load, then renders the dropdown", async () => {
            const user = userEvent.setup();
            const { rerender } = render(
                <SearchableDropdown<string>
                    id="fruit"
                    items={newLoading()}
                    selectedValue={null}
                    getValue={(s) => s}
                    onSelect={vi.fn()}
                />,
            );
            expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

            rerender(
                <SearchableDropdown<string>
                    id="fruit"
                    items={newLoaded(FRUITS)}
                    selectedValue={null}
                    getValue={(s) => s}
                    onSelect={vi.fn()}
                />,
            );

            await user.click(combobox());
            expect(optionLabels()).toEqual(["apple", "Banana", "Cherry"]);
        });

        it("does not open when disabled", async () => {
            const user = userEvent.setup();
            renderDropdown({ disabled: true });

            await user.click(combobox());

            expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        });
    });
});
