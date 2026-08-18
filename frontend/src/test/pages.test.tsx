import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api, track } from "../api/client";
import type { CoordinateDetail, CoordinateSummary, HandoffPayload, ProductSummary } from "../api/types";
import { CoordinateDetailPage } from "../pages/CoordinateDetailPage";
import { ExplorePage } from "../pages/ExplorePage";
import { HandoffPage } from "../pages/HandoffPage";
import { HomePage } from "../pages/HomePage";
import { PlanEditPage } from "../pages/PlanEditPage";
import { PlanPage } from "../pages/PlanPage";
import { SavedPage } from "../pages/SavedPage";

vi.mock("../api/client", () => ({
  api: {
    options: vi.fn(), discover: vi.fn(), coordinate: vi.fn(), product: vi.fn(), products: vi.fn(),
    saved: vi.fn(), save: vi.fn(), unsave: vi.fn(), plans: vi.fn(), plan: vi.fn(), createPlan: vi.fn(),
    keepItem: vi.fn(), replaceItem: vi.fn(), addItem: vi.fn(), addExisting: vi.fn(), readyPlan: vi.fn(),
    handoff: vi.fn(), readiness: vi.fn(),
  },
  track: vi.fn().mockResolvedValue(undefined),
}));

const product: ProductSummary = {
  id: "DEMO-BED-01", name: "ナチュラルベッド デモ01", category: "BED", default_role: "MAIN_FURNITURE",
  price_snapshot: 15900, price_status: "DEMO_SNAPSHOT", price_observed_at: "2026-08-18T00:00:00Z",
  official_url: "https://www.nitori-net.jp/ec/search/?q=bed", image_url: "/assets/product-bed.svg",
  provenance: "DEMO", rights_status: "LOCALLY_CREATED_DEMO",
};

const storage: ProductSummary = {
  ...product, id: "DEMO-STORAGE-01", name: "ナチュラル収納 デモ01", category: "STORAGE",
  default_role: "STORAGE", price_snapshot: 5900, image_url: "/assets/product-storage.svg",
};

const summary: CoordinateSummary = {
  id: "coord-001", kind: "REAL", status: "PUBLISHED", title: "収納重視の6畳ナチュラルルーム",
  description: "6畳の収納不足を解決する架空デモです。", room_type: "ONE_ROOM", size_band: "SMALL_6",
  housing_type: "RENTAL", household: "SINGLE", budget_band: "UNDER_50000", budget_max: 50000,
  style: "NATURAL", needs: ["STORAGE", "RENTAL"], provenance: "DEMO", verification_state: "DEMO_ONLY",
  creator_display: "Demo team", creator_type: "DEMO_TEAM", image_url: "/assets/room-natural.svg",
  image_rights: "LOCALLY_CREATED_DEMO", demo_disclosure: "オリジナルデモです。", seasonal_collection: "NEW_LIFE_2027",
  official_pick: true, price: { known_total: 21800, unknown_item_count: 0, calculated_at: "2026-08-18T00:00:00Z", currency: "JPY", status: "DEMO_SNAPSHOT", notice: "デモ価格です。" },
  product_count: 2, category_count: 2, match_reasons: ["6畳前後に近い", "収納不足に対応", "予算5万円以内"], score: 103, is_saved: false,
};

const detail: CoordinateDetail = {
  ...summary, parent_coordinate_id: null,
  items: [
    { id: 1, role: "MAIN_FURNITURE", source: "CATALOG_TO_BUY", quantity: 1, price_snapshot: 15900, price_observed_at: product.price_observed_at, existing_label: null, dimensions: null, mutation_state: "ORIGINAL", product },
    { id: 2, role: "STORAGE", source: "CATALOG_TO_BUY", quantity: 1, price_snapshot: 5900, price_observed_at: storage.price_observed_at, existing_label: null, dimensions: null, mutation_state: "ORIGINAL", product: storage },
  ],
  creator_impact_slot: { enabled: true, helpful_count: null, saved_count: null, adaptation_count: null },
};

const plan: CoordinateDetail = {
  ...detail, id: "plan-001", kind: "PLAN", status: "DRAFT",
  title: "自分用：収納重視の6畳ナチュラルルーム", parent_coordinate_id: "coord-001",
};

const options = {
  room_sizes: [{ value: "SMALL_6", label: "6畳前後" }, { value: "MEDIUM_7_8", label: "7〜8畳" }],
  needs: [{ value: "STORAGE", label: "収納を増やしたい" }, { value: "RELAX", label: "くつろぎたい" }],
  budgets: [{ value: 50000, label: "5万円以内" }, { value: 80000, label: "8万円以内" }],
  styles: [{ value: "NATURAL", label: "ナチュラル" }],
};

