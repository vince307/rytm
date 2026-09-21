export const MIN_PASSWORD_LENGTH = 6;

/** Supabase re-sends a confirmation e-mail at most once per this many seconds. */
export const RESEND_COOLDOWN_SECONDS = 60;

/** Set by signup so /confirm-email can re-send the confirmation without putting the address in the URL. */
export const PENDING_EMAIL_COOKIE = "rytm-pending-email";
export const PENDING_EMAIL_MAX_AGE = 15 * 60;

/** Where /auth/callback may send the user after exchanging the PKCE code (no open redirect). */
export const CALLBACK_TARGETS = ["/home", "/reset/new"] as const;
export type CallbackTarget = (typeof CALLBACK_TARGETS)[number];

export function isCallbackTarget(value: string | null): value is CallbackTarget {
  return CALLBACK_TARGETS.includes(value as CallbackTarget);
}
