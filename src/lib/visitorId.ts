export function isValidVisitorId(visitorId: string): boolean {
  return /^[A-Za-z0-9_-]{8,191}$/.test(visitorId);
}
