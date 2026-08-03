import { Component, type ReactNode } from "react";

export interface NavbarProps {
  badge?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default class Navbar extends Component<NavbarProps> {
  render() {
    const { badge, title, subtitle, action } = this.props;
    return (
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            {badge && <span>{badge}</span>}
            <div className="logo-copy"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
          </div>
          {action && <div className="navbar-action">{action}</div>}
        </div>
      </header>
    );
  }
}
