export function deskJobAuthorized(request: Request): boolean {
  const expected = process.env.DESK_JOB_SECRET?.trim();
  if (!expected) return true;
  return request.headers.get("x-desk-job") === expected;
}
