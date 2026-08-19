import { afterEach, describe, expect, it, vi } from "vitest";

import { api, trackOnce } from "../api/client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API client hardening", () => {
  it("deduplicates the same passive analytics exposure during one page runtime", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const key = `strict-mode-view-${Date.now()}`;

    trackOnce(key, "home_view");
    trackOnce(key, "home_view");

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("turns a backend connection failure into an actionable Japanese message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(api.coordinate("coord-001")).rejects.toThrow("start-demo.cmd");
  });

  it("translates challenge rejection codes without exposing internal tokens", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      detail: { code: "CHALLENGE_NOT_ELIGIBLE", reasons: ["BUDGET_MISMATCH"] },
    }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    })));
    await expect(api.enterChallenge("demo", "coord-001")).rejects.toThrow("予算上限がテーマ条件を超えています");
  });

  it("does not expose raw schema validation text to the demo UI", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      detail: [{ type: "missing", loc: ["body", "title"], msg: "Field required", input: {} }],
    }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    })));
    await expect(api.createCoordinate({} as never)).rejects.toThrow("必須項目を選び直してから再試行してください");
  });

  it("does not expose an unmapped backend detail string", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      detail: "sqlite internal path and stack detail",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })));
    const error = await api.coordinate("coord-001").then(() => null, (reason: Error) => reason);
    expect(error?.message).toContain("サーバーで問題が発生しました");
    expect(error?.message).not.toContain("sqlite internal path");
  });
});
