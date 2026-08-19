import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SafeImage } from "../components/common/SafeImage";

describe("SafeImage", () => {
  it("switches a broken room image to the bundled local fallback", () => {
    render(<SafeImage src="/assets/missing-room.webp" alt="部屋" fallbackLabel="デモ画像を表示中" />);
    const image = screen.getByRole("img", { name: "部屋" });
    fireEvent.error(image);
    expect(image).toHaveAttribute("src", "/assets/room-fallback.svg");
    expect(screen.getByRole("status")).toHaveTextContent("デモ画像を表示中");
  });
});
