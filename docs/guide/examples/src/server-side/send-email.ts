import type { Transporter } from 'nodemailer';
import { lintDocument } from '@lit-pigeon/lint';
import { parseMjml, renderDocument, validateDocumentSafe } from '@lit-pigeon/ssr';
import type { PigeonDocument } from '@lit-pigeon/core';

export interface Recipient {
  email: string;
  first_name: string;
}

// #region load
/** Rebuild the document from what you stored; never send stored HTML as-is. */
export function loadForSending(stored: { mjml: string } | { document: unknown }): PigeonDocument {
  const candidate = 'mjml' in stored ? parseMjml(stored.mjml).document : stored.document;
  const check = validateDocumentSafe(candidate);
  if (!check.valid) throw new Error(`Invalid template: ${check.errors.map((e) => e.message).join('; ')}`);
  return candidate as PigeonDocument;
}
// #endregion load

// #region send
export async function sendTemplate(
  transport: Transporter,
  document: PigeonDocument,
  subject: string,
  recipients: Recipient[],
): Promise<void> {
  // Pre-flight checks: refuse to send a template with errors (missing links, broken tags, …).
  const blocking = lintDocument(document).issues.filter(
    (issue) => issue.severity === 'error' && !isHeroAltText(document, issue.rule, issue.blockId),
  );
  if (blocking.length > 0) throw new Error(blocking.map((i) => i.message).join('; '));

  for (const recipient of recipients) {
    // Values are HTML-escaped; unknown {{tags}} are replaced with the fallback.
    const { html, errors } = await renderDocument(document, {
      mergeTags: { ...recipient },
      mergeTagFallback: '',
    });
    if (errors.length > 0) throw new Error(errors.map((e) => e.message).join('; '));
    await transport.sendMail({ from: 'news@example.com', to: recipient.email, subject, html });
  }
}

/** Hero blocks have no alt field, so lint's alt-text/missing error cannot be fixed for them. */
function isHeroAltText(document: PigeonDocument, rule: string, blockId?: string): boolean {
  if (rule !== 'alt-text/missing') return false;
  const blocks = document.body.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks));
  return blocks.some((b) => b.id === blockId && b.type === 'hero');
}
// #endregion send
