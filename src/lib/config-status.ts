import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server";

export interface ConfigStatus {
  name: string;
  configured: boolean;
  /** Key of the message / docs label in `copyExtra.config` (the strings live in the dictionary). */
  messageKey: "supabaseMissing";
  docsLabelKey: "supabaseDocs";
  docsUrl?: string;
}

export const configStatuses: ConfigStatus[] = [
  {
    name: "Supabase",
    configured: Boolean(SUPABASE_URL && SUPABASE_KEY),
    messageKey: "supabaseMissing",
    docsLabelKey: "supabaseDocs",
    docsUrl: "https://github.com/przeprogramowani/10x-astro-starter#supabase-configuration",
  },
];

export const missingConfigs = configStatuses.filter((s) => !s.configured);
