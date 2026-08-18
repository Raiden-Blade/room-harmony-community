import { getSessionId } from "../state/session";
import type {
  AnalyticsEventName,
  CoordinateDetail,
  CoordinateSummary,
  DiscoveryResponse,
  HandoffPayload,
  OptionsResponse,
  ProductDetail,
  ProductSummary,
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
      const body = (await response.json()) as { detail?: string };
      if (body.detail) message = body.detail;
    } catch {
      // Keep the HTTP fallback message.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const api = {
  options: () => request<OptionsResponse>("/api/meta/options"),
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
