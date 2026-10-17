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