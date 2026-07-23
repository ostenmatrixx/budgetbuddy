import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import AccessibleDialog from "./AccessibleDialog";
import ConfirmDialog from "./ConfirmDialog";

const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value() {
      this.setAttribute("open", "");
    }
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value() {
      this.removeAttribute("open");
    }
  });
});

afterAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: originalShowModal
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: originalClose
  });
});

function DialogHarness({ closeBlocked = false }: { closeBlocked?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open editor
      </button>
      <AccessibleDialog
        descriptionId="editor-description"
        isCloseBlocked={closeBlocked}
        labelId="editor-title"
        open={isOpen}
        onRequestClose={() => setIsOpen(false)}
      >
        <h2 id="editor-title">Editor</h2>
        <p id="editor-description">Edit this value.</p>
        <button autoFocus type="button">
          First action
        </button>
      </AccessibleDialog>
    </>
  );
}

describe("AccessibleDialog", () => {
  it("labels the dialog, focuses its first action, closes on Escape, and restores focus", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const trigger = screen.getByRole("button", { name: "Open editor" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Editor" });
    expect(dialog).toHaveAccessibleDescription("Edit this value.");
    await waitFor(() => expect(screen.getByRole("button", { name: "First action" })).toHaveFocus());

    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));

    await waitFor(() => expect(dialog).not.toHaveAttribute("open"));
    expect(trigger).toHaveFocus();
  });

  it("prevents dismissal while an operation is in progress", async () => {
    const user = userEvent.setup();
    render(<DialogHarness closeBlocked />);

    await user.click(screen.getByRole("button", { name: "Open editor" }));
    const dialog = screen.getByRole("dialog", { name: "Editor" });
    fireEvent(dialog, new Event("cancel", { bubbles: false, cancelable: true }));

    expect(dialog).toHaveAttribute("open");
  });
});

describe("ConfirmDialog", () => {
  it("guards repeat confirmation while the callback is pending", async () => {
    let finishConfirmation: (() => void) | undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishConfirmation = resolve;
        })
    );
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        confirmLabel="Delete"
        description="This cannot be undone."
        isOpen
        title="Delete entry?"
        variant="danger"
        onCancel={() => undefined}
        onConfirm={onConfirm}
      />
    );

    const confirmButton = screen.getByRole("button", { name: "Delete" });
    await user.dblClick(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Working…" })).toBeDisabled();

    finishConfirmation?.();
    await waitFor(() => expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled());
  });
});
