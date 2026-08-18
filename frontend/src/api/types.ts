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
  creator_id: string | null;
  image_url: string;
  image_urls: string[];
  image_rights: string;
  demo_disclosure: string;
  seasonal_collection: string | null;
  official_pick: boolean;
  root_coordinate_id: string | null;
  derivation_type: DerivationType | null;
  moderation_status: string;
  price: PriceSummary;
  product_count: number;
  category_count: number;
  match_reasons: string[];
  score: number | null;
  is_saved: boolean;
  helpful_count: number;
  is_helpful: boolean;
  can_edit: boolean;
};

export type DerivationType =
  | "LOWER_BUDGET"
  | "SMALLER_ROOM"
  | "COLOR_VARIATION"
  | "STORAGE_FOCUS"
  | "EXISTING_FURNITURE"
  | "PRODUCT_SUBSTITUTION"
  | "OTHER";

export type CreatorImpact = {
  published_coordinates: number;
  helpful_count: number;
  saved_count: number;
  plan_started_count: number;
  public_adaptation_count: number;
  real_room_contributions: number;
};

export type GenealogyNode = { id: string | null; title: string; kind: "REAL" | "PLAN" | null; available: boolean };

export type Genealogy = {
  parent: GenealogyNode | null;
  root: GenealogyNode | null;
  plan_started_count: number;
  public_adaptation_count: number;
  public_children: GenealogyNode[];
};

export type CoordinateDetail = CoordinateSummary & {
  parent_coordinate_id: string | null;
  remix_note: string | null;
  items: CoordinateItem[];
  creator_impact_slot: {
    enabled: boolean;
    helpful_count: number | null;
    saved_count: number | null;
    adaptation_count: number | null;
  };
  creator_impact: CreatorImpact;
  genealogy: Genealogy;
};

export type CreatorProfile = {
  id: string;
  display_name: string;
  bio: string | null;
  contribution_count: number;
  impact: CreatorImpact;
  created_at: string;
  contributions: CoordinateSummary[];
  is_owner: boolean;
};

export type UploadedImage = {
  id: string;
  url: string;
  mime_type: "image/webp";
  width: number;
  height: number;
  size_bytes: number;
};

export type ProductTagInput = { product_id: string; role: string; quantity: number };
export type ExistingFurnitureInput = { label: string; category: string; dimensions?: string | null };
export type CreateCoordinateInput = {
  kind: "REAL" | "PLAN";
  title: string;
  description?: string | null;
  room_type?: string | null;
  size_band?: string | null;
  housing_type?: string | null;
  household?: string | null;
  budget_max?: number | null;
  style?: string | null;
  needs: string[];
  products: ProductTagInput[];
  existing_furniture: ExistingFurnitureInput[];
  image_ids: string[];
  parent_coordinate_id?: string | null;
  derivation_type?: DerivationType | null;
  remix_note?: string | null;
};

export type ProductDetail = ProductSummary & { coordinates: CoordinateSummary[] };

export type DiscoveryResponse = {
  mode: "similar" | "popular" | "newlife";
  comparison_condition: "similar" | "popular" | "newlife";
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
  | "room_harmony_handoff_preview"
  | "creator_coordinate_impression"
  | "creator_attributed_save"
  | "creator_attributed_plan_start"
  | "creator_profile_view"
  | "create_coordinate_start"
  | "create_coordinate_complete"
  | "real_room_publish"
  | "plan_publish"
  | "helpful_add"
  | "helpful_remove"
  | "adapt_start"
  | "plan_from_coordinate"
  | "public_adaptation_publish"
  | "creator_impact_view"
  | "coordinate_unpublish"
  | "content_report";
