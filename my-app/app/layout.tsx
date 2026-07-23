import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarkingTBH — Order Marking",
  description: "ระบบจัดการคำสั่งซื้อ ฉลากสินค้า และส่งออกเอกสาร PDF",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
