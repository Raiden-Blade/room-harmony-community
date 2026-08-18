export type PriceSummary = {
  known_total: number;
  unknown_item_count: number;
  calculated_at: string;
  currency: "JPY";
  status: "DEMO_SNAPSHOT" | "PARTIAL_DEMO_SNAPSHOT";
  notice: string;
};

export type ProductSummary = {
  id: string;
  name: string;
  category: string;
  default_role: string;
  price_snapshot: number | null;
  price_status: string;
  price_observed_at: string | null;
  official_url: string;
  image_url: string;
  provenance: string;
  rights_status: string;
};

export type CoordinateItem = {
  id: number;
  role: string;
  source: string;
  quantity: number;
  price_snapshot: number | null;
  price_observed_at: string | null;
  existing_label: string | null;
  dimensions: string | null;
  mutation_state: string;
  product: ProductSummary | null;
};

export type CoordinateSummary = {
  id: string;
  kind: "PLAN" | "REAL";
  status: string;
  title: string;
  description: string;
  room_type: string;
  size_band: string;
  housing_type: string;
  household: string;
  budget_band: string;
  budget_max: number;
  style: string;
  needs: string[];
  provenance: string;
  verification_state: string;
  creator_display: string;
  creator_type: string;
  image_url: string;
  image_rights: string;
  demo_disclosure: string;
  seasonal_collection: string | null;
  official_pick: boolean;
  price: PriceSummary;
  product_count: number;
  category_count: number;
  match_reasons: string[];
  score: number | null;
  is_saved: boolean;
};

export type CoordinateDetail = CoordinateSummary & {
  parent_coordinate_id: string | null;
  owner_session_id: string | null;
  items: CoordinateItem[];
  creator_impact_slot: {
    enabled: boolean;
    helpful_count: number | null;
    saved_count: number | null;
    adaptation_count: number | null;
  };
};

export type ProductDetail = ProductSummary & { coordinates: CoordinateSummary[] };

export type DiscoveryResponse = {
  mode: "similar" | "popular" | "newlife";
  experiment_group: "similar" | "popular";
  context: Record<string, string | number | null>;
  results: CoordinateSummary[];
};

export type HandoffPayload = {
  schema_version: "1.0";
  handoff_id: string;
  source: "room-harmony-community";
  coordinate_id: string;
  coordinate_kind: "PLAN";
  product_ids: string[];
  anchor_product_id: string;
  store_id: string | null;
  intent: "COMPARE_IN_STORE";
  return_url: string;
  expires_at: string;
  live_integration: false;
  notice: string;
};

export type OptionsResponse = {
  room_sizes: Array<{ value: string; label: string }>;
  needs: Array<{ value: string; label: string }>;
  budgets: Array<{ value: number; label: string }>;
  styles: Array<{ value: string; label: string }>;
};

export type AnalyticsEventName =
  | "session_start"
  | "home_view"
  | "context_select"
  | "discovery_impression"
  | "coordinate_view"
  | "match_reason_view"
  | "product_view"
  | "product_to_coordinate"
  | "coordinate_save"
  | "plan_start"
  | "plan_item_keep"
  | "plan_item_replace"
  | "plan_item_add"
  | "existing_furniture_add"
  | "plan_ready"
  | "ec_action"
  | "store_action"
  | "room_harmony_handoff"
  | "creator_coordinate_impression"
  | "creator_attributed_save"
  | "creator_attributed_plan_start";
