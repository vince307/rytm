import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RESEND_COOLDOWN_SECONDS } from "@/lib/auth-rules";

interface Props {
  label: string;
  /** Kit template with a `{seconds}` placeholder (`confirmEmail.resendCountdown`). */
  countdown: string;
  /** True right after a successful re-send: start the countdown immediately (kit: "Wyślij ponownie za 60 s"). */
  justSent: boolean;
}

// Mirrors Supabase's one-mail-per-minute limit so the user does not hit the server error.
export default function ResendButton({ label, countdown, justSent }: Props) {
  const [left, setLeft] = useState(justSent ? RESEND_COOLDOWN_SECONDS : 0);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => {
      setLeft(left - 1);
    }, 1000);
    return () => {
      clearTimeout(t);
    };
  }, [left]);

  return (
    <form method="POST" action="/api/auth/resend">
      <Button type="submit" variant="ghost" size="full" disabled={left > 0}>
        {left > 0 ? countdown.replace("{seconds}", String(left)) : label}
      </Button>
    </form>
  );
}
