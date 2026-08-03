// Next.js only auto-prefixes basePath for <Link> and the router — raw <a href>,
// window.location, and fetch() calls to absolute paths need it added manually.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath(path: string) {
  if (!BASE_PATH || !path.startsWith("/")) return path;
  return `${BASE_PATH}${path}`;
}
