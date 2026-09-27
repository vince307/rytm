import { z } from "zod";

// Deletion of one own import (S-02, FR-004/FR-005). The database does the real work — `imports: authenticated
// delete own` RLS + `transactions_import_account_fkey … on delete cascade` — but an RLS-filtered delete of a
// foreign or missing id returns 0 rows and no error. The endpoint must ask for the deleted row back
// (`.select("id")` on the delete) so this helper can tell "deleted" from "not found" from the result shape alone.

export const deleteImportSchema = z.object({ id: z.uuid() });

export const DELETE_IMPORT_DELETED = "/imports?deleted=1";
export const DELETE_IMPORT_MISSING = "/imports?error=missing";
export const DELETE_IMPORT_ERROR = "/imports?error=delete";

interface DeleteResult {
  data: { id: string }[] | null;
  error: { code?: string; message: string } | null;
}

/** A DB error redirects to `delete`; no returned row (RLS-filtered or truly missing) redirects to `missing`. */
export function deleteImportRedirect(result: DeleteResult): string {
  if (result.error) {
    return DELETE_IMPORT_ERROR;
  }
  if (!result.data || result.data.length === 0) {
    return DELETE_IMPORT_MISSING;
  }
  return DELETE_IMPORT_DELETED;
}
