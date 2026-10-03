export const MIN_PASSWORD_LENGTH = 6;

import type { Locale } from "@/lib/i18n";

/** Word the user must type to delete their account, per locale; the client gates the button, the server validates it. */
export const DELETE_CONFIRM_WORDS: Record<Locale, string> = { pl: "USUŃ", en: "DELETE" };

/** Either locale's word proves intent (`Ń` is untypeable on most non-Polish keyboards); exact, case-sensitive match. */
export function isDeleteConfirmWord(value: string): boolean {
  return Object.values(DELETE_CONFIRM_WORDS).includes(value);
}

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
