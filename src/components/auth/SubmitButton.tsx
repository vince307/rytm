import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  pendingText: string;
  children: ReactNode;
}

export function SubmitButton({ pendingText, children }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="full" disabled={pending}>
      {pending ? pendingText : children}
      {!pending && <span aria-hidden="true">↗</span>}
    </Button>
  );
}
