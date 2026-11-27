"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

// /volunteers/[id]/account is the legacy URL. It now opens the My profile
// pop-up (#814) over the checklist page. Client-side because a server
// redirect drops the #profile hash.
const AccountPage = () => {
  const shiftboardId = useParams<{ shiftboardId: string }>()?.shiftboardId;
  useEffect(() => {
    window.location.replace(`/volunteers/${shiftboardId}/info#profile`);
  }, [shiftboardId]);
  return null;
};

export default AccountPage;
