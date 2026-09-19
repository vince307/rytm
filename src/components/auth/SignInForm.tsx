import React, { useState } from "react";
import { FormField } from "@/components/auth/FormField";
import { PasswordToggle } from "@/components/auth/PasswordToggle";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ServerError } from "@/components/auth/ServerError";

export interface SignInLabels {
  email: string;
  password: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  submit: string;
  pending: string;
  emailRequired: string;
  passwordRequired: string;
}

interface Props {
  labels: SignInLabels;
  serverError?: string | null;
}

export default function SignInForm({ labels, serverError }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = labels.emailRequired;
    if (!password) next.password = labels.passwordRequired;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    if (!validate()) e.preventDefault();
  }

  return (
    <form method="POST" action="/api/auth/signin" onSubmit={handleSubmit} noValidate>
      <ServerError message={serverError} />
      <FormField
        id="email"
        type="email"
        autoComplete="email"
        label={labels.email}
        value={email}
        onChange={(v) => {
          setEmail(v);
          setErrors((p) => ({ ...p, email: undefined }));
        }}
        placeholder={labels.emailPlaceholder}
        error={errors.email}
      />
      <FormField
        id="password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        label={labels.password}
        value={password}
        onChange={(v) => {
          setPassword(v);
          setErrors((p) => ({ ...p, password: undefined }));
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
      <div className="mt-2 mb-[22px]">
        <SubmitButton pendingText={labels.pending}>{labels.submit}</SubmitButton>
      </div>
    </form>
  );
}
