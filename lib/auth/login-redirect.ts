type Role = 'INVESTOR' | 'BROKER' | 'ADMIN';

/** Only accept local destinations, preserving the authenticated account's role. */
export function resolveLoginRedirect(next: string | null | undefined, role: Role): string {
  const home = `/${role.toLowerCase()}`;
  if (!next || !next.startsWith('/') || next.startsWith('//')) return home;
  // Decode once to reject encoded separators and control characters as well.
  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return home;
  }
  if (/[\\\u0000-\u0020\u007f]/.test(decoded) || decoded.startsWith('//')) return home;
  const url = new URL(decoded, 'https://estate.invalid');
  if (url.origin !== 'https://estate.invalid') return home;
  const section = url.pathname.split('/')[1].toLowerCase();
  if (['login', 'signup', 'forgot-password', 'reset-password'].includes(section)) return home;
  if (['investor', 'broker', 'admin'].includes(section) && section !== role.toLowerCase()) return home;
  // Return the normalized path, so dot segments cannot bypass the role check.
  return `${url.pathname}${url.search}${url.hash}`;
}
