// PEERS: map a shift's type/name or position name to its SQUAD / LEAD badge
// image (served from /public/general). The shift name and position name both
// carry the distinguishing word — "PEERS Squaddie Shift" / "PEERS Squaddie
// (in the field)" and "PEERS Lead Shift (HQ)" / "PEERS Shift Lead (at HQ)".
// Coordinator shifts get no badge.
export const shiftBadge = (
  typeOrPosition: string | undefined | null
): { alt: string; src: string } | null => {
  const value = typeOrPosition ?? "";
  if (/squaddie/i.test(value)) {
    return { alt: "Squad", src: "/general/badge-squad.png" };
  }
  if (/lead/i.test(value)) {
    return { alt: "Lead", src: "/general/badge-lead.png" };
  }
  return null;
};
