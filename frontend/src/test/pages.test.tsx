import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api, track } from "../api/client";
import type { AIPreferenceProfile, ChallengeDetail, ChallengeSummary, CoordinateDetail, CoordinateSummary, CreatorProfile, FitAssessment, HandoffPayload, ProductSummary, SeasonalLanding } from "../api/types";
import { ChallengeDetailPage } from "../pages/ChallengeDetailPage";
import { CreateCoordinatePage } from "../pages/CreateCoordinatePage";
import { CreatorProfilePage } from "../pages/CreatorProfilePage";
import { CoordinateDetailPage } from "../pages/CoordinateDetailPage";
import { ExplorePage } from "../pages/ExplorePage";
import { HandoffPage } from "../pages/HandoffPage";
import { HomePage } from "../pages/HomePage";
import { PlanEditPage } from "../pages/PlanEditPage";
import { PlanPage } from "../pages/PlanPage";
import { SavedPage } from "../pages/SavedPage";
import { SeasonalLandingPage } from "../pages/SeasonalLandingPage";

vi.mock("../api/client", () => ({
  api: {
    options: vi.fn(), discover: vi.fn(), coordinate: vi.fn(), product: vi.fn(), products: vi.fn(),
    saved: vi.fn(), save: vi.fn(), unsave: vi.fn(), plans: vi.fn(), plan: vi.fn(), createPlan: vi.fn(),
    keepItem: vi.fn(), replaceItem: vi.fn(), addItem: vi.fn(), addExisting: vi.fn(), readyPlan: vi.fn(),
    handoff: vi.fn(), readiness: vi.fn(), creatorMe: vi.fn(), saveCreator: vi.fn(), creator: vi.fn(),
    uploadImage: vi.fn(), createCoordinate: vi.fn(), editCoordinate: vi.fn(), unpublishCoordinate: vi.fn(),
    helpful: vi.fn(), unhelpful: vi.fn(), report: vi.fn(), publishPlan: vi.fn(),
    seasonal: vi.fn(), challenge: vi.fn(), enterChallenge: vi.fn(),
    aiStatus: vi.fn(), aiProfile: vi.fn(), saveAIProfile: vi.fn(), planFit: vi.fn(),
    aiSuggestions: vi.fn(), applyAISuggestion: vi.fn(), aiVisualReview: vi.fn(),
    planVisualLayout: vi.fn(), savePlanVisualLayout: vi.fn(),
  },
  mediaUrl: (path: string) => path,
  track: vi.fn().mockResolvedValue(undefined),
  trackOnce: vi.fn(),
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
  id: "coord-001", kind: "PLAN", status: "READY_FOR_ACTION", title: "収納重視の6畳ナチュラルルーム",
  description: "6畳の収納不足を解決する架空デモです。", room_type: "ONE_ROOM", size_band: "SMALL_6",
  housing_type: "RENTAL", household: "SINGLE", budget_band: "UNDER_50000", budget_max: 50000,
  style: "NATURAL", needs: ["STORAGE", "RENTAL"], provenance: "DEMO", verification_state: "DEMO_ONLY",
  creator_display: "Demo team", creator_type: "DEMO_TEAM", image_url: "/assets/room-natural.svg",
  creator_id: null, image_urls: ["/assets/room-natural.svg"], root_coordinate_id: "coord-001",
  derivation_type: null, moderation_status: "ACTIVE",
  image_rights: "EXPLICITLY_PERMITTED", demo_disclosure: "室内画像と商品一覧は別の参照層です。", seasonal_collection: "NEW_LIFE_2027",
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
  genealogy: { parent: null, root: { id: "coord-001", title: "収納重視の6畳ナチュラルルーム", kind: "PLAN", available: true }, plan_started_count: 0, owned_private_plans: [], public_adaptation_count: 0, public_children: [] },
  challenge_contexts: [],
  challenge_options: [],
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

const aiProfile: AIPreferenceProfile = {
  room_size: "SMALL_6", housing_type: "RENTAL", budget_max: 50000, needs: ["STORAGE"],
  preferred_style: "NATURAL", priority_focus: "BALANCED", preserve_existing_furniture: false,
  source: "PLAN_DEFAULT",
};
const fit: FitAssessment = {
  policy_version: "prototype-recommendation-policy-1.0", overall_score: 82, fingerprint: "a".repeat(64),
  summary: "現在の適合度は82点です。",
  axes: [
    ["BUDGET", "予算", 100], ["NEEDS", "困りごと", 60], ["EXISTING_FURNITURE", "手持ち家具", null],
    ["STYLE", "テイスト", null], ["COMPOSITION", "構成", 90],
  ].map(([code, axisLabel, score]) => ({ code, label: axisLabel, score, available: score !== null, base_weight: 20, applied_weight: score === null ? 0 : 33.3, evidence: code === "BUDGET" ? ["購入候補額 21,800円 / 予算 50,000円"] : [], reason: score === null ? "評価対象外です。" : "ルール計算です。" })) as FitAssessment["axes"],
};

const emptySeasonal = { challenge_entries: 0, recognized_coordinates: 0, direct_seasonal_reuse_count: 0, participations: [] };

const challengeSummary: ChallengeSummary = {
  id: "challenge-newlife-2028", slug: "new-life-6tatami-2028", title: "新生活の6畳 2028",
  description: "前年の暮らしを今年のPLANへつなぐDemo Challengeです。", theme: "NEW_LIFE",
  season: "SPRING", year: 2028, challenge_type: "LIFE_EVENT", status: "ACTIVE",
  start_at: "2028-02-01T00:00:00+09:00", end_at: "2028-05-31T23:59:59+09:00",
  archive_at: "2028-06-30T00:00:00+09:00", cover_asset: "/assets/room-natural.svg", provenance: "DEMO",
  constraints: [
    { code: "SIZE_BAND", operator: "IN", values: ["SMALL_6"], label: "6畳前後" },
    { code: "BUDGET_MAX", operator: "LTE", values: [80000], label: "予算8万円以内" },
  ],
  constraint_summary: "6畳前後・予算8万円以内", entry_count: 1,
};

const challengeDetail: ChallengeDetail = {
  ...challengeSummary,
  why_it_matters: "商品単体ではなく、広さと予算を同時に考えるためです。",
  eligibility: { size_bands: ["SMALL_6"], households: ["SINGLE"], housing_types: ["RENTAL"], budget_max: 80000, kinds: ["REAL", "PLAN"], image_required: false, min_product_count: 2 },
  participation_count: 1, real_count: 0, plan_count: 1,
  entries: [{ id: "entry-1", challenge_id: challengeSummary.id, coordinate_id: summary.id, creator_id: null, submitted_at: "2028-02-10T00:00:00Z", status: "ACTIVE", recognition: "SMALL_SPACE_IDEA", provenance: "PROTOTYPE_PICK", coordinate: summary }],
  prototype_picks: [{ id: "entry-1", challenge_id: challengeSummary.id, coordinate_id: summary.id, creator_id: null, submitted_at: "2028-02-10T00:00:00Z", status: "ACTIVE", recognition: "SMALL_SPACE_IDEA", provenance: "PROTOTYPE_PICK", coordinate: summary }],
  my_candidates: [],
};

const seasonalLanding: SeasonalLanding = {
  concept_label: "Seasonal Growth Concept", featured: challengeSummary, active: [challengeSummary], upcoming: [],
  ended: [{ ...challengeSummary, id: "challenge-ended-2027", slug: "cozy-work-2027", title: "在宅時間を整える 2027", year: 2027, status: "ENDED" }],
  archived: [{ ...challengeSummary, id: "challenge-newlife-2027", slug: "new-life-6tatami-2027", title: "新生活の6畳 2027", year: 2027, status: "ARCHIVED" }],
  constraint_themes: [], previous_year_coordinates: [summary],
  notice: "すべてSynthetic dataによるFunctional Prototypeです。",
};

function renderRoute(element: ReactElement, route: string, path: string) {
  return render(<MemoryRouter initialEntries={[route]}><Routes><Route path={path} element={element} /></Routes></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(track).mockResolvedValue(undefined);
  vi.mocked(api.options).mockResolvedValue(options);
  vi.mocked(api.seasonal).mockResolvedValue(seasonalLanding);
  vi.mocked(api.challenge).mockResolvedValue(challengeDetail);
  vi.mocked(api.enterChallenge).mockResolvedValue(challengeDetail.entries[0]);
  vi.mocked(api.discover).mockResolvedValue({ mode: "similar", comparison_condition: "similar", context: {}, results: [summary] });
  vi.mocked(api.coordinate).mockResolvedValue(detail);
  vi.mocked(api.saved).mockResolvedValue([summary]);
  vi.mocked(api.plans).mockResolvedValue([plan]);
  vi.mocked(api.plan).mockResolvedValue(plan);
  vi.mocked(api.aiStatus).mockResolvedValue({ enabled: false, configured: false, available: false, verified: false, reason_code: "DISABLED", model: "gpt-5.6" });
  vi.mocked(api.aiProfile).mockResolvedValue(aiProfile);
  vi.mocked(api.saveAIProfile).mockResolvedValue({ ...aiProfile, source: "SAVED_PROFILE" });
  vi.mocked(api.planFit).mockResolvedValue(fit);
  vi.mocked(api.planVisualLayout).mockResolvedValue({ plan_id: plan.id, version: 0, status: "NOT_SAVED", updated_at: null, layout_items: [] });
  vi.mocked(api.savePlanVisualLayout).mockImplementation(async (planId, baseVersion, layoutItems) => ({ plan_id: planId, version: baseVersion + 1, status: "SAVED", updated_at: "2026-08-20T00:00:00Z", layout_items: layoutItems }));
  vi.mocked(api.products).mockResolvedValue({ results: [{ ...product, id: "DEMO-BED-02", name: "別のベッド" }] });
  vi.mocked(api.save).mockResolvedValue({ saved: true });
  vi.mocked(api.createPlan).mockResolvedValue(plan);
  vi.mocked(api.addExisting).mockResolvedValue({ ...plan, items: [...plan.items, { id: 3, role: "SUPPORT_FURNITURE", source: "EXISTING_EXTERNAL", quantity: 1, price_snapshot: null, price_observed_at: null, existing_label: "手持ちチェア", dimensions: "幅45cm", mutation_state: "ADDED", product: null }] });
  vi.mocked(api.readyPlan).mockResolvedValue({ ...plan, status: "READY_FOR_ACTION" });
  vi.mocked(api.handoff).mockResolvedValue({ schema_version: "1.0", handoff_id: "preview-1", source: "room-harmony-community", coordinate_id: plan.id, coordinate_kind: "PLAN", product_ids: [product.id, storage.id], anchor_product_id: product.id, store_id: null, intent: "COMPARE_IN_STORE", return_url: `/plans/${plan.id}`, expires_at: "2026-08-18T01:00:00Z", live_integration: false, notice: "デモ用プレビューです。" } satisfies HandoffPayload);
  vi.mocked(api.creatorMe).mockResolvedValue({ id: "creator-1", display_name: "Demo Creator", bio: null, contribution_count: 0, impact: detail.creator_impact, created_at: "2026-08-18T00:00:00Z", contributions: [], is_owner: true, seasonal: emptySeasonal });
  vi.mocked(api.saveCreator).mockResolvedValue({ id: "creator-1", display_name: "Demo Creator", bio: null, contribution_count: 0, impact: detail.creator_impact, created_at: "2026-08-18T00:00:00Z", contributions: [], is_owner: true, seasonal: emptySeasonal });
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
      seasonal: { challenge_entries: 1, recognized_coordinates: 1, direct_seasonal_reuse_count: 2, participations: [{ challenge_id: challengeSummary.id, challenge_slug: challengeSummary.slug, challenge_title: challengeSummary.title, season: "SPRING", year: 2028, coordinate_id: summary.id, coordinate_title: summary.title, recognition: "SMALL_SPACE_IDEA", provenance: "PROTOTYPE_PICK" }] },
    };
    vi.mocked(api.creator).mockResolvedValue(profile);
    renderRoute(<CreatorProfilePage />, "/creators/creator-1", "/creators/:creatorId");
    expect(await screen.findByRole("heading", { name: "暮らしの試作家" })).toBeInTheDocument();
    expect(screen.getByText("誰かの暮らしに役立った記録")).toBeInTheDocument();
    expect(screen.getByText("公開アレンジ")).toBeInTheDocument();
    expect(screen.getByText("今年の新生活ユーザーの参考へ")).toBeInTheDocument();
    expect(screen.getByText("Prototype Pick")).toBeInTheDocument();
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
        owned_private_plans: [{ id: "plan-001", title: "自分用：参考元のコーデ", kind: "PLAN", available: true }],
        public_adaptation_count: 1,
        public_children: [{ id: "community-33333333-3333-3333-3333-333333333333", title: "公開アレンジ例", kind: "PLAN", available: true }],
      },
    });
    renderRoute(<CoordinateDetailPage />, "/coordinates/coord-001", "/coordinates/:coordinateId");
    await user.click(await screen.findByRole("button", { name: "参考になった · 0" }));
    expect(api.helpful).toHaveBeenCalledWith("coord-001");
    expect(screen.getByText(/「参考になった」は役立ち/)).toBeInTheDocument();
    expect(screen.getByText("このコーデがどう活用されたか")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /自分用：参考元のコーデを開く/ })).toHaveAttribute("href", "/plans/plan-001");
    expect(screen.getByRole("link", { name: "公開アレンジ例 →" })).toHaveAttribute("href", "/coordinates/community-33333333-3333-3333-3333-333333333333");
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

