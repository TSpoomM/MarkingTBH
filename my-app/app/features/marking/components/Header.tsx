"use client";

import { Component } from "react";
import Button from "@/app/components/Button";
import Navbar from "@/app/components/Navbar";
import MarkingComponent from "./MarkingComponent";
import Link from "next/link";

export default class Header extends MarkingComponent {
  render() {
    return (
      <Navbar
        badge="TBH"
        title="ระบบจัดการคำสั่งซื้อ"
        subtitle="จัดทำรายการบรรจุสินค้า Inside และ Outside"
        action={<div className="header-actions">
          {this.state.isAdmin && <Link className="add-customer-link" href="/customers/new">+ เพิ่ม Customer</Link>}
          <Button
            className="export-button"
            onClick={() => void this.actions.saveAndExport()}
            disabled={this.state.isSaving || !this.state.template}
            loading={this.state.isSaving}
            loadingText="กำลังบันทึก..."
          >
            <DownloadIcon />
            ส่งออก PDF
          </Button>
        </div>}
      />
    );
  }
}

class DownloadIcon extends Component {
  render() {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5M12 15V3" />
      </svg>
    );
  }
}
