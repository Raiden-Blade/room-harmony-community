import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api, track } from "../api/client";
import type { CoordinateDetail, CoordinateSummary, CreatorProfile, HandoffPayload, ProductSummary } from "../api/types";
import { CreateCoordinatePage } from "../pages/CreateCoordinatePage";
import { CreatorProfilePage } from "../pages/CreatorProfilePage";
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
    handoff: vi.fn(), readiness: vi.fn(), creatorMe: vi.fn(), saveCreator: vi.fn(), creator: vi.fn(),
    uploadImage: vi.fn(), createCoordinate: vi.fn(), editCoordinate: vi.fn(), unpublishCoordinate: vi.fn(),
    helpful: vi.fn(), unhelpful: vi.fn(), report: vi.fn(), publishPlan: vi.fn(),
  },
  mediaUrl: (path: string) => path,
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
  creator_id: null, image_urls: ["/assets/room-natural.svg"], root_coordinate_id: "coord-001",
  derivation_type: null, moderation_status: "ACTIVE",
  image_rights: "LOCALLY_CREATED_DEMO", demo_disclosure: "オリジナルデモです。", seasonal_collection: "NEW_LIFE_2027",
  official_pick: true, price: { known_total: 21800, unknown_item_count: 0, calculated_at: "2026-08-18T00:00:00Z", currency: "JPY", status: "DEMO_SNAPSHOT", notice: "デモ価格です。" },
  product_count: 2, category_count: 2, match_reasons: ["6畳前後に近い", "収納不足に対応", "予算5万円以内"], score: 103, is_saved: false,
  helpful_count: 0, is_helpful: false, can_edit: false,
};

const detail: CoordinateDetail = {
  ...summary, parent_coordinate_id: null, remix_note: null,
  items: [
    { id: 1, role: "MAIN_FURNITURE", source: "CATALOG_TO_BUY", quantity: 1, price_snapshot: 15900, price_observed_at: product.price_observed_at, existing_label: null, dimensions: null, mutation_state: "ORIGINAL", product },
    { id: 2, role: "STORAGE", source: "CATALOG_TO_BUY", quantity: 1, price_snapshot: 5900, price_observed_at: storage.price_observed_at, existing_label: null, dimensions: null, mutation_state: "ORIGINAL", product: storage },
  ],
  creator_impact_slot: { enabled: true, helpful_count: null, saved_count: null, adaptation_count: null },
  creator_impact: { published_coordinates: 1, helpful_count: 0, saved_count: 0, plan_started_count: 0, public_adaptation_count: 0, real_room_contributions: 0 },
  genealogy: { parent: null, root: { id: "coord-001", title: "収納重視の6畳ナチュラルルーム", kind: "REAL", available: true }, plan_started_count: 0, public_adaptation_count: 0, public_children: [] },
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
  vi.mocked(api.creatorMe).mockResolvedValue({ id: "creator-1", display_name: "Demo Creator", bio: null, contribution_count: 0, impact: detail.creator_impact, created_at: "2026-08-18T00:00:00Z", contributions: [], is_owner: true });
  vi.mocked(api.saveCreator).mockResolvedValue({ id: "creator-1", display_name: "Demo Creator", bio: null, contribution_count: 0, impact: detail.creator_impact, created_at: "2026-08-18T00:00:00Z", contributions: [], is_owner: true });
  vi.mocked(api.createCoordinate).mockResolvedValue({ ...detail, id: "community-11111111-1111-1111-1111-111111111111", kind: "PLAN", creator_id: "creator-1", creator_display: "Demo Creator" });
  vi.mocked(api.helpful).mockResolvedValue({ coordinate_id: detail.id, helpful: true, helpful_count: 1 });
  vi.mocked(api.report).mockResolvedValue({ accepted: true });
  vi.mocked(api.publishPlan).mockResolvedValue({ ...detail, id: "community-22222222-2222-2222-2222-222222222222", kind: "PLAN" });
});

