import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

// shadcn "new-york" dialog, restyled onto the kit tokens (prototype .modal-backdrop / .modal / .modal-close).
// The close icon comes from the kit sprite, like ServerError, so the repo keeps one icon source.
// Geometry matches the kit exactly (S-05 faza 5, G24): .modal-backdrop{padding:20px;background:rgba(32,47,64,.44)}
// (== bg-ink/44, the ink token's own hex under that alpha) and .modal{width:min(480px,100%);border-radius:13px;
// padding:31px}; .modal-close is right:19px;top:18px. Previously max-w-[440px] p-[22px] rounded-xl with no side
// margin (G24 note, fixed here).

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
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "border-line bg-paper data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-40px)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 gap-0 rounded-[13px] border p-[31px] shadow-[0_25px_80px_rgba(32,47,64,0.25)] duration-200 outline-none",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          data-slot="dialog-close"
          className="text-muted hover:text-ink focus-visible:ring-ink/15 absolute top-[18px] right-[19px] rounded-md transition-colors outline-none focus-visible:ring-[3px]"
        >
          <svg className="rytm-icon block" width={17} height={17} viewBox="0 0 24 24" aria-hidden="true">
            <use href="/rytm/icons/ui/ui.svg#close" />
          </svg>
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
