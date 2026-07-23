import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent
} from "react";

let openDialogCount = 0;

export interface AccessibleDialogProps extends Omit<
  ComponentPropsWithoutRef<"dialog">,
  "aria-describedby" | "aria-labelledby" | "children" | "onCancel" | "onClose" | "open"
> {
  children: ReactNode;
  descriptionId?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  isCloseBlocked?: boolean;
  labelId: string;
  onRequestClose: () => void;
  open: boolean;
}

export default function AccessibleDialog({
  children,
  className = "",
  descriptionId,
  initialFocusRef,
  isCloseBlocked = false,
  labelId,
  onRequestClose,
  open,
  ...dialogProps
}: AccessibleDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      openDialogCount += 1;
      document.documentElement.classList.add("has-open-dialog");

      window.requestAnimationFrame(() => {
        const fallbackFocus = dialog.querySelector<HTMLElement>(
          "[autofocus], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"
        );
        (initialFocusRef?.current ?? fallbackFocus)?.focus();
      });
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }

    return () => {
      if (dialog.open) {
        if (typeof dialog.close === "function") {
          dialog.close();
        } else {
          dialog.removeAttribute("open");
        }
      }
      openDialogCount = Math.max(0, openDialogCount - 1);
      if (openDialogCount === 0) {
        document.documentElement.classList.remove("has-open-dialog");
      }
      returnFocusRef.current?.focus();
    };
  }, [initialFocusRef, open]);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    if (!isCloseBlocked) {
      onRequestClose();
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (!isCloseBlocked && event.target === event.currentTarget) {
      onRequestClose();
    }
  }

  return (
    <dialog
      {...dialogProps}
      aria-describedby={descriptionId}
      aria-labelledby={labelId}
      aria-modal="true"
      className={`accessible-dialog ${className}`}
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      {children}
    </dialog>
  );
}
