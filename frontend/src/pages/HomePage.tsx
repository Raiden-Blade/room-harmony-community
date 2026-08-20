import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { trackOnce } from "../api/client";

type BridgeMessage = {
  type: "room-around:navigate";
  path: string;
};

function isBridgeMessage(value: unknown): value is BridgeMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Partial<BridgeMessage>;
  return message.type === "room-around:navigate"
    && typeof message.path === "string"
    && /^\/(explore|saved|create)(\?|$)/.test(message.path);
}

export function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Room Around 02 | 世界から暮らしをめぐる";
    trackOnce("session-start", "session_start");
    trackOnce("home-view", "home_view");

    const handleBridge = (event: MessageEvent<unknown>) => {
      if (event.origin !== window.location.origin || !isBridgeMessage(event.data)) return;
      navigate(event.data.path);
    };

    window.addEventListener("message", handleBridge);
    return () => {
      window.removeEventListener("message", handleBridge);
      document.title = previousTitle;
    };
  }, [navigate]);

  return (
    <iframe
      title="Room Around 全球コーディネート"
      src="/global.html"
      style={{ width: "100%", height: "100vh", display: "block", border: 0, background: "#f5f1e8" }}
    />
  );
}
