import React, { useState } from "react";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";

export interface ResetLabels {
  email: string;
  emailPlaceholder: string;
  submit: string;
  pending: string;
  emailRequired: string;
}

export default function ResetForm({ labels }: { labels: ResetLabels }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(labels.emailRequired);
      e.preventDefault();
    }
  }

  return (
    <form method="POST" action="/api/auth/reset" onSubmit={handleSubmit} noValidate>
      <FormField
        id="email"
        type="email"
        autoComplete="email"
        label={labels.email}
        value={email}
        onChange={(v) => {
          setEmail(v);
          setError(undefined);
        }}
        placeholder={labels.emailPlaceholder}
        error={error}
      />
      <div className="mt-2">
        <SubmitButton pendingText={labels.pending}>{labels.submit}</SubmitButton>
      </div>
    </form>
  );
}
