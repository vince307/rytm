import React, { useState } from "react";
import { FormField } from "@/components/auth/FormField";
import { PasswordToggle } from "@/components/auth/PasswordToggle";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Button } from "@/components/ui/button";
import { ServerError } from "@/components/auth/ServerError";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-rules";

export interface NewPasswordLabels {
  password: string;
  confirm: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  submit: string;
  pending: string;
  passwordTooShort: string;
  passwordsDiffer: string;
  currentRequired?: string;
}

interface Props {
  labels: NewPasswordLabels;
  serverError?: string | null;
  /** Recovery session by default; `/settings` posts the signed-in change instead. */
  action?: string;
  /** When set, the form asks for the current password first (the in-app change verifies it server-side). */
  current?: { label: string };
  /** Settings toggle: a ghost button next to submit (kit `.form-actions`); `/reset/new` passes none. */
  cancel?: { label: string; onCancel: () => void };
}

export default function NewPasswordForm({
  labels,
  serverError,
  action = "/api/auth/reset/new",
  current,
  cancel,
}: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; password?: string; confirm?: string }>({});

  function validate() {
    const next: typeof errors = {};
    if (current && currentPassword.length === 0) next.current = labels.currentRequired;
    else if (password.length < MIN_PASSWORD_LENGTH) next.password = labels.passwordTooShort;
    else if (confirm !== password) next.confirm = labels.passwordsDiffer;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    if (!validate()) e.preventDefault();
  }

  return (
    <form method="POST" action={action} onSubmit={handleSubmit} noValidate>
      <ServerError message={serverError} />
      {current && (
        <FormField
          id="current"
          type="password"
          autoComplete="current-password"
          label={current.label}
          value={currentPassword}
          onChange={(v) => {
            setCurrentPassword(v);
            setErrors({});
          }}
          placeholder={labels.passwordPlaceholder}
          error={errors.current}
        />
      )}
      <FormField
        id="password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        label={labels.password}
        value={password}
        onChange={(v) => {
          setPassword(v);
          setErrors({});
        }}
        placeholder={labels.passwordPlaceholder}
        error={errors.password}
        endContent={
          <PasswordToggle
            visible={showPassword}
            onToggle={() => {
              setShowPassword(!showPassword);
            }}
            showLabel={labels.showPassword}
            hideLabel={labels.hidePassword}
          />
        }
      />
      <FormField
        id="confirm"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        label={labels.confirm}
        value={confirm}
        onChange={(v) => {
          setConfirm(v);
          setErrors({});
        }}
        placeholder={labels.passwordPlaceholder}
        error={errors.confirm}
      />
      {cancel ? (
        <div className="mt-3 flex flex-wrap gap-[10px]">
          <SubmitButton pendingText={labels.pending} size="default">
            {labels.submit}
          </SubmitButton>
          <Button type="button" variant="ghost" onClick={cancel.onCancel}>
            {cancel.label}
          </Button>
        </div>
      ) : (
        <div className="mt-2">
          <SubmitButton pendingText={labels.pending}>{labels.submit}</SubmitButton>
        </div>
      )}
    </form>
  );
}
