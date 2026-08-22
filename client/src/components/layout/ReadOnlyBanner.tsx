"use client";

import { Alert } from "@mui/material";

import { useReadOnly } from "@/hooks/useReadOnly";

// Site-wide banner shown when the deployment is in read-only mode (e.g. the
// cloud site during the on-playa cutover). The message is configured via
// CENSUS_READ_ONLY_MESSAGE. Enforcement is server-side (middleware 423); this is
// the heads-up so users understand why writes are refused. See ONPLAYA_CUTOVER.md.
export const ReadOnlyBanner = () => {
  const { readOnly, message } = useReadOnly();
  if (!readOnly) return null;
  return (
    <Alert severity="warning" sx={{ borderRadius: 0, justifyContent: "center" }}>
      {message}
    </Alert>
  );
};
