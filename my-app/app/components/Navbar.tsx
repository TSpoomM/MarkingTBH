import Link from "next/link";
import { Component } from "react";
import type { NavbarProps } from "@/app/types/ui";

export default class Navbar extends Component<NavbarProps> {
  render() {
    const { badge, title, subtitle, action, activeNav } = this.props;
    const navItems = [
      { key: "marking", label: "Marking", href: "/" },
      { key: "history", label: "History", href: "/pages/history" },
      { key: "customers", label: "จัดการ Customer", href: "/pages/manageCustomer" },
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
