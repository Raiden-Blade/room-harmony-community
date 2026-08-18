const SESSION_KEY = "rhc-demo-session";

export function getSessionId(): string {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const suffix = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  const sessionId = `demo-${suffix}`.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  window.localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}
