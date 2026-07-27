import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarkingTBH",
  description: "ระบบจัดทำ sticker สำหรับส่งของจาก THB",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
