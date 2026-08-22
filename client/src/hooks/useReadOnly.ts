"use client";

import { useEffect, useState } from "react";

// Whether the site is in read-only (maintenance) mode, plus the banner message.
// Polls /api/read-only once on mount. The real write enforcement is server-side
// in middleware (423); this only drives the banner. Defaults to not-read-only
// so a failed/slow fetch never falsely blocks the UI.
export const useReadOnly = (): { readOnly: boolean; message: string } => {
  const [state, setState] = useState<{ readOnly: boolean; message: string }>({
    readOnly: false,
    message: "",
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/read-only", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setState({
            readOnly: Boolean(data?.readOnly),
            message: typeof data?.message === "string" ? data.message : "",
          });
        }
      })
      .catch(() => {
        /* network error — leave as not-read-only */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
