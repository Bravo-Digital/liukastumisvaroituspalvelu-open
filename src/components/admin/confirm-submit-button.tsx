"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  /** Optional: if provided, will submit this form element by id */
  formId?: string;
  children: React.ReactNode;
  title?: string;
  description?: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  submitLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  className?: string;
};

export default function ConfirmSubmitButton({
  formId,
  children,
  title = "Are you sure?",
  description,
  variant = "default",
  size = "default",
  submitLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const submitForm = React.useCallback(() => {
    // 1) If id is provided, use it
    let form: HTMLFormElement | null =
      (formId ? (document.getElementById(formId) as HTMLFormElement | null) : null);

    // 2) Otherwise, find the nearest <form> relative to the trigger button
    if (!form && triggerRef.current) {
      form = triggerRef.current.closest("form");
    }

    if (!form) {
      console.warn("ConfirmSubmitButton: No form found to submit.");
      setOpen(false);
      return;
    }

    // Prefer requestSubmit for proper validation & submit events
    if (typeof form.requestSubmit === "function") form.requestSubmit();
    else form.submit();

    setOpen(false);
  }, [formId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          ref={triggerRef}
          variant={variant}
          size={size}
          className={className}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          {children}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={destructive ? "destructive" : "default"} onClick={submitForm}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
