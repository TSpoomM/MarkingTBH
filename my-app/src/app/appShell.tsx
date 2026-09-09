"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/src/components/ui/Navbar";
import type { NavbarProps } from "@/src/core/models/ui";

const pageNavbarConfig: Record<string, NavbarProps> = {
  "/": {
    badge: "TBH",
    title: "MarkingTBH",
    subtitle: "สร้าง sticker สำหรับส่งออกสินค้า",
    activeNav: "marking",
  },
  "/pages/history": {
    badge: "TBH",
    title: "ประวัติ",
    subtitle: "ตรวจสอบรายการที่บันทึกและพิมพ์/PDF",
    activeNav: "history",
  },
  "/pages/manageTemplate": {
    badge: "ADM",
    title: "จัดการ Template",
    subtitle: "เพิ่มลูกค้าใหม่ และแก้ไข Sticker Template ของลูกค้าเดิม",
    activeNav: "templates",
  },
};

const defaultNavbarConfig = pageNavbarConfig["/"];

export default function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const navbarConfig = pageNavbarConfig[usePathname()] ?? defaultNavbarConfig;
  return (
    <>
      <Navbar {...navbarConfig} />
      {children}
    </>
  );
}
