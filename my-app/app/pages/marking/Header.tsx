"use client";

import Button from "@/app/components/Button";
import Navbar from "@/app/components/Navbar";
import DownloadIcon from "./DownloadIcon";
import MarkingComponent from "./MarkingComponent";
import Link from "next/link";

export default class Header extends MarkingComponent {
  render() {
    return (
      <Navbar
        badge="TBH"
        title="MarkingTBH"
        subtitle="สร้าง sticker สำหรับส่งออกสินค้า"
        action={<div className="header-actions">
          {this.state.isAdmin && <Link className="add-customer-link" href="/pages/history">History</Link>}
          {this.state.isAdmin && <Link className="add-customer-link" href="/pages/manageCustomer">จัดการ Customer</Link>}
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
