import React, { useState } from "react";
import { FormField } from "@/components/auth/FormField";
import { PasswordToggle } from "@/components/auth/PasswordToggle";
import { SubmitButton } from "@/components/auth/SubmitButton";
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
}

interface Props {
  labels: NewPasswordLabels;
  serverError?: string | null;
}

export default function NewPasswordForm({ labels, serverError }: Props) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  function validate() {
    const next: typeof errors = {};
    if (password.length < MIN_PASSWORD_LENGTH) next.password = labels.passwordTooShort;
    else if (confirm !== password) next.confirm = labels.passwordsDiffer;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    if (!validate()) e.preventDefault();
  }

  return (
    <form method="POST" action="/api/auth/reset/new" onSubmit={handleSubmit} noValidate>
      <ServerError message={serverError} />
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
      <div className="mt-2">
        <SubmitButton pendingText={labels.pending}>{labels.submit}</SubmitButton>
      </div>
    </form>
  );
}
