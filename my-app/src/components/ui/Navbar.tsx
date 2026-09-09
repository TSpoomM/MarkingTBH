"use client";

import Link from "next/link";
import Image from "next/image";
import { Component } from "react";
import cn from "@/src/core/ui/cn";
import { sessionApiService } from "@/src/core/services/session-api.service";
import type { NavbarProps } from "@/src/core/models/ui";

type NavbarState = {
  isAdmin: boolean;
};

/** The navbar height comes from the --navbar-height variable in globals.css (varies by screen size) */
const NAV_LINK =
  "relative inline-flex min-h-11 min-w-[112px] items-center justify-center rounded-lg border " +
  "px-[18px] text-sm font-extrabold leading-none whitespace-nowrap no-underline " +
  "transition-[transform,background,color,border-color,box-shadow] duration-150 ease-out " +
  "focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_var(--focus)] " +
  "max-bp900:min-h-[42px] max-bp900:min-w-0 max-bp900:px-3.5 " +
  "max-bp700:text-[14px] max-bp560:min-h-10 max-bp560:px-2.5 max-bp560:text-xs";

const NAV_LINK_IDLE =
  "border-[#c4d8cf] bg-white text-[#38534a] shadow-[0_8px_20px_rgba(38,59,45,.07)]";

const NAV_LINK_ACTIVE =
  "border-primary-dark bg-primary text-white " +
  "shadow-[0_12px_24px_rgba(15,118,110,.28)]";

export default class Navbar extends Component<NavbarProps, NavbarState> {
  private isMounted = false;

  state: NavbarState = {
    isAdmin: false,
  };

  componentDidMount() {
    this.isMounted = true;
    void this.loadAccess();
  }

  componentWillUnmount() {
    this.isMounted = false;
  }

  private async loadAccess() {
    const isAdmin = await sessionApiService.isAdmin();
    if (!this.isMounted) return;
    this.setState({ isAdmin });
  }

  render() {
    const { badge, title, subtitle, action, activeNav } = this.props;
    const navItems = [
      { key: "marking", label: "Marking", href: "/" },
      ...(this.state.isAdmin
        ? [
          { key: "history", label: "ประวัติ", href: "/pages/history" },
          { key: "templates", label: "จัดการ Template", href: "/pages/manageTemplate" },
        ]
        : []),
    ] as const;

    return (
      <>
        <header className="screen-only fixed inset-x-0 top-0 z-[1000] min-h-[var(--navbar-height,92px)] w-full border-b border-b-[rgba(198,215,207,.9)] bg-white/92 shadow-[0_10px_32px_rgba(23,35,31,.08)] backdrop-blur-[18px]">
          <div className="mx-auto grid min-h-[var(--navbar-height,92px)] w-full max-w-[1320px] grid-cols-[minmax(250px,1fr)_auto] items-center gap-[22px] px-[clamp(16px,3vw,32px)] py-3.5 max-bp900:grid-cols-1 max-bp900:items-stretch max-bp900:gap-3 max-bp560:gap-3 max-bp560:p-3">
            <div className="flex min-w-0 items-center gap-3.5 max-bp700:items-start">
              {badge && (
                badge === "TBH" ? (
                  <Image
                    className="size-12 shrink-0 object-contain max-bp600:hidden"
                    src="/Logo.png"
                    alt="TBH"
                    width={48}
                    height={48}
                    unoptimized
                    priority
                  />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-[10px] bg-primary text-[14px] font-black tracking-[.03em] text-white shadow-[0_10px_24px_rgba(15,118,110,.22)] max-bp600:hidden">
                    {badge}
                  </span>
                )
              )}
              <div className="min-w-0">
                <h1 className="m-0 text-[25px] font-black leading-[1.15] text-[#10231d] max-bp600:text-[19px]">
                  {title}
                </h1>
                {subtitle && (
                  <p className="m-0 mt-1.5 max-w-[560px] text-[14px] leading-[1.35] text-[#63766e] max-bp600:text-[12px]">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex min-w-0 items-center justify-end gap-3.5 max-bp900:items-stretch max-bp900:justify-stretch max-bp700:w-full max-bp700:flex-col max-bp700:gap-2.5">
              <nav
                aria-label="เมนูหลัก"
                className="inline-flex min-h-[50px] items-center gap-2.5 max-bp900:grid max-bp900:w-full max-bp900:grid-cols-[repeat(auto-fit,minmax(138px,1fr))] max-bp560:gap-2"
              >
                {navItems.map((item) => (
                  <Link
                    className={cn(NAV_LINK, activeNav === item.key ? NAV_LINK_ACTIVE : NAV_LINK_IDLE)}
                    aria-current={activeNav === item.key ? "page" : undefined}
                    href={item.href}
                    key={item.key}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              {action && (
                <div className="flex shrink-0 items-center justify-end gap-2.5 max-bp900:w-full max-bp900:justify-stretch">
                  {action}
                </div>
              )}
            </div>
          </div>
        </header>
        <div aria-hidden="true" className="h-[var(--navbar-height)] shrink-0 print:hidden" />
      </>
    );
  }
}
