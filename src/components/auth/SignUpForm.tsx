import React, { useState } from "react";
import { FormField } from "@/components/auth/FormField";
import { PasswordToggle } from "@/components/auth/PasswordToggle";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ServerError } from "@/components/auth/ServerError";

const MIN_PASSWORD_LENGTH = 6;

export interface SignUpLabels {
  name: string;
  optional: string;
  namePlaceholder: string;
  email: string;
  password: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  showPassword: string;
  hidePassword: string;
  terms: string;
  submit: string;
  pending: string;
  emailRequired: string;
  passwordTooShort: string;
}

interface Props {
  labels: SignUpLabels;
  serverError?: string | null;
}

export default function SignUpForm({ labels, serverError }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = labels.emailRequired;
    if (password.length < MIN_PASSWORD_LENGTH) next.password = labels.passwordTooShort;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    if (!validate()) e.preventDefault();
  }

  return (
    <form method="POST" action="/api/auth/signup" onSubmit={handleSubmit} noValidate>
      <ServerError message={serverError} />
      <FormField
        id="name"
        autoComplete="given-name"
        label={labels.name}
        optionalLabel={labels.optional}
        value={name}
        onChange={setName}
        placeholder={labels.namePlaceholder}
      />
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
        autoComplete="new-password"
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
      <p className="text-muted my-[11px] mb-[22px] text-xs">{labels.terms}</p>
      <SubmitButton pendingText={labels.pending}>{labels.submit}</SubmitButton>
    </form>
  );
}
