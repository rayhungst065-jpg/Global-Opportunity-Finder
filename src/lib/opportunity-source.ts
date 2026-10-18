export function safeOfficialUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || u.username || u.password || !u.hostname.includes(".") || u.hostname === "localhost" || /^\d+\./.test(u.hostname)) return null;
    return u.href;
  } catch { return null; }
}
export function isNormalRecommendation(o: { is_demo: boolean; application_status: string; deadline: string | null }, today = new Date().toISOString().slice(0, 10)) {
  return !o.is_demo && o.application_status !== "closed" && (!o.deadline || o.deadline >= today);
}

export function visibleCatalog<T extends { is_demo: boolean }>(rows: T[], showDemo = false) {
  return rows.filter(row => showDemo || !row.is_demo);
}

export function verificationState(verifiedAt: string | null | undefined, deadline: string | null, today = new Date().toISOString().slice(0, 10)) {
  if (deadline && deadline < today) return "Stored deadline has passed — needs verification";
  if (!verifiedAt || !Number.isFinite(Date.parse(verifiedAt))) return "Verification date unknown — confirm official details";
  const age = Date.parse(today) - Date.parse(verifiedAt);
  return age >= 30 * 86400000 ? "Source check is over 30 days old — needs verification" : `Source checked ${verifiedAt.slice(0, 10)} — confirm current details`;
}