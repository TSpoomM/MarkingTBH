"use client";

import { Component } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import {
  LOGIN_CARD,
  LOGIN_HEADER,
  LOGIN_TITLE_TH,
  LOGIN_TITLE_EN,
  LOGIN_SUBTITLE,
  LOGIN_ERROR,
  LOGIN_FIELD_WRAP,
  LOGIN_INPUT,
  LOGIN_TOGGLE_PASSWORD,
  LOGIN_SUBMIT,
} from "@/src/core/ui/login";
import { basePathService } from "@/src/core/services/client/basePath.service";
import type { LoginFormProps } from "@/src/core/models/login";

type LoginFormState = {
  showPassword: boolean;
};

export default class LoginForm extends Component<LoginFormProps, LoginFormState> {
  state: LoginFormState = { showPassword: false };

  private handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    this.props.onSubmit();
  };

  private toggleShowPassword = () => {
    this.setState((previous) => ({ showPassword: !previous.showPassword }));
  };

  render() {
    const { userInv, password, isSubmitting, error, onUserInvChange, onPasswordChange } = this.props;
    const { showPassword } = this.state;

    return (
      <form className={LOGIN_CARD} onSubmit={this.handleSubmit}>
        <div className={LOGIN_HEADER}>
          <Image src={basePathService.withBasePath("/Logo.png")} alt="TBH" width={98} height={98} unoptimized priority className="w-[98px] h-[98px] object-contain" />
          <h1 className={LOGIN_TITLE_TH}>เข้าสู่ระบบ</h1>
          <p className={LOGIN_TITLE_EN}>ระบบจัดทำสติกเกอร์</p>
          <p className={LOGIN_SUBTITLE}>บริษัท ยางไทยปักษ์ใต้ จำกัด</p>
        </div>

        {error && <p className={LOGIN_ERROR}>{error}</p>}

        <div className={LOGIN_FIELD_WRAP}>
          <label className="sr-only" htmlFor="login-userInv">ชื่อผู้ใช้</label>
          <input
            id="login-userInv"
            name="userInv"
            autoComplete="username"
            placeholder="ชื่อผู้ใช้"
            className={LOGIN_INPUT}
            value={userInv}
            onChange={(event) => onUserInvChange(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className={LOGIN_FIELD_WRAP}>
          <label className="sr-only" htmlFor="login-password">รหัสผ่าน</label>
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="รหัสผ่าน"
            className={LOGIN_INPUT}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className={LOGIN_TOGGLE_PASSWORD}
            onClick={this.toggleShowPassword}
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          >
            {showPassword ? <EyeOff size={30} aria-hidden="true" /> : <Eye size={30} aria-hidden="true" />}
          </button>
        </div>

        <button type="submit" className={LOGIN_SUBMIT} disabled={isSubmitting}>
          {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
    );
  }
}
