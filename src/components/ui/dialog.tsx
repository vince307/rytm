import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { focusRing } from "@/components/app/field-styles";
import { Glyph } from "@/components/Glyph";
import { cn } from "@/lib/utils";

// shadcn "new-york" dialog, restyled onto the kit tokens (prototype .modal-backdrop / .modal / .modal-close).
// The close icon is `Glyph` (the kit sprite), so the repo keeps one icon component.
// Kit round 3 geometry (S-14 faza 4): .modal-backdrop{padding:16px;background:rgba(32,47,64,.44)} (== bg-ink/44),
// .modal{width:min(480px,100%);border-radius:13px;padding:26px}, ≤560px{padding:22px 18px;border-radius:12px};
// .modal-close is right:19px;top:18px.
export const dialogContentClass =
  "border-line bg-paper data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100vh-32px)] w-[calc(100%-32px)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 gap-0 overflow-auto rounded-[13px] border p-[26px] shadow-[0_25px_80px_rgba(32,47,64,0.25)] duration-200 outline-none max-[559px]:rounded-[12px] max-[559px]:px-[18px] max-[559px]:py-[22px]";

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "bg-ink/44 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  closeLabel,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  closeLabel: string;
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content data-slot="dialog-content" className={cn(dialogContentClass, className)} {...props}>
        {children}
        <DialogPrimitive.Close
          data-slot="dialog-close"
          className={cn(
            "text-muted hover:text-ink absolute top-[18px] right-[19px] rounded-md transition-colors",
            focusRing,
          )}
        >
          <Glyph name="close" size={17} className="block" />
          <span className="sr-only">{closeLabel}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("my-[11px] text-[26px] font-bold tracking-[-0.05em]", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
