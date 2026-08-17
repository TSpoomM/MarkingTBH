"use client";

import Navbar from "@/app/components/Navbar";
import MarkingComponent from "./MarkingComponent";

export default class Header extends MarkingComponent {
  render() {
    return (
      <Navbar
        badge="TBH"
        title="MarkingTBH"
        subtitle="สร้าง sticker สำหรับส่งออกสินค้า"
        activeNav="marking"
      />
    );
  }
}