describe("Goal 3 seasonal growth surfaces", () => {
  it("Seasonal Landing keeps the annual reuse loop and previous-year archive visible", async () => {
    renderRoute(<SeasonalLandingPage />, "/seasonal", "/seasonal");
    expect(await screen.findByRole("heading", { name: /前年の暮らしを/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "季節のコーデ再利用ループ" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "受付終了・整理中" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "昨年の参考コーデ" })).toBeInTheDocument();
    expect(screen.getByText(summary.title)).toBeInTheDocument();
    expect(screen.queryByText(/1位|フォロワー/)).not.toBeInTheDocument();
  });

  it("Challenge Detail displays structured constraints and clearly labeled Prototype Picks", async () => {
    renderRoute(<ChallengeDetailPage />, `/challenges/${challengeSummary.slug}`, "/challenges/:challengeSlug");
    expect(await screen.findByRole("heading", { name: challengeSummary.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "参加条件" })).toBeInTheDocument();
    expect(screen.getByText("予算8万円以内")).toBeInTheDocument();
    expect(screen.getAllByText("PROTOTYPE PICK").length).toBeGreaterThan(0);
    expect(screen.getByText(/NITORI公式企画・公式選定ではありません/)).toBeInTheDocument();
  });

  it("Owner can enter an eligible existing Coordinate", async () => {
    const user = userEvent.setup();
    vi.mocked(api.challenge).mockResolvedValue({
      ...challengeDetail,
      my_candidates: [{ coordinate: { ...summary, id: "community-11111111-1111-1111-1111-111111111111" }, eligible: true, rejection_codes: [], rejection_messages: [], already_entered: false }],
    });
    renderRoute(<ChallengeDetailPage />, `/challenges/${challengeSummary.slug}`, "/challenges/:challengeSlug");
    await user.click(await screen.findByRole("button", { name: "このテーマに参加" }));
    expect(api.enterChallenge).toHaveBeenCalledWith(challengeSummary.slug, "community-11111111-1111-1111-1111-111111111111");
    expect(await screen.findByRole("status")).toHaveTextContent("テーマに参加しました");
  });

  it("Eligibility errors remain visible and do not imply a successful entry", async () => {
    const user = userEvent.setup();
    vi.mocked(api.challenge).mockResolvedValue({
      ...challengeDetail,
      my_candidates: [{ coordinate: { ...summary, id: "community-22222222-2222-2222-2222-222222222222" }, eligible: true, rejection_codes: [], rejection_messages: [], already_entered: false }],
    });
    vi.mocked(api.enterChallenge).mockRejectedValue(new Error("参加条件を確認してください。予算上限がテーマ条件を超えています。"));
    renderRoute(<ChallengeDetailPage />, `/challenges/${challengeSummary.slug}`, "/challenges/:challengeSlug");
    await user.click(await screen.findByRole("button", { name: "このテーマに参加" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("予算上限がテーマ条件を超えています");
  });

  it("Archived Challenge is reusable but no longer accepts entries", async () => {
    vi.mocked(api.challenge).mockResolvedValue({ ...challengeDetail, status: "ARCHIVED", year: 2027, my_candidates: [] });
    renderRoute(<ChallengeDetailPage />, "/challenges/new-life-6tatami-2027", "/challenges/:challengeSlug");
    expect(await screen.findByText("前年Archive")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "このテーマの参考コーデ" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "このテーマに参加" })).not.toBeInTheDocument();
  });
});

describe("functional MVP pages", () => {
  it("Home connects global discovery to the existing product flow", async () => {
    renderRoute(<HomePage />, "/", "/");
    expect(screen.getByTitle("Room Around 全球コーディネート")).toHaveAttribute("src", "/global.html");
    expect(api.coordinate).not.toHaveBeenCalled();
  });

  it("Home accepts only known same-origin bridge destinations", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/saved" element={<p>saved destination</p>} />
        </Routes>
      </MemoryRouter>,
    );

    act(() => {
      window.dispatchEvent(new MessageEvent("message", {
        origin: window.location.origin,
        data: { type: "room-around:navigate", path: "/admin" },
      }));
    });
    expect(screen.queryByText("saved destination")).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new MessageEvent("message", {
        origin: window.location.origin,
        data: { type: "room-around:navigate", path: "/saved" },
      }));
    });
    expect(await screen.findByText("saved destination")).toBeInTheDocument();
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
    expect(screen.getByRole("heading", { name: "このコーデの特徴" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "選んだ条件との一致" })).not.toBeInTheDocument();
    expect(screen.getByText(/室内画像と購入候補は、別々の参照情報/)).toBeInTheDocument();
    expect(screen.getByText("参考コーデ")).toBeInTheDocument();
    const features = screen.getByRole("list", { name: "コーデの属性" });
    expect(within(features).queryByRole("button")).not.toBeInTheDocument();
    expect(within(features).queryByRole("link")).not.toBeInTheDocument();
  });

  it("AI bridge explains the required PLAN context before opening the editor", async () => {
    renderRoute(<SavedPage />, "/saved?intent=ai", "/saved");
    expect(await screen.findByRole("heading", { name: "AIと調整するPLANを選ぶ" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "AIと調整する" })).toHaveAttribute("href", "/plans/plan-001/edit");
  });

  it("Coordinate Detail reached from Explore shows only the selected matching reasons", async () => {
    renderRoute(
      <CoordinateDetailPage />,
      "/coordinates/coord-001?room_size=SMALL_6&need=STORAGE&budget_max=50000",
      "/coordinates/:coordinateId",
    );

    expect(await screen.findByRole("heading", { name: "選んだ条件との一致" })).toBeInTheDocument();
    expect(screen.getByText("収納不足に対応")).toBeInTheDocument();
    const params = vi.mocked(api.coordinate).mock.calls.at(-1)?.[1];
    expect(params?.get("room_size")).toBe("SMALL_6");
    expect(params?.get("need")).toBe("STORAGE");
    expect(params?.get("budget_max")).toBe("50000");
  });

  it("Built-in reference provenance is not presented as a User declaration", async () => {
    vi.mocked(api.coordinate).mockResolvedValue({
      ...detail,
      creator_id: null,
      provenance: "USER_DECLARED",
      verification_state: "DEMO_ONLY",
    });
    renderRoute(<CoordinateDetailPage />, "/coordinates/coord-001", "/coordinates/:coordinateId");

    const source = await screen.findByRole("region", { name: "この事例について" });
    expect(within(source).getByText("デモ制作（検証用構成）")).toBeInTheDocument();
    expect(within(source).queryByText(/User申告/)).not.toBeInTheDocument();
  });

  it("Actual user-created content keeps its User declaration provenance", async () => {
    vi.mocked(api.coordinate).mockResolvedValue({
      ...detail,
      id: "community-11111111-1111-1111-1111-111111111111",
      kind: "REAL",
      creator_id: "creator-1",
      provenance: "USER_DECLARED",
      verification_state: "USER_DECLARED_UNVERIFIED",
      image_rights: "USER_UPLOADED_LOCAL",
    });
    renderRoute(
      <CoordinateDetailPage />,
      "/coordinates/community-11111111-1111-1111-1111-111111111111",
      "/coordinates/:coordinateId",
    );

    const source = await screen.findByRole("region", { name: "この事例について" });
    expect(within(source).getByText("User申告（検証用構成）")).toBeInTheDocument();
    expect(screen.getByText("ユーザー申告のREAL ROOM")).toBeInTheDocument();
  });

  it("Existing furniture offers a clear next step to the current user's plan", async () => {
    const user = userEvent.setup();
    vi.mocked(api.coordinate).mockResolvedValue({
      ...detail,
      items: [
        ...detail.items,
        { id: 3, role: "SUPPORT_FURNITURE", source: "EXISTING_EXTERNAL", quantity: 1, price_snapshot: null, price_observed_at: null, existing_label: "手持ちのチェア", dimensions: "幅45cm", mutation_state: "ORIGINAL", product: null },
      ],
    });
    renderRoute(<CoordinateDetailPage />, "/coordinates/coord-001", "/coordinates/:coordinateId");

    await user.click(await screen.findByRole("button", { name: "この家具を残して自分用PLANへ →" }));
    expect(api.createPlan).toHaveBeenCalledWith("coord-001", 50000);
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

  it("Plan editor uses the backend price notice and the actual Product name for image alt text", async () => {
    const officialProduct: ProductSummary = {
      ...product,
      id: "NTR-2110600044491-0000002000852",
      name: "パイプベッド シングル (バジーナF WH)",
      image_url: "/assets/products/nitori/ntr-bed-natural.webp",
      provenance: "NITORI_OFFICIAL_SNAPSHOT",
      price_status: "NITORI_OFFICIAL_SNAPSHOT",
    };
    const mixedNotice = "NITORI公式参照価格と架空のデモ価格が混在しています。現在価格・在庫を示しません。";
    vi.mocked(api.plan).mockResolvedValue({
      ...plan,
      price: { ...plan.price, status: "MIXED_SNAPSHOT", notice: mixedNotice },
      items: [{ ...plan.items[0], product: officialProduct }],
      product_count: 1,
      category_count: 1,
    });
    renderRoute(<PlanEditPage />, "/plans/plan-001/edit", "/plans/:planId/edit");

    expect((await screen.findAllByRole("img", { name: `${officialProduct.name}の商品画像` })).length).toBeGreaterThan(0);
    expect(screen.getByText(`${mixedNotice} 手持ち家具は購入候補額に含みません。`)).toBeInTheDocument();
    expect(screen.getByText(/購入候補額を再計算/)).toBeInTheDocument();
    expect(screen.queryByText("デモ価格です。手持ち家具は含みません。")).not.toBeInTheDocument();
  });

  it("Plan editor keeps deterministic fit available while AI is disabled", async () => {
    const user = userEvent.setup();
    renderRoute(<PlanEditPage />, "/plans/plan-001/edit", "/plans/:planId/edit");
    expect(await screen.findByText("82")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "現在のPLANを、空間として確かめる" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "PLANのベースとなったコーディネート参考画像" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "現在のPLAN分析" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "AIと一緒に配置イメージを試す" }));
    await user.click(within(await screen.findByRole("dialog", { name: "AIと一緒に配置イメージを試す" })).getByRole("tab", { name: "AIアドバイス" }));
    await user.click(within(screen.getByRole("dialog", { name: "AIと一緒に配置イメージを試す" })).getByRole("button", { name: "希望条件から商品候補を見直す" }));
    expect(screen.getByRole("dialog", { name: "希望条件から調整案をつくる" })).toBeInTheDocument();
    expect(screen.getByText(/AI調整案は停止中/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "この条件でAI調整案をつくる" })).toBeDisabled();
    expect(screen.getAllByText("予算").length).toBeGreaterThan(0);
    expect(screen.getAllByText("購入候補額 21,800円 / 予算 50,000円").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("img", { name: /^PLAN適合度 82点/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("--").length).toBeGreaterThanOrEqual(2);
  });

  it("composition studio keeps the current PLAN products and remains usable without AI", async () => {
    const user = userEvent.setup();
    renderRoute(<PlanEditPage />, "/plans/plan-001/edit", "/plans/:planId/edit");

    await user.click(await screen.findByRole("button", { name: "AIと一緒に配置イメージを試す" }));

    const studio = await screen.findByRole("dialog", { name: "AIと一緒に配置イメージを試す" });
    expect(studio).toBeInTheDocument();
    expect(within(studio).getByText(product.name)).toBeInTheDocument();
    expect(within(studio).getByText(storage.name)).toBeInTheDocument();
    expect(within(studio).getByText(/参考PLANの商品をそのまま配置/)).toBeInTheDocument();
    await user.click(within(studio).getByRole("button", { name: "↷ 15°" }));
    await user.click(within(studio).getByRole("button", { name: "配置を保存" }));
    await waitFor(() => expect(api.savePlanVisualLayout).toHaveBeenCalledWith(
      plan.id,
      0,
      expect.arrayContaining([expect.objectContaining({ item_id: 1, product_id: product.id, rotation: 15 })]),
    ));
    expect(within(studio).getByText("このPLANに保存しました")).toBeInTheDocument();
    const visualAssistButton = within(studio).getByRole("button", { name: "この配置をAIと一緒に見直す" });
    expect(visualAssistButton).toBeEnabled();
    expect(within(studio).getByText(/AI未接続・配置のみ利用可能/)).toBeInTheDocument();
    await user.click(visualAssistButton);
    await user.click(within(studio).getByRole("tab", { name: "AIアドバイス" }));
    expect(within(studio).getByRole("alert")).toHaveTextContent(/AIは現在オフです/);
  });

  it("configured AI is labelled unverified until the first successful generation", async () => {
    const user = userEvent.setup();
    vi.mocked(api.aiStatus).mockResolvedValue({
      enabled: true, configured: true, available: true, verified: false,
      reason_code: "NOT_CHECKED", model: "gpt-5.6",
    });
    renderRoute(<PlanEditPage />, "/plans/plan-001/edit", "/plans/:planId/edit");

    await user.click(await screen.findByRole("button", { name: "AIと一緒に配置イメージを試す" }));
    await user.click(within(await screen.findByRole("dialog", { name: "AIと一緒に配置イメージを試す" })).getByRole("tab", { name: "AIアドバイス" }));
    await user.click(within(screen.getByRole("dialog", { name: "AIと一緒に配置イメージを試す" })).getByRole("button", { name: "希望条件から商品候補を見直す" }));

    expect(screen.getByText(/API接続はまだ確認されていません/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "この条件でAI調整案をつくる" })).toBeEnabled();
  });

  it("AI profile editor saves structured preferences and recalculates fit", async () => {
    const user = userEvent.setup();
    renderRoute(<PlanEditPage />, "/plans/plan-001/edit", "/plans/:planId/edit");
    await user.click(await screen.findByRole("button", { name: "AIと一緒に配置イメージを試す" }));
    await user.click(within(await screen.findByRole("dialog", { name: "AIと一緒に配置イメージを試す" })).getByRole("tab", { name: "AIアドバイス" }));
    await user.click(within(screen.getByRole("dialog", { name: "AIと一緒に配置イメージを試す" })).getByRole("button", { name: "希望条件から商品候補を見直す" }));
    await user.selectOptions(screen.getByLabelText("最優先"), "STYLE");
    await user.click(screen.getByRole("checkbox", { name: "省スペース" }));
    await user.click(screen.getByRole("button", { name: "希望条件を保存して再計算" }));

    await waitFor(() => expect(api.saveAIProfile).toHaveBeenCalledWith(expect.objectContaining({
      priority_focus: "STYLE",
      needs: ["STORAGE", "COMPACT"],
    })));
    expect(api.planFit).toHaveBeenCalledWith("plan-001");
  });

  it("AI suggestion loading and provider errors stay inside the drawer", async () => {
    const user = userEvent.setup();
    vi.mocked(api.aiStatus).mockResolvedValue({ enabled: true, configured: true, available: true, verified: true, reason_code: "READY", model: "gpt-5.6" });
    let rejectSuggestion!: (reason: Error) => void;
    vi.mocked(api.aiSuggestions).mockImplementation(() => new Promise((_, reject) => { rejectSuggestion = reject; }));
    renderRoute(<PlanEditPage />, "/plans/plan-001/edit", "/plans/:planId/edit");
    await user.click(await screen.findByRole("button", { name: "AIと一緒に配置イメージを試す" }));
    await user.click(within(await screen.findByRole("dialog", { name: "AIと一緒に配置イメージを試す" })).getByRole("tab", { name: "AIアドバイス" }));
    await user.click(within(screen.getByRole("dialog", { name: "AIと一緒に配置イメージを試す" })).getByRole("button", { name: "希望条件から商品候補を見直す" }));
    await user.click(screen.getByRole("button", { name: "この条件でAI調整案をつくる" }));
    expect(screen.getByRole("button", { name: "確認中…" })).toBeDisabled();

    rejectSuggestion(new Error("AIサービスへ接続できませんでした。通常のPLAN編集は引き続き使えます。"));
    expect(await screen.findByRole("alert")).toHaveTextContent("通常のPLAN編集は引き続き使えます");
    expect(screen.getByRole("dialog", { name: "希望条件から調整案をつくる" })).toBeInTheDocument();
  });

  it("AI suggestion is previewed before an explicit apply action", async () => {
    const user = userEvent.setup();
    const nextFit = { ...fit, overall_score: 88, fingerprint: "b".repeat(64), summary: "現在の適合度は88点です。" };
    const suggestion = {
      id: "ai-preview-11111111-1111-1111-1111-111111111111" as const,
      strategy: "BALANCED" as const, action: "REPLACE" as const, title: "収納を保ちながら予算調整",
      rationale: "同じ役割の商品を1点だけ見直します。", tradeoff: "現在の商品はPLANから外れます。",
      target: { item_id: 1, product_id: product.id, name: product.name, role: product.default_role, price_snapshot: product.price_snapshot },
      proposed_product: { item_id: null, product_id: "NTR-REPLACE-01", name: "公式候補ベッド", role: product.default_role, price_snapshot: 13900 },
      before_price: 21800, after_price: 19800, price_delta: -2000, before_fit: fit, after_fit: nextFit,
    };
    vi.mocked(api.aiStatus).mockResolvedValue({ enabled: true, configured: true, available: true, verified: true, reason_code: "READY", model: "gpt-5.6" });
    vi.mocked(api.aiSuggestions).mockResolvedValue({ policy_version: fit.policy_version, profile: { ...aiProfile, source: "SAVED_PROFILE" }, current_fit: fit, suggestions: [suggestion] });
    vi.mocked(api.applyAISuggestion).mockResolvedValue({ plan: { ...plan, items: [{ ...plan.items[0], product: { ...product, id: "NTR-REPLACE-01", name: "公式候補ベッド" }, mutation_state: "REPLACED" }, plan.items[1]] }, suggestion, before_fit: fit, after_fit: nextFit });
    renderRoute(<PlanEditPage />, "/plans/plan-001/edit", "/plans/:planId/edit");
    await user.click(await screen.findByRole("button", { name: "AIと一緒に配置イメージを試す" }));
    await user.click(within(await screen.findByRole("dialog", { name: "AIと一緒に配置イメージを試す" })).getByRole("tab", { name: "AIアドバイス" }));
    await user.click(within(screen.getByRole("dialog", { name: "AIと一緒に配置イメージを試す" })).getByRole("button", { name: "希望条件から商品候補を見直す" }));
    await user.click(screen.getByRole("button", { name: "この条件でAI調整案をつくる" }));
    expect(await screen.findByText("収納を保ちながら予算調整")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AIからのコーディネート所見" })).toBeInTheDocument();
    expect(screen.queryByText(/API接続はまだ確認されていません/)).not.toBeInTheDocument();
    expect(api.applyAISuggestion).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "この提案をPLANに反映" }));
    expect(api.applyAISuggestion).toHaveBeenCalledWith("plan-001", suggestion.id);
    expect(await screen.findByRole("status")).toHaveTextContent("適合度 82 → 88");
  });

  it("Plan and handoff pages expose a goal-centered preview CTA", async () => {
    const view = renderRoute(<PlanPage />, "/plans/plan-001", "/plans/:planId");
    expect(await screen.findByRole("link", { name: "店舗で2商品を比較する" })).toBeInTheDocument();
    view.unmount();
    renderRoute(<HandoffPage />, "/plans/plan-001/handoff", "/plans/:planId/handoff");
    expect(await screen.findByText("接続前プレビュー")).toBeInTheDocument();
    expect(screen.getAllByText(/Room Harmonyへは送信されません|デモ用プレビュー/).length).toBeGreaterThan(0);
  });
});
