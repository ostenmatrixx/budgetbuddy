import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { toDateInputValue } from "../lib/date";
import TransactionFormModal from "./TransactionFormModal";

async function completeRequiredFields() {
  const user = userEvent.setup();

  await user.selectOptions(screen.getByLabelText("Type"), "bills");
  await user.type(screen.getByLabelText(/Transaction amount/i), "125.50");
  await user.type(screen.getByLabelText("Description"), "Groceries");

  return user;
}

describe("TransactionFormModal", () => {
  it("uses the configured timezone for the default date", () => {
    render(
      <TransactionFormModal
        subcategoriesByType={{}}
        timeZone="Asia/Manila"
        onClose={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByLabelText("Date")).toHaveValue(toDateInputValue(new Date(), "Asia/Manila"));
  });

  it("guards against duplicate submissions while a save is pending", async () => {
    let resolveSave: (() => void) | undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
    );
    const user = await completeRequiredFieldsAfterRender(onSubmit);
    const saveButton = screen.getByRole("button", { name: "Save entry" });

    await user.dblClick(saveButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();

    resolveSave?.();
    expect(await screen.findByRole("button", { name: "Save entry" })).toBeEnabled();
  });

  it("surfaces save failures inside the modal", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Network unavailable."));
    const user = await completeRequiredFieldsAfterRender(onSubmit);

    await user.click(screen.getByRole("button", { name: "Save entry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Network unavailable.");
  });
});

async function completeRequiredFieldsAfterRender(onSubmit: () => Promise<void>) {
  render(<TransactionFormModal subcategoriesByType={{}} onClose={vi.fn()} onSubmit={onSubmit} />);

  return completeRequiredFields();
}