describe("Goal 2 creator and community surfaces", () => {
  it("Create Form keeps REAL and PLAN semantics separate and publishes structured products", async () => {
    const user = userEvent.setup();
    vi.mocked(api.products).mockResolvedValue({ results: [product] });
    renderRoute(<CreateCoordinatePage />, "/create", "/create");
    await screen.findByDisplayValue("Demo Creator");
    await user.click(screen.getByRole("radio", { name: /PLAN/ }));
    await user.click(screen.getByRole("button", { name: "暮らしの条件へ" }));
    await user.type(screen.getByLabelText("タイトル"), "実現したい6畳PLAN");
    await user.click(screen.getByRole("button", { name: "商品・画像へ" }));
    expect(screen.queryByText(/顔・氏名・郵便物・住所・車のナンバー/)).not.toBeInTheDocument();
    await user.click(await screen.findByRole("checkbox", { name: /ナチュラルベッド/ }));
    await user.click(screen.getByRole("button", { name: "PLANとして公開" }));
    await waitFor(() => expect(api.createCoordinate).toHaveBeenCalledWith(expect.objectContaining({
      kind: "PLAN",
      title: "実現したい6畳PLAN",
      products: [expect.objectContaining({ product_id: "DEMO-BED-01", role: "MAIN_FURNITURE" })],
      image_ids: [],
    })));
  });

  it("REAL image failure keeps the entered form state", async () => {
    const user = userEvent.setup();
    vi.mocked(api.products).mockResolvedValue({ results: [product] });
    renderRoute(<CreateCoordinatePage />, "/create", "/create");
    await screen.findByDisplayValue("Demo Creator");
    await user.click(screen.getByRole("button", { name: "暮らしの条件へ" }));
    await user.type(screen.getByLabelText("タイトル"), "画像待ちのREAL ROOM");
    await user.click(screen.getByRole("button", { name: "商品・画像へ" }));
    expect(screen.getByText(/顔・氏名・郵便物・住所・車のナンバー/)).toBeInTheDocument();
    await user.click(await screen.findByRole("checkbox", { name: /ナチュラルベッド/ }));
    await user.click(screen.getByRole("button", { name: "REAL ROOMとして公開" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("部屋画像が1枚以上必要");
    expect(api.createCoordinate).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "戻る" }));
    expect(screen.getByDisplayValue("画像待ちのREAL ROOM")).toBeInTheDocument();
  });

  it("Creator Profile emphasizes useful impact rather than followers", async () => {
    const profile: CreatorProfile = {
      id: "creator-1", display_name: "暮らしの試作家", bio: "手持ち家具を活かします。", contribution_count: 1,
      impact: { published_coordinates: 1, helpful_count: 3, saved_count: 2, plan_started_count: 2, public_adaptation_count: 1, real_room_contributions: 1 },
      created_at: "2026-08-18T00:00:00Z", contributions: [{ ...summary, creator_id: "creator-1", creator_display: "暮らしの試作家" }], is_owner: false,
    };
    vi.mocked(api.creator).mockResolvedValue(profile);
    renderRoute(<CreatorProfilePage />, "/creators/creator-1", "/creators/:creatorId");
    expect(await screen.findByRole("heading", { name: "暮らしの試作家" })).toBeInTheDocument();
    expect(screen.getByText("誰かの暮らしに役立った記録")).toBeInTheDocument();
    expect(screen.getByText("公開アレンジ")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Follower|フォロワー/ })).not.toBeInTheDocument();
  });

  it("Coordinate Detail separates Helpful, Save, Adapt, genealogy, and Report", async () => {
    const user = userEvent.setup();
    vi.mocked(api.coordinate).mockResolvedValue({
      ...detail,
      creator_id: "creator-1",
      creator_display: "暮らしの試作家",
      genealogy: {
        parent: { id: "coord-002", title: "参考元のコーデ", kind: "REAL", available: true },
        root: { id: "coord-002", title: "参考元のコーデ", kind: "REAL", available: true },
        plan_started_count: 2,
        public_adaptation_count: 1,
        public_children: [],
      },
    });
    renderRoute(<CoordinateDetailPage />, "/coordinates/coord-001", "/coordinates/:coordinateId");
    await user.click(await screen.findByRole("button", { name: "参考になった · 0" }));
    expect(api.helpful).toHaveBeenCalledWith("coord-001");
    expect(screen.getByText(/「参考になった」は役立ち/)).toBeInTheDocument();
    expect(screen.getByText("参考とアレンジのつながり")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "この投稿を報告" }));
    await user.selectOptions(screen.getByLabelText("理由"), "PRIVACY");
    await user.click(screen.getByRole("button", { name: "報告を送る" }));
    expect(api.report).toHaveBeenCalledWith("coord-001", "PRIVACY");
    await user.click(screen.getByRole("button", { name: "このコーデを自分向けにアレンジ" }));
    expect(api.createPlan).toHaveBeenCalledWith("coord-001", 50000);
  });

  it("Private PLAN can be published as a public PLAN with a structured reason", async () => {
    const user = userEvent.setup();
    renderRoute(<PlanPage />, "/plans/plan-001", "/plans/:planId");
    await user.click(await screen.findByRole("button", { name: "公開コーデとして共有" }));
    await user.click(screen.getByRole("radio", { name: /REAL ROOMとして共有/ }));
    expect(screen.getByText(/顔・氏名・郵便物・住所・車のナンバー/)).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /PLANとして共有/ }));
    await user.selectOptions(screen.getByLabelText("主な変更理由"), "LOWER_BUDGET");
    await user.click(screen.getByRole("button", { name: "PLANとして公開" }));
    await waitFor(() => expect(api.publishPlan).toHaveBeenCalledWith("plan-001", "PLAN", "LOWER_BUDGET", [], ""));
  });
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
    expect(screen.getByRole("button", { name: "このコーデを自分向けにアレンジ" })).toBeInTheDocument();
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
