import { basePathService } from "./basePath";

export const TEST_CURRENT_USER = {
  user_id: "10200",
  firstName: "Pumin",
  lastName: "Intarasri",
  email: "pumin@teckbeehang.com",
  role: "I.T. Specialist",
  location: "HQ"
};

export class CurrentUserService {
  private cachedCurrentUserId: Promise<string> | null = null;

  normalizeUserId(value: unknown) {
    if (typeof value !== "string" && typeof value !== "number") return "";
    return String(value).trim();
  }

  isSameUserId(a: unknown, b: unknown) {
    const left = this.normalizeUserId(a);
    const right = this.normalizeUserId(b);
    return Boolean(left && right && left === right);
  }

  // Identity comes solely from the verified hrkpis session (see /api/session) — never
  // from URL params or localStorage, which a caller could edit to impersonate anyone.
  async getClientCurrentUserId(): Promise<string> {
    if (typeof window === "undefined") return TEST_CURRENT_USER.user_id;

    if (!this.cachedCurrentUserId) {
      this.cachedCurrentUserId = fetch(basePathService.withBasePath("/api/session"))
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          const empId = data?.authenticated ? this.normalizeUserId(data.empId) : "";
          return empId || TEST_CURRENT_USER.user_id;
        })
        .catch(() => TEST_CURRENT_USER.user_id);
    }

    return this.cachedCurrentUserId;
  }

  buildCurrentUserHref(pathname: string) {
    if (!pathname) return pathname;

    const [path, search = ""] = pathname.split("?");
    const params = new URLSearchParams(search);
    params.delete("currentUserId");

    const suffix = params.toString() ? `?${params.toString()}` : "";
    return `${basePathService.withBasePath(path)}${suffix}`;
  }
}

export const currentUserService = new CurrentUserService();
