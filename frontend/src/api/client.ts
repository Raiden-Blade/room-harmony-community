import { getSessionId } from "../state/session";
import type {
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
  SeasonalLanding,
  UploadedImage,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

type RequestOptions = RequestInit & { json?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("X-Session-ID", getSessionId());
  if (options.json !== undefined) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.json === undefined ? options.body : JSON.stringify(options.json),
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { detail?: string | { reasons?: string[] } };
      if (typeof body.detail === "string") message = body.detail;
      if (body.detail && typeof body.detail === "object" && body.detail.reasons?.length) {
        message = `参加条件を満たしていません（${body.detail.reasons.join(" / ")}）`;
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
  options: () => request<OptionsResponse>("/api/meta/options"),
  seasonal: () => request<SeasonalLanding>("/api/seasonal"),
  challenge: (slug: string) => request<ChallengeDetail>(`/api/challenges/${slug}`),
  enterChallenge: (slug: string, coordinateId: string) =>
    request<ChallengeEntry>(`/api/challenges/${slug}/entries`, {
      method: "POST",
      json: { coordinate_id: coordinateId },
    }),
  discover: (params: URLSearchParams) => request<DiscoveryResponse>(`/api/coordinates?${params}`),
  coordinate: (id: string) => request<CoordinateDetail>(`/api/coordinates/${id}`),
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
