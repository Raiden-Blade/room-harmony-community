import { NavLink, Outlet } from "react-router-dom";

import { DemoNotice } from "../components/common/DemoNotice";

const navItems = [
  { to: "/", label: "ホーム", end: true },
  { to: "/explore", label: "見つける" },
  { to: "/create", label: "つくる・投稿" },
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
        <p>商品・価格・投稿内容は架空デモです。一部の部屋画像のみ許可済み公式参照素材で、NITORI・Room Harmonyとの実接続はありません。</p>
      </footer>
    </div>
  );
}
