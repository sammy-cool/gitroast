// Mirrors shared/constants.js defaultWrappedYear (kept in sync by a test).
export function defaultWrappedYear(now = new Date()) {
  const y = now.getUTCFullYear();
  return now.getUTCMonth() >= 9 ? y : y - 1;
}
