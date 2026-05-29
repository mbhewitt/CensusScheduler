// Decide whether an SMTP/transport error is permanent (mark `dead`,
// stop retrying) or transient (keep retrying with backoff).
//
// Default-to-transient: on-playa, a misclassified transient (e.g. some
// novel TLS hiccup) that we mark permanent costs a real email, while
// a misclassified permanent just retries until 24h-cap forever — visible
// in monitoring but not silently lost.

interface MaybeSmtpError {
  responseCode?: number;
  code?: string;
  message?: string;
}

// SMTP 5xx codes that mean "this message will never deliver":
//   550 mailbox unavailable / user unknown
//   551 user not local
//   553 mailbox name not allowed
//   554 transaction failed (often final reject)
const PERMANENT_RESPONSE_CODES = new Set([550, 551, 553, 554]);

export function classifyError(err: unknown): {
  permanent: boolean;
  reason: string;
} {
  const e = (err ?? {}) as MaybeSmtpError;
  const reason = e.message ?? String(err);

  if (typeof e.responseCode === "number") {
    if (PERMANENT_RESPONSE_CODES.has(e.responseCode)) {
      return { permanent: true, reason };
    }
    // 4xx and anything else: transient.
    return { permanent: false, reason };
  }

  // No SMTP response code — connection-level or unknown. Always transient.
  return { permanent: false, reason };
}
