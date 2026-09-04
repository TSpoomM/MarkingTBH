import type { Metadata } from "next";
import AppShell from "./appShell";
import "../styles/globals.css";
import "../styles/sticker-print.css";

export const metadata: Metadata = {
  title: "MarkingTBH",
  description: "ระบบจัดทำ sticker สำหรับส่งของจาก THB",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body><AppShell>{children}</AppShell></body></html>;
}
