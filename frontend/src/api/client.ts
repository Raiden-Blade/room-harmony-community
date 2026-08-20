import { getSessionId } from "../state/session";
import type {
  AIApplyResponse,
  AIVisualReview,
  AIPreferenceProfile,
  AIPreferenceProfileInput,
  AISuggestionResponse,
  AIStatus,
  AnalyticsEventName,
  ChallengeDetail,
  ChallengeEntry,
  CoordinateDetail,
  CoordinateSummary,
  CreateCoordinateInput,
  CreatorProfile,
  DerivationType,
  DiscoveryResponse,
  HandoffPayload,
  OptionsResponse,
  ProductDetail,
  ProductSummary,
  PlanVisualLayout,
  SeasonalLanding,
  UploadedImage,
  VisualLayoutItem,
  FitAssessment,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const trackedOnceKeys = new Set<string>();

const SERVER_MESSAGES: Record<string, string> = {
  "Coordinate not found": "コーデが見つかりません。公開状態が変わった可能性があります。",
  "Product not found": "商品が見つかりません。デモデータを再読み込みしてください。",
  "Private PLAN not found": "この端末のセッションではPLANを開けません。作成した端末でお試しください。",
  "Creator profile not found": "クリエイターページが見つかりません。",
  "Challenge not found": "テーマが見つかりません。",
  "Challenge is not active": "このテーマは現在、参加を受け付けていません。",
  "Owned public Coordinate not found": "自分が公開したコーデだけが参加できます。",
  "Coordinate is already entered in this Challenge": "このコーデはすでにテーマへ参加済みです。",
  "Invalid X-Session-ID": "端末内のセッション情報が無効です。ページを再読み込みしてください。",
  "Only JPEG, PNG, and WebP images are accepted": "画像はJPEG・PNG・WebPから選んでください。",
  "Each image must be 8 MB or smaller": "画像は1枚8MB以下にしてください。",
  "Image file is empty": "空の画像ファイルはアップロードできません。",
  "Image content does not match its media type": "画像の形式を確認して、もう一度選んでください。",
  "Image dimensions are too large": "画像の縦横サイズが大きすぎます。小さくしてからお試しください。",
  "The uploaded file is not a decodable image": "画像を読み取れませんでした。別の画像でお試しください。",
  "Create a display identity before publishing": "公開用の表示名を先に設定してください。",
  "A public REAL ROOM requires at least one room image": "REAL ROOMの公開には部屋画像が1枚以上必要です。",
  "Publishing as REAL ROOM requires a room image": "REAL ROOMの公開には部屋画像が必要です。",
  "A derivative Coordinate requires a structured reason": "参考元から変更した理由を選んでください。",
  "A derivation reason requires a parent Coordinate": "変更理由を付けるには、参考元のコーデからアレンジを開始してください。",
  "You cannot mark your own Coordinate as helpful": "自分のコーデには「参考になった」を付けられません。別の利用者からの反応として記録します。",
  "A Coordinate cannot be its own parent": "同じコーデを参考元には設定できません。",
  "Parent Coordinate not found": "参考元のコーデが見つかりません。公開状態が変わった可能性があります。",
  "Coordinate lineage cannot contain a cycle": "参考関係が循環するため、このアレンジは公開できません。",
  "Duplicate product tag": "同じ商品が重複しています。商品を一度だけ選んでください。",
  "Uploaded image not found": "アップロード済み画像が見つかりません。画像を選び直してください。",
  "Unsafe image filename": "画像ファイル名を変更して、もう一度選んでください。",
  "Unsafe upload path": "画像を安全に保存できませんでした。別の画像を選んでください。",
  "PLAN requires at least one product": "PLANには商品を1点以上追加してください。",
  "Replacement product not found": "変更先の商品が見つかりません。候補を選び直してください。",
  "Replacement must use the same product role": "同じ役割の商品から変更先を選んでください。",
  "Role does not match product": "商品の役割が一致しません。別の商品を選んでください。",
  "PLAN item not found": "変更するPLAN商品が見つかりません。画面を再読み込みしてください。",
  "Product already exists in PLAN": "その商品はすでにPLANに含まれています。",
  "Select a different product": "現在とは別の商品を選んでください。",
  "Layout contains duplicate PLAN items": "同じPLAN商品が配置に重複しています。配置画面を開き直してください。",
  "PLAN products changed; reload the layout": "PLANの商品構成が変わりました。配置画面を開き直してください。",
  "PLAN layout was updated; reload before saving": "別の画面で配置が更新されました。配置画面を開き直してください。",
  "Saved PLAN layout is invalid": "保存済みの配置を読み込めませんでした。配置を初期状態からやり直してください。",
  "No products available for handoff": "比較する商品がありません。PLANに商品を追加してください。",
  "Anchor product must be selected in the PLAN": "比較の起点はPLANに含まれる商品から選んでください。",
};

const ELIGIBILITY_MESSAGES: Record<string, string> = {
  ROOM_MISMATCH: "部屋の広さがテーマ条件と一致しません。",
  HOUSEHOLD_MISMATCH: "暮らす人数がテーマ条件と一致しません。",
  HOUSING_MISMATCH: "住まいの種類がテーマ条件と一致しません。",
  BUDGET_MISMATCH: "予算上限がテーマ条件を超えています。",
  KIND_MISMATCH: "コーデの種別がテーマ条件と一致しません。",
  IMAGE_REQUIRED: "このテーマへの参加には画像が必要です。",
  PRODUCT_COUNT_MISMATCH: "テーマで必要な商品点数を満たしていません。",
};

const AI_MESSAGES: Record<string, string> = {
  AI_DISABLED: "AI PLAN Assistは現在無効です。通常のPLAN編集と適合度確認は引き続き使えます。",
  AI_KEY_MISSING: "AI用APIキーが設定されていません。通常のPLAN編集は引き続き使えます。",
  AI_AUTH_ERROR: "AI用APIキーを確認してください。通常のPLAN編集は引き続き使えます。",
  AI_PROVIDER_BUSY: "APIのリクエスト上限に達しました。少し待って再試行してください。",
  AI_PROVIDER_RATE_LIMITED: "APIのリクエスト上限に達しました。少し待って再試行してください。",
  AI_QUOTA_EXCEEDED: "API利用枠または請求設定を確認してください。通常のPLAN編集は引き続き使えます。",
  AI_MODEL_NOT_AVAILABLE: "設定したAIモデル名と利用権限を確認してください。通常のPLAN編集は引き続き使えます。",
  AI_MODEL_ACCESS_ERROR: "設定したAIモデルの利用権限を確認してください。通常のPLAN編集は引き続き使えます。",
  AI_REQUEST_ERROR: "AIリクエスト設定（モデル名・出力形式）を確認してください。通常のPLAN編集は引き続き使えます。",
  AI_TIMEOUT: "AIの応答が時間内に完了しませんでした。もう一度お試しください。",
  AI_CONNECTION_ERROR: "AIサービスへ接続できませんでした。通常のPLAN編集は引き続き使えます。",
  AI_PROVIDER_ERROR: "AIサービスで問題が発生しました。通常のPLAN編集は引き続き使えます。",
  AI_INVALID_RESPONSE: "安全に確認できる提案を作れませんでした。もう一度お試しください。",
  AI_RATE_LIMITED: "短時間の利用上限に達しました。少し待って再試行してください。",
  AI_STALE_PLAN: "PLANまたは希望条件が変わりました。提案を作り直してください。",
  AI_SUGGESTION_EXPIRED: "このAI提案は期限切れです。もう一度提案を作成してください。",
  AI_SUGGESTION_NOT_FOUND: "このAI提案は利用できません。もう一度提案を作成してください。",
  AI_PRODUCT_NOT_ALLOWED: "提案の商品候補を確認できませんでした。",
  AI_INVALID_SUGGESTION: "提案の操作を確認できませんでした。",
  AI_INVALID_IMAGE: "配置画像を読み取れませんでした。配置を元に戻して、もう一度お試しください。",
  AI_INVALID_LAYOUT: "配置商品の対応関係を確認できませんでした。ページを再読み込みしてください。",
};

type RequestOptions = RequestInit & { json?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("X-Session-ID", getSessionId());
  if (options.json !== undefined) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      body: options.json === undefined ? options.body : JSON.stringify(options.json),
    });
  } catch {
    throw new Error("サーバーに接続できません。start-demo.cmdでデモを起動してから、再試行してください。");
  }
  if (!response.ok) {
    let message = response.status === 404
      ? "指定された情報が見つかりません。"
      : response.status === 422
        ? "入力内容を確認してください。"
        : response.status >= 500
          ? "サーバーで問題が発生しました。少し待ってから再試行してください。"
          : `処理を完了できませんでした（${response.status}）。`;
    try {
      const body = (await response.json()) as { detail?: string | Array<{ msg?: string }> | { reasons?: string[]; code?: string } };
      if (typeof body.detail === "string") message = SERVER_MESSAGES[body.detail] || message;
      if (Array.isArray(body.detail)) message = "入力内容を確認してください。必須項目を選び直してから再試行してください。";
      if (body.detail && !Array.isArray(body.detail) && typeof body.detail === "object" && body.detail.reasons?.length) {
        const reasons = body.detail.reasons.map((reason) => ELIGIBILITY_MESSAGES[reason] || reason);
        message = `参加条件を確認してください。${reasons.join(" ")}`;
      }
      if (body.detail && !Array.isArray(body.detail) && typeof body.detail === "object" && body.detail.code) {
        message = AI_MESSAGES[body.detail.code] || message;
      }
    } catch {
      // Keep the HTTP fallback message.
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function mediaUrl(path: string): string {
  return path.startsWith("/uploads/") ? `${API_BASE}${path}` : path;
}

export const api = {
  aiStatus: () => request<AIStatus>("/api/ai/status"),
  aiProfile: (planId: string) => request<AIPreferenceProfile>(`/api/ai/profile?plan_id=${encodeURIComponent(planId)}`),
  saveAIProfile: (profile: AIPreferenceProfileInput) =>
    request<AIPreferenceProfile>("/api/ai/profile", { method: "PUT", json: profile }),
  planFit: (planId: string) => request<FitAssessment>(`/api/plans/${planId}/fit`),
  aiSuggestions: (planId: string, profile?: AIPreferenceProfileInput) =>
    request<AISuggestionResponse>(`/api/plans/${planId}/ai/suggestions`, {
      method: "POST",
      json: { profile: profile || null },
    }),
  applyAISuggestion: (planId: string, suggestionId: string) =>
    request<AIApplyResponse>(`/api/plans/${planId}/ai/apply`, {
      method: "POST",
      json: { suggestion_id: suggestionId },
    }),
  aiVisualReview: (planId: string, imageDataUrl: string, layoutItems: VisualLayoutItem[]) =>
    request<AIVisualReview>(`/api/plans/${planId}/ai/visual-review`, {
      method: "POST",
      json: { image_data_url: imageDataUrl, layout_items: layoutItems },
    }),
  planVisualLayout: (planId: string) => request<PlanVisualLayout>(`/api/plans/${planId}/visual-layout`),
  savePlanVisualLayout: (planId: string, baseVersion: number, layoutItems: VisualLayoutItem[]) =>
    request<PlanVisualLayout>(`/api/plans/${planId}/visual-layout`, {
      method: "PUT",
      json: { base_version: baseVersion, layout_items: layoutItems },
    }),
  options: () => request<OptionsResponse>("/api/meta/options"),
  seasonal: () => request<SeasonalLanding>("/api/seasonal"),
  challenge: (slug: string) => request<ChallengeDetail>(`/api/challenges/${slug}`),
  enterChallenge: (slug: string, coordinateId: string) =>
    request<ChallengeEntry>(`/api/challenges/${slug}/entries`, {
      method: "POST",
      json: { coordinate_id: coordinateId },
    }),
  discover: (params: URLSearchParams) => request<DiscoveryResponse>(`/api/coordinates?${params}`),
  coordinate: (id: string, params?: URLSearchParams) =>
    request<CoordinateDetail>(`/api/coordinates/${id}${params?.size ? `?${params}` : ""}`),
  product: (id: string) => request<ProductDetail>(`/api/products/${id}`),
  products: (role?: string, exclude?: string) => {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (exclude) params.set("exclude", exclude);
    return request<{ results: ProductSummary[] }>(`/api/products?${params}`);
  },
  saved: () => request<CoordinateSummary[]>("/api/saved"),
  save: (id: string) => request<{ saved: boolean }>(`/api/saved/${id}`, { method: "POST" }),
  unsave: (id: string) => request<{ saved: boolean }>(`/api/saved/${id}`, { method: "DELETE" }),
  plans: () => request<CoordinateDetail[]>("/api/plans"),
  plan: (id: string) => request<CoordinateDetail>(`/api/plans/${id}`),
  createPlan: (coordinateId: string, budgetMax?: number) =>
    request<CoordinateDetail>(`/api/plans/from-coordinate/${coordinateId}`, {
      method: "POST",
      json: { budget_max: budgetMax },
    }),
  keepItem: (planId: string, itemId: number) =>
    request<CoordinateDetail>(`/api/plans/${planId}/items/${itemId}/keep`, { method: "POST" }),
  replaceItem: (planId: string, itemId: number, productId: string) =>
    request<CoordinateDetail>(`/api/plans/${planId}/items/${itemId}/replace`, {
      method: "POST",
      json: { product_id: productId },
    }),
  addItem: (planId: string, productId: string, role: string) =>
    request<CoordinateDetail>(`/api/plans/${planId}/items`, {
      method: "POST",
      json: { product_id: productId, role },
    }),
  addExisting: (planId: string, label: string, category: string, dimensions?: string) =>
    request<CoordinateDetail>(`/api/plans/${planId}/existing-furniture`, {
      method: "POST",
      json: { label, category, dimensions: dimensions || null },
    }),
  readyPlan: (planId: string) => request<CoordinateDetail>(`/api/plans/${planId}/ready`, { method: "POST" }),
  handoff: (planId: string, anchorProductId?: string) =>
    request<HandoffPayload>(`/api/plans/${planId}/handoff-preview`, {
      method: "POST",
      json: { anchor_product_id: anchorProductId || null, return_url: `/plans/${planId}` },
    }),
  readiness: () => request<{
    disclaimer: string;
    event_counts: Record<string, number>;
    measurement_support: Record<string, Record<string, number | boolean>>;
  }>("/api/analytics/readiness"),
  creatorMe: () => request<CreatorProfile>("/api/creators/me"),
  saveCreator: (displayName: string, bio: string) =>
    request<CreatorProfile>("/api/creators/me", {
      method: "PUT",
      json: { display_name: displayName, bio: bio || null },
    }),
  creator: (id: string) => request<CreatorProfile>(`/api/creators/${id}`),
  uploadImage: (file: File) => {
    const body = new FormData();
    body.set("image", file);
    return request<UploadedImage>("/api/community/images", { method: "POST", body });
  },
  createCoordinate: (payload: CreateCoordinateInput) =>
    request<CoordinateDetail>("/api/community/coordinates", { method: "POST", json: payload }),
  editCoordinate: (id: string, payload: Partial<CreateCoordinateInput>) =>
    request<CoordinateDetail>(`/api/community/coordinates/${id}`, { method: "PATCH", json: payload }),
  unpublishCoordinate: (id: string) =>
    request<void>(`/api/community/coordinates/${id}`, { method: "DELETE" }),
  helpful: (id: string) =>
    request<{ coordinate_id: string; helpful: boolean; helpful_count: number }>(
      `/api/community/coordinates/${id}/helpful`,
      { method: "POST" },
    ),
  unhelpful: (id: string) =>
    request<{ coordinate_id: string; helpful: boolean; helpful_count: number }>(
      `/api/community/coordinates/${id}/helpful`,
      { method: "DELETE" },
    ),
  report: (id: string, reason: string) =>
    request<{ accepted: boolean }>(`/api/community/coordinates/${id}/reports`, {
      method: "POST",
      json: { reason },
    }),
  publishPlan: (planId: string, kind: "REAL" | "PLAN", derivationType: DerivationType, imageIds: string[], remixNote: string) =>
    request<CoordinateDetail>(`/api/plans/${planId}/publish`, {
      method: "POST",
      json: { kind, derivation_type: derivationType, image_ids: imageIds, remix_note: remixNote || null },
    }),
};

export async function track(
  eventName: AnalyticsEventName,
  context: {
    coordinate_id?: string;
    product_id?: string;
    comparison_condition?: "similar" | "popular" | "newlife";
    properties?: Record<string, string | number>;
  } = {},
): Promise<void> {
  try {
    await request("/api/analytics/events", {
      method: "POST",
      json: { event_name: eventName, ...context, properties: context.properties || {} },
    });
  } catch {
    // Analytics must never block the core demo flow.
  }
}

export function trackOnce(
  key: string,
  eventName: AnalyticsEventName,
  context: Parameters<typeof track>[1] = {},
): void {
  if (trackedOnceKeys.has(key)) return;
  trackedOnceKeys.add(key);
  void track(eventName, context);
}
