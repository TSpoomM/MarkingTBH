"use client";

import Toast from "@/src/components/ui/Toast";
import TemplateManageComponent from "./TemplateManageComponent";

export default class TemplateAccessGuard extends TemplateManageComponent {
  render() {
    if (this.state.checkingRole) {
      return <Toast type="success" message="กำลังตรวจสอบสิทธิ์..." />;
    }
    if (!this.state.isAdmin) {
      return <Toast type="error" message="เฉพาะ Admin เท่านั้นที่จัดการ Template และ Sticker Template ได้" />;
    }
    return null;
  }
}
