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
        <p>18商品の名称・参照ID・価格・画像と、部屋・Hero画像の一部は、許可済みNITORI公式素材を使った日付付き参照スナップショットです。その他は架空デモで、現在価格・在庫・NITORI／Room Harmonyとの実接続を示しません。</p>
      </footer>
    </div>
  );
}
