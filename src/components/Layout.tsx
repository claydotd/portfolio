import { Link, NavLink } from "react-router-dom";
import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          <span className="brand-mark" />
          <span className="brand-text">Clay Dowdell Leslie</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Home
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            About me
          </NavLink>
          {/* Example: add more links as you create pages */}
        </nav>
      </header>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Clayton Dowdell Leslie. All rights reserved.</p>
      </footer>
    </div>
  );
};