function renderRoute(element: ReactElement, route: string, path: string) {
  return render(<MemoryRouter initialEntries={[route]}><Routes><Route path={path} element={element} /></Routes></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(track).mockResolvedValue(undefined);
  vi.mocked(api.options).mockResolvedValue(options);
  vi.mocked(api.discover).mockResolvedValue({ mode: "similar", comparison_condition: "similar", context: {}, results: [summary] });
  vi.mocked(api.coordinate).mockResolvedValue(detail);
  vi.mocked(api.saved).mockResolvedValue([summary]);
  vi.mocked(api.plans).mockResolvedValue([plan]);
  vi.mocked(api.plan).mockResolvedValue(plan);
  vi.mocked(api.products).mockResolvedValue({ results: [{ ...product, id: "DEMO-BED-02", name: "別のベッド" }] });
  vi.mocked(api.save).mockResolvedValue({ saved: true });
  vi.mocked(api.createPlan).mockResolvedValue(plan);
  vi.mocked(api.addExisting).mockResolvedValue({ ...plan, items: [...plan.items, { id: 3, role: "SUPPORT_FURNITURE", source: "EXISTING_EXTERNAL", quantity: 1, price_snapshot: null, price_observed_at: null, existing_label: "手持ちチェア", dimensions: "幅45cm", mutation_state: "ADDED", product: null }] });
  vi.mocked(api.readyPlan).mockResolvedValue({ ...plan, status: "READY_FOR_ACTION" });
  vi.mocked(api.handoff).mockResolvedValue({ schema_version: "1.0", handoff_id: "preview-1", source: "room-harmony-community", coordinate_id: plan.id, coordinate_kind: "PLAN", product_ids: [product.id, storage.id], anchor_product_id: product.id, store_id: null, intent: "COMPARE_IN_STORE", return_url: `/plans/${plan.id}`, expires_at: "2026-08-18T01:00:00Z", live_integration: false, notice: "デモ用プレビューです。" } satisfies HandoffPayload);
});

describe("functional MVP pages", () => {
  it("Home shows the primary new-life target and starting CTA", async () => {
    renderRoute(<HomePage />, "/", "/");
    expect(screen.getByText("新生活 × 一人暮らし × 6畳")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "6畳のおすすめを見る" })).toHaveAttribute("href", expect.stringContaining("SMALL_6"));
    expect(await screen.findByText(summary.title)).toBeInTheDocument();
  });

  it("Context selection sends at most room, need, and budget", async () => {
    const user = userEvent.setup();
    renderRoute(<ExplorePage />, "/explore?room_size=SMALL_6&need=STORAGE&budget_max=50000", "/explore");
    await screen.findByText(summary.title);
    await user.selectOptions(screen.getByLabelText("いちばんの困りごと"), "RELAX");
    await user.click(screen.getByRole("button", { name: "この条件で探す" }));
    await waitFor(() => expect(vi.mocked(api.discover)).toHaveBeenLastCalledWith(expect.objectContaining({})));
    const params = vi.mocked(api.discover).mock.calls.at(-1)?.[0];
    expect(params?.get("need")).toBe("RELAX");
    expect([...params!.keys()].sort()).toEqual(["budget_max", "limit", "mode", "need", "room_size"].sort());
  });

  it("Similar results explain why each coordinate fits", async () => {
    renderRoute(<ExplorePage />, "/explore?room_size=SMALL_6&need=STORAGE&budget_max=50000", "/explore");
    expect(await screen.findByText("収納不足に対応")).toBeInTheDocument();
    expect(screen.queryByText(/AIがおすすめ/)).not.toBeInTheDocument();
  });

  it("Coordinate Detail shows multiple product roles", async () => {
    renderRoute(<CoordinateDetailPage />, "/coordinates/coord-001", "/coordinates/:coordinateId");
    expect(await screen.findByRole("heading", { name: detail.title })).toBeInTheDocument();
    expect(screen.getByText("メイン家具")).toBeInTheDocument();
    expect(screen.getAllByText("収納").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "このコーデを参考にPLANを作る" })).toBeInTheDocument();
  });

  it("Save is an intent action and changes the button state", async () => {
    const user = userEvent.setup();
    renderRoute(<CoordinateDetailPage />, "/coordinates/coord-001", "/coordinates/:coordinateId");
    await user.click(await screen.findByRole("button", { name: "あとで参考にする" }));
    expect(api.save).toHaveBeenCalledWith("coord-001");
    expect(await screen.findByRole("button", { name: "保存済み" })).toBeDisabled();
  });

  it("Saved page separates references from private PLANs", async () => {
    renderRoute(<SavedPage />, "/saved", "/saved");
    expect(await screen.findByRole("heading", { name: "My PLAN" })).toBeInTheDocument();
    expect(screen.getByText("自分用：収納重視の6畳ナチュラルルーム")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "自分向けに変更する" })).toBeInTheDocument();
  });

  it("Plan editor can add existing furniture without a product ID", async () => {
    const user = userEvent.setup();
    renderRoute(<PlanEditPage />, "/plans/plan-001/edit", "/plans/:planId/edit");
    await screen.findByRole("heading", { name: "自分向けに変更する" });
    await user.type(screen.getByLabelText("手持ち家具の名前"), "手持ちチェア");
    await user.type(screen.getByLabelText("手持ち家具のサイズ"), "幅45cm");
    await user.click(screen.getByRole("button", { name: "手持ち家具を追加" }));
    await waitFor(() => expect(api.addExisting).toHaveBeenCalledWith("plan-001", "手持ちチェア", "SUPPORT_FURNITURE", "幅45cm"));
  });

  it("Plan and handoff pages expose a goal-centered preview CTA", async () => {
    const view = renderRoute(<PlanPage />, "/plans/plan-001", "/plans/:planId");
    expect(await screen.findByRole("link", { name: "店舗で2商品を比較する" })).toBeInTheDocument();
    view.unmount();
    renderRoute(<HandoffPage />, "/plans/plan-001/handoff", "/plans/:planId/handoff");
    expect(await screen.findByText("PREVIEW ONLY")).toBeInTheDocument();
    expect(screen.getAllByText(/Room Harmonyへは送信されません|デモ用プレビュー/).length).toBeGreaterThan(0);
  });
});
