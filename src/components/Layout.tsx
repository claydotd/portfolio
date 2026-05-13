import { Link, NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { useState } from "react";

type LayoutProps = {
  children: ReactNode;
};

export const Layout = ({ children }: LayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/portfolio" className="brand">
            <span className="brand-mark" />
            <span className="brand-text">Clay Dowdell Leslie</span>
          </Link>

          {/* Desktop nav */}
          <nav className="nav-links desktop-nav">
            <NavLink
              to="/portfolio"
              end
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/portfolio/about"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              About me
            </NavLink>

            <NavLink
              to="/portfolio/bean-data"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Bean Data
            </NavLink>

            <NavLink
              to="/portfolio/weather-music"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Weather Music
            </NavLink>
          </nav>

          {/* Mobile menu button */}
          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`mobile-menu-overlay ${
          mobileMenuOpen ? "open" : ""
        }`}
        onClick={closeMenu}
      />

      {/* Mobile sidebar */}
      <aside
        className={`mobile-sidebar ${
          mobileMenuOpen ? "open" : ""
        }`}
      >
        <div className="mobile-sidebar-header">
          <span>Navigation</span>

          <button
            className="mobile-menu-close"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          >
            ×
          </button>
        </div>

        <nav className="mobile-nav-links">
          <NavLink
            to="/portfolio"
            end
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive ? "mobile-nav-link active" : "mobile-nav-link"
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/portfolio/about"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive ? "mobile-nav-link active" : "mobile-nav-link"
            }
          >
            About me
          </NavLink>

          <NavLink
            to="/portfolio/bean-data"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive ? "mobile-nav-link active" : "mobile-nav-link"
            }
          >
            Bean Data
          </NavLink>

          <NavLink
            to="/portfolio/weather-music"
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive ? "mobile-nav-link active" : "mobile-nav-link"
            }
          >
            Weather Music
          </NavLink>
        </nav>
      </aside>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <p>
          © {new Date().getFullYear()} Clayton Dowdell Leslie. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
};