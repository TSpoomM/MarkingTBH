"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/src/components/ui/Navbar";
import { sessionApiService, SessionApiService } from "@/src/core/services/client/session-api.service";
import { basePathService } from "@/src/core/services/client/basePath.service";
import ActivityThrottle from "@/src/core/session/activityThrottle";
import type { NavbarProps } from "@/src/core/models/ui";

/** How often user activity is reported to the server. Must stay well under the 30-minute idle timeout. */
const ACTIVITY_PING_MS = 2 * 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

const pageNavbarConfig: Record<string, NavbarProps> = {
  "/": {
    badge: "TBH",
    title: "MarkingTBH",
    subtitle: "สร้าง sticker สำหรับส่งออกสินค้า",
    activeNav: "marking",
  },
  "/history": {
    badge: "TBH",
    title: "ประวัติ",
    subtitle: "ตรวจสอบรายการที่บันทึกและพิมพ์/PDF",
    activeNav: "history",
  },
  "/manageTemplate": {
    badge: "ADM",
    title: "จัดการ Template",
    subtitle: "เพิ่ม หรือ แก้ไข Template ",
    activeNav: "templates",
  },
  "/destinations": {
    badge: "ADM",
    title: "Destinations",
    subtitle: "จัดการรายการปลายทางสำหรับ autocomplete",
    activeNav: "destinations",
  },
  "/admins": {
    badge: "ADM",
    title: "Admin",
    subtitle: "Manage application admins",
    activeNav: "admins",
  },
};

const defaultNavbarConfig = pageNavbarConfig["/"];

export default function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [authenticatedPath, setAuthenticatedPath] = useState<string | null>(null);
  const [access, setAccess] = useState({ isAdmin: false, isSuperAdmin: false });

  useEffect(() => {
    if (pathname === "/login") return;

    let isActive = true;
    sessionApiService
      .getSession()
      .then((session) => {
        if (!isActive) return;
        setAccess({
          isAdmin: SessionApiService.hasAdminRole(session),
          isSuperAdmin: SessionApiService.hasSuperAdminRole(session),
        });
        setAuthenticatedPath(pathname);
      })
      .catch(() => {
        window.location.replace(basePathService.withBasePath("/login"));
      });

    return () => {
      isActive = false;
    };
  }, [pathname]);

  // While the user is working, keep the session alive: the session route restarts the idle timer.
  useEffect(() => {
    if (pathname === "/login") return;

    const throttle = new ActivityThrottle(ACTIVITY_PING_MS);
    const onActivity = () => {
      if (throttle.tryRun()) void sessionApiService.getSession().catch(() => undefined);
    };
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
  }, [pathname]);

  if (pathname === "/login") return <>{children}</>;

  if (authenticatedPath !== pathname) {
    return (
      <main className="screen-only grid min-h-screen place-items-center bg-canvas px-4 text-center text-base font-semibold text-muted">
        กำลังตรวจสอบการเข้าสู่ระบบ...
      </main>
    );
  }

  const handleLogout = async () => {
    try {
      await sessionApiService.logout();
    } finally {
      window.location.href = basePathService.withBasePath("/login");
    }
  };

  const navbarConfig = pageNavbarConfig[pathname] ?? defaultNavbarConfig;
  return (
    <>
      <Navbar {...navbarConfig} {...access} onLogout={() => void handleLogout()} />
      {children}
    </>
  );
}
