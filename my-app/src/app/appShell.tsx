"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/src/components/ui/Navbar";
import { sessionApiService } from "@/src/core/services/session-api.service";
import { basePathService } from "@/src/lib/basePath";
import type { NavbarProps } from "@/src/core/models/ui";

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
};

const defaultNavbarConfig = pageNavbarConfig["/"];

export default function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [authenticatedPath, setAuthenticatedPath] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === "/login") return;

    let isActive = true;
    sessionApiService
      .getSession()
      .then(() => {
        if (isActive) setAuthenticatedPath(pathname);
      })
      .catch(() => {
        window.location.replace(basePathService.withBasePath("/login"));
      });

    return () => {
      isActive = false;
    };
  }, [pathname]);

  if (pathname === "/login") return <>{children}</>;

  if (authenticatedPath !== pathname) {
    return (
      <main className="screen-only grid min-h-screen place-items-center bg-canvas px-4 text-center text-base font-semibold text-muted">
        กำลังตรวจสอบการเข้าสู่ระบบ...
      </main>
    );
  }

  const navbarConfig = pageNavbarConfig[pathname] ?? defaultNavbarConfig;
  return (
    <>
      <Navbar {...navbarConfig} />
      {children}
    </>
  );
}
