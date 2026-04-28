import { Link, NavLink } from "react-router-dom";
import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/portfolio" className="brand">
            <span className="brand-mark" />
            <span className="brand-text">Clay Dowdell Leslie</span>
          </Link>
          <nav className="nav-links">
            <NavLink to="/portfolio" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              Home
            </NavLink>
            <NavLink to="/portfolio/about" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              About me
            </NavLink>
            <NavLink
              to="/portfolio/music-practice-pal"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Music Practice Pal
            </NavLink>
            <NavLink
              to="/portfolio/weather-music"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Weather Music
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Clayton Dowdell Leslie. All rights reserved.</p>
      </footer>
    </div>
  );
};
