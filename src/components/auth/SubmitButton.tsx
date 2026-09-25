import type { ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";
import { useFormStatus } from "react-dom";
import { Button, buttonVariants } from "@/components/ui/button";

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

interface SubmitButtonProps {
  pendingText: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** The ↗ affordance belongs to forward-moving actions; destructive confirmations drop it. */
  showArrow?: boolean;
  /** Extra gate on top of the form status — e.g. a confirmation word that is not typed yet. */
  disabled?: boolean;
  /** Pending state tracked by the caller — useFormStatus() stays false for a native POST to a URL action. */
  pending?: boolean;
}

export function SubmitButton({
  pendingText,
  children,
  variant = "primary",
  size = "full",
  showArrow = true,
  disabled = false,
  pending: pendingProp = false,
}: SubmitButtonProps) {
  const pending = useFormStatus().pending || pendingProp;
  return (
    <Button type="submit" variant={variant} size={size} disabled={disabled || pending}>
      {pending ? pendingText : children}
      {!pending && showArrow && <span aria-hidden="true">↗</span>}
    </Button>
  );
}
