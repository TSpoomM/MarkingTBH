"use client";

import { Component } from "react";
import Toast from "@/src/components/ui/Toast";

interface TemplateAccessGuardProps {
  checkingRole: boolean;
  isAdmin: boolean;
}

export default class TemplateAccessGuard extends Component<TemplateAccessGuardProps> {
  render() {
    const { checkingRole, isAdmin } = this.props;
    if (checkingRole) {
      return <Toast type="success" message="กำลังตรวจสอบสิทธิ์..." />;
    }
    if (!isAdmin) {
      return <Toast type="error" message="เฉพาะ Admin เท่านั้นที่จัดการ Template และ Sticker Template ได้" />;
    }
    return null;
  }
}
