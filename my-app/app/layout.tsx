import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarkingTBH — Document Workspace",
  description: "ระบบสร้างฉลากและส่งออกเอกสาร PDF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
