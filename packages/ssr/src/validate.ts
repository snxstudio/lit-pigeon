import type { ValidationError } from '@lit-pigeon/core';
import { validateDocument } from '@lit-pigeon/core';

export interface ValidateResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate an untrusted document and return both the verdict and the list
 * of errors in one call. `validateDocument` from core already tolerates
 * non-object input — this wrapper just packages the result for REST callers.
 */
export function validateDocumentSafe(doc: unknown): ValidateResult {
  const errors = validateDocument(doc);
  return { valid: errors.length === 0, errors };
}
