"use client";

import Link from "next/link";
import { Component } from "react";
import type { NavbarProps } from "@/app/types/ui";

type NavbarState = {
  isAdmin: boolean;
};

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
    try {
      const response = await fetch("/api/session");
      const session = (await response.json()) as { user?: { role?: string } };
      if (!this.isMounted) return;
      this.setState({ isAdmin: response.ok && session.user?.role === "admin" });
    } catch {
      if (!this.isMounted) return;
      this.setState({ isAdmin: false });
    }
  }

  render() {
    const { badge, title, subtitle, action, activeNav } = this.props;
    const navItems = [
      { key: "marking", label: "Marking", href: "/" },
      ...(this.state.isAdmin
        ? [
          { key: "history", label: "History", href: "/pages/history" },
          { key: "customers", label: "จัดการ Template", href: "/pages/manageCustomer" },
        ]
        : []),
    ] as const;

    return (
      <>
        <header className="header">
          <div className="header-inner">
            <div className="logo">
              {badge && <span>{badge}</span>}
              <div className="logo-copy">
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
              </div>
            </div>
            <div className="navbar-right">
              <nav className="navbar-nav" aria-label="Primary navigation">
                {navItems.map((item) => (
                  <Link
                    className={activeNav === item.key ? "active" : ""}
                    aria-current={activeNav === item.key ? "page" : undefined}
                    href={item.href}
                    key={item.key}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              {action && <div className="navbar-action">{action}</div>}
            </div>
          </div>
        </header>
        <div className="navbar-spacer" aria-hidden="true" />
      </>
    );
  }
}
