import { useEffect, useId, useState } from "react";
import AccessibleDialog from "./AccessibleDialog";

export interface ConfirmDialogProps {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  errorMessage?: string;
  isOpen: boolean;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  variant?: "danger" | "primary";
}

export default function ConfirmDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  description,
  errorMessage,
  isOpen,
  isPending = false,
  onCancel,
  onConfirm,
  title,
  variant = "primary"
}: ConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [internalError, setInternalError] = useState("");
  const pending = isPending || isSubmitting;
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;

  useEffect(() => {
    if (!isOpen) {
      setInternalError("");
    }
  }, [isOpen]);

  async function handleConfirm() {
    if (pending) {
      return;
    }

    setIsSubmitting(true);
    setInternalError("");
    try {
      await onConfirm();
    } catch (confirmationError) {
      setInternalError(
        confirmationError instanceof Error
          ? confirmationError.message
          : "Unable to complete this action."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AccessibleDialog
      className="confirm-dialog"
      descriptionId={descriptionId}
      isCloseBlocked={pending}
      labelId={titleId}
      open={isOpen}
      onRequestClose={onCancel}
    >
      <div className="confirm-dialog-content" aria-busy={pending}>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        {errorMessage || internalError ? (
          <p className="confirm-dialog-error" role="alert">
            {errorMessage || internalError}
          </p>
        ) : null}
        <div className="confirm-dialog-actions">
          <button disabled={pending} type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={variant === "danger" ? "is-danger" : "is-primary"}
            disabled={pending}
            type="button"
            onClick={() => void handleConfirm()}
          >
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </AccessibleDialog>
  );
}
