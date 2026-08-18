import { NavLink, Outlet } from "react-router-dom";

import { DemoNotice } from "../components/common/DemoNotice";

const navItems = [
  { to: "/", label: "ホーム", end: true },
  { to: "/explore", label: "見つける" },
  { to: "/saved", label: "保存・PLAN" },
  { to: "/about", label: "データについて" },
];

export function AppLayout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">本文へ移動</a>
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink className="brand" to="/" aria-label="Room Harmony Community ホーム">
            <span className="brand__mark" aria-hidden="true">RH</span>
            <span>
              <strong>Room Harmony</strong>
              <small>Community prototype</small>
            </span>
          </NavLink>
          <DemoNotice compact />
          <nav className="desktop-nav" aria-label="メインナビゲーション">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <nav className="mobile-nav" aria-label="モバイルナビゲーション">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <footer className="site-footer">
        <p>Functional MVP / synthetic demo data / no live NITORI or Room Harmony connection</p>
      </footer>
    </div>
  );
}
