import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { api, track } from "../../api/client";
import type {
  AIPreferenceProfile,
  AIPreferenceProfileInput,
  AISuggestion,
  AIStatus,
  AIVisualReview,
  CoordinateDetail,
  FitAssessment,
  PlanVisualLayout,
  VisualLayoutItem,
} from "../../api/types";
import { label, yen } from "../../utils/labels";
import { SafeImage } from "../common/SafeImage";
import { CompositionStudio } from "./CompositionStudio";
import { FitRadar } from "./FitRadar";

const NEEDS: Array<[AIPreferenceProfileInput["needs"][number], string]> = [
  ["STORAGE", "収納を増やしたい"], ["LOW_BUDGET", "予算を抑えたい"], ["WORK_FROM_HOME", "在宅作業"],
  ["RELAX", "くつろぎ"], ["SLEEP", "眠り"], ["COMPACT", "省スペース"],
];
const STRATEGY_LABEL = { PREFERENCE_SAFE: "希望優先", BALANCED: "バランス", DISCOVERY: "新しい選択肢" } as const;
const ACTION_LABEL = { KEEP: "残す", REPLACE: "置き換える", ADD: "追加する", REMOVE: "外す" } as const;

function inputProfile(profile: AIPreferenceProfile): AIPreferenceProfileInput {
  const { source: _source, ...input } = profile;
  return input;
}

function scoreBucket(score: number): "LOW" | "MEDIUM" | "HIGH" {
  if (score < 50) return "LOW";
  if (score < 80) return "MEDIUM";
  return "HIGH";
}

function providerStatusMessage(status: AIStatus | null): string {
  if (!status) return "API接続状態を確認しています。";
  switch (status.reason_code) {
    case "NOT_CHECKED":
      return "API接続はまだ確認されていません。最初の調整案生成時に確認します。";
    case "DISABLED":
    case "KEY_MISSING":
      return "API設定なしで起動しています。適合度と通常編集は利用できます。";
    case "AUTH_ERROR":
      return "APIキーを確認してください。適合度と通常編集は利用できます。";
    case "RATE_LIMITED":
      return "APIのリクエスト上限に達しました。少し待って再試行できます。";
    case "QUOTA_EXCEEDED":
      return "API利用枠または請求設定を確認してください。";
    case "MODEL_ERROR":
      return "設定したモデル名またはモデル利用権限を確認してください。";
    case "REQUEST_ERROR":
      return "モデル名または構造化出力のリクエスト設定を確認してください。";
    case "PROVIDER_ERROR":
      return "前回はAIサービスへ接続できませんでした。再試行できます。";
    default:
      return "API接続を確認済みです。";
  }
}

const REVIEW_AXIS_LABEL: Record<FitAssessment["axes"][number]["code"], string> = {
  BUDGET: "予算との一致",
  NEEDS: "困りごとへの対応",
  EXISTING_FURNITURE: "手持ち家具との相性",
  STYLE: "好みとの一致",
  COMPOSITION: "商品役割のバランス",
};

function evidenceText(axis: FitAssessment["axes"][number]) {
  return axis.evidence[0] ?? axis.reason;
}

function coordinateReview(fit: FitAssessment, suggestions: AISuggestion[]) {
  const scored = fit.axes
    .filter((axis): axis is typeof axis & { score: number } => axis.available && axis.score !== null)
    .sort((left, right) => right.score - left.score);
  const strongest = scored[0];
  const weakest = scored[scored.length - 1];
  const firstSuggestion = suggestions[0];

  return {
    generated: Boolean(firstSuggestion),
    positive: strongest
      ? `「${REVIEW_AXIS_LABEL[strongest.code]}」が現在もっとも希望に近い状態です。${evidenceText(strongest)}`
      : "入力済みの条件から評価できる項目を準備しています。",
    concern: firstSuggestion
      ? firstSuggestion.tradeoff
      : weakest
        ? `次に確認したいのは「${REVIEW_AXIS_LABEL[weakest.code]}」です。${evidenceText(weakest)}`
        : "評価できない項目は、希望条件を追加すると確認できます。",
    next: firstSuggestion
      ? firstSuggestion.rationale
      : "配置画面では、現在のPLANを自動変更せずに、見た目の確認と置き換え・追加候補の相談へ進めます。",
  };
}

export function AIPlanAssist({ planId, plan, onApplied }: {
  planId: string;
  plan: CoordinateDetail;
  onApplied: (updated: CoordinateDetail) => void;
}) {
  const [open, setOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [profile, setProfile] = useState<AIPreferenceProfile | null>(null);
  const [fit, setFit] = useState<FitAssessment | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ before: number; after: number; title: string; change: string } | null>(null);
  const [visualReview, setVisualReview] = useState<AIVisualReview | null>(null);
  const [visualImage, setVisualImage] = useState<string | null>(null);
  const [visualLayout, setVisualLayout] = useState<PlanVisualLayout | null>(null);
  const [layoutLoading, setLayoutLoading] = useState(false);

  useEffect(() => {
    if (!open && !studioOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (studioOpen) setStudioOpen(false);
      else setOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, studioOpen]);

  useEffect(() => {
    let active = true;
    void Promise.all([api.aiStatus(), api.aiProfile(planId)]).then(([nextStatus, nextProfile]) => {
      if (!active) return;
      setStatus(nextStatus); setProfile(nextProfile);
    }).catch((reason) => active && setError(reason instanceof Error ? reason.message : "適合度を読み込めませんでした"));
    return () => { active = false; };
  }, [planId]);

  useEffect(() => {
    void api.planFit(planId).then(setFit).catch(() => undefined);
  }, [plan, planId]);

  useEffect(() => {
    setVisualReview(null);
    setVisualImage(null);
    setVisualLayout(null);
  }, [plan.items]);

  function update<K extends keyof AIPreferenceProfileInput>(key: K, value: AIPreferenceProfileInput[K]) {
    setProfile((current) => current ? { ...current, [key]: value } : current);
    setSuggestions([]); setResult(null);
  }

  function openWorkspace() {
    setOpen(true);
    void track("ai_assist_open", { coordinate_id: planId });
    if (fit) void track("fit_score_view", { coordinate_id: planId, properties: { before_score_bucket: scoreBucket(fit.overall_score) } });
    if (status && !status.available) {
      void track("ai_provider_unavailable", { coordinate_id: planId, properties: { provider_status: status.reason_code } });
    }
  }

  async function openComposition() {
    setLayoutLoading(true);
    void track("ai_assist_open", { coordinate_id: planId });
    try {
      setVisualLayout(await api.planVisualLayout(planId));
    } catch (reason) {
      setVisualLayout({ plan_id: planId, version: 0, status: "NOT_SAVED", updated_at: null, layout_items: [] });
      setError(reason instanceof Error ? reason.message : "保存済みの配置を読み込めませんでした");
    } finally {
      setLayoutLoading(false);
      setStudioOpen(true);
    }
  }

  function openProductWorkspaceFromComposition() {
    setStudioOpen(false);
    openWorkspace();
  }

  async function analyzeComposition(imageDataUrl: string, layoutItems: VisualLayoutItem[]) {
    try {
      const response = await api.aiVisualReview(planId, imageDataUrl, layoutItems);
      setVisualImage(imageDataUrl);
      setVisualReview(response);
      setStatus((current) => current ? { ...current, available: true, verified: true, reason_code: "READY" } : current);
      return response;
    } catch (reason) {
      void api.aiStatus().then(setStatus).catch(() => undefined);
      throw reason;
    }
  }

  function saveComposition(baseVersion: number, layoutItems: VisualLayoutItem[]) {
    return api.savePlanVisualLayout(planId, baseVersion, layoutItems);
  }

  async function savePreferences() {
    if (!profile) return;
    setBusy(true); setError(null);
    try {
      const saved = await api.saveAIProfile(inputProfile(profile));
      const nextFit = await api.planFit(planId);
      setProfile(saved); setFit(nextFit); setSuggestions([]);
      await track("ai_profile_update", { coordinate_id: planId, properties: { priority_focus: saved.priority_focus } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "希望条件を保存できませんでした");
    } finally { setBusy(false); }
  }

  async function createSuggestions() {
    if (!profile || !status?.available) return;
    setBusy(true); setError(null); setResult(null);
    void track("ai_suggestion_request", { coordinate_id: planId, properties: { provider_status: status.reason_code } });
    try {
      const response = await api.aiSuggestions(planId, inputProfile(profile));
      setProfile(response.profile); setFit(response.current_fit); setSuggestions(response.suggestions);
      setStatus((current) => current ? { ...current, available: true, verified: true, reason_code: "READY" } : current);
      await track("ai_suggestion_received", { coordinate_id: planId, properties: { suggestion_count: response.suggestions.length } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "AI提案を作成できませんでした");
      void track("ai_provider_unavailable", { coordinate_id: planId, properties: { provider_status: "PROVIDER_ERROR" } });
      void api.aiStatus().then(setStatus).catch(() => undefined);
    } finally { setBusy(false); }
  }

  async function applySuggestion(suggestion: AISuggestion) {
    setBusy(true); setError(null);
    try {
      const response = await api.applyAISuggestion(planId, suggestion.id);
      onApplied(response.plan); setFit(response.after_fit); setSuggestions([]);
      setVisualReview(null); setVisualImage(null);
      const change = `${suggestion.target?.name ?? "現在のPLAN"} → ${suggestion.proposed_product?.name ?? (suggestion.action === "REMOVE" ? "PLANから外す" : "そのまま残す")}`;
      setResult({ before: response.before_fit.overall_score, after: response.after_fit.overall_score, title: suggestion.title, change });
      await track("ai_suggestion_apply", { coordinate_id: planId, product_id: suggestion.proposed_product?.product_id, properties: { strategy: suggestion.strategy, action: suggestion.action, before_score_bucket: scoreBucket(response.before_fit.overall_score), after_score_bucket: scoreBucket(response.after_fit.overall_score) } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "提案を反映できませんでした");
      void track("ai_suggestion_reject", { coordinate_id: planId, properties: { strategy: suggestion.strategy, action: suggestion.action } });
    } finally { setBusy(false); }
  }

  const productItems = plan.items.filter((item) => item.product);
  const review = fit ? coordinateReview(fit, suggestions) : null;

  return (
    <section className="ai-assist-card" aria-labelledby="ai-assist-title">
      <header className="ai-assist-card__header">
        <div><p className="eyebrow">Current PLAN insight</p><h2 id="ai-assist-title">現在のPLANを、空間として確かめる</h2></div>
        <ul className="ai-assist-card__meta" aria-label="PLANの条件">
          <li>{label(plan.size_band)}</li><li>{label(plan.style)}</li><li>{yen(plan.price.known_total)}</li>
        </ul>
      </header>
      <div className="ai-assist-card__workspace">
        <section className="plan-moodboard" aria-labelledby="plan-moodboard-title">
          <div className="plan-moodboard__heading"><div><p className="eyebrow">Coordinate image</p><h3 id="plan-moodboard-title">コーディネートイメージ</h3></div><span>参考</span></div>
          <div className="plan-moodboard__media">
            <SafeImage src={plan.image_url} alt="PLANのベースとなったコーディネート参考画像" fallbackLabel="参考画像を表示できないため、代替画像を表示中" />
          </div>
          <div className="plan-product-strip" aria-label="現在のPLANに含まれる商品">
            {productItems.slice(0, 5).map((item) => <figure key={item.id}>
              <SafeImage src={item.product!.image_url} fallbackSrc="/assets/product-fallback.svg" alt={`${item.product!.name}の商品画像`} />
              <figcaption>{label(item.role)}</figcaption>
            </figure>)}
            {productItems.length > 5 && <span className="plan-product-strip__more">ほか{productItems.length - 5}商品</span>}
          </div>
          <p className="plan-moodboard__note">上は元コーデの参考画像です。現在選択中の商品は下の商品画像で確認できます。</p>
        </section>
        {fit ? <FitRadar fit={fit} /> : <div className="fit-radar fit-radar--loading">希望との適合傾向を計算しています…</div>}
      </div>
      <section className="plan-review" aria-labelledby="plan-review-title">
        <div className="plan-review__heading">
          <div><p className="eyebrow">{review?.generated ? "AI coordinate review" : "PLAN insight"}</p><h3 id="plan-review-title">{review?.generated ? "AIからのコーディネート所見" : "現在のPLAN分析"}</h3></div>
          <span>{review?.generated ? "AI生成" : "ルール分析"}</span>
        </div>
        {review ? <div className="plan-review__grid">
          <article><span>良い点</span><p>{review.positive}</p></article>
          <article><span>確認したい点</span><p>{review.concern}</p></article>
          <article><span>次の一手</span><p>{review.next}</p></article>
        </div> : <p>PLANの条件を読み込んでいます。</p>}
        <div className="plan-review__actions">
          <p>自分で配置を試したあと、同じ画面でAIの視覚評価や商品候補の相談へ進めます。確認なくPLANを変更することはありません。</p>
          <div className="plan-review__buttons">
            <button className="button button--primary" disabled={layoutLoading} onClick={() => void openComposition()}>{layoutLoading ? "保存済み配置を確認中…" : "AIと一緒に配置イメージを試す"}</button>
          </div>
        </div>
      </section>
      {visualReview && visualImage && <section className="visual-review" aria-labelledby="visual-review-title">
        <header className="visual-review__heading">
          <div><p className="eyebrow">AI visual feedback</p><h3 id="visual-review-title">あなたの配置から見えたこと</h3></div>
          <span>画像を確認</span>
        </header>
        <div className="visual-review__layout">
          <figure>
            <img src={visualImage} alt="ユーザーが配置した商品の2Dイメージ" />
            <figcaption>今回AIに渡した配置画像</figcaption>
          </figure>
          <div>
            <p className="visual-review__summary">{visualReview.summary}</p>
            <div className="visual-observation-list">
              {visualReview.observations.map((observation) => <article key={observation.code}>
                <header><h4>{observation.label}</h4><span>{observation.confidence === "HIGH" ? "確度 高" : observation.confidence === "MEDIUM" ? "確度 中" : "参考程度"}</span></header>
                <p>{observation.observation}</p>
                <dl><div><dt>画像上の根拠</dt><dd>{observation.evidence}</dd></div><div><dt>試せる変更</dt><dd>{observation.suggestion}</dd></div></dl>
              </article>)}
            </div>
            <p className="visual-review__next"><strong>次の一手</strong>{visualReview.next_action}</p>
          </div>
        </div>
        <footer><p>{visualReview.disclaimer}</p><div><button className="button button--secondary" onClick={() => void openComposition()}>配置をもう一度調整する</button><button className="button button--primary" onClick={openWorkspace}>商品候補をAIと相談する</button></div></footer>
      </section>}
      {open && createPortal((
        <div className="ai-drawer-layer">
          <button className="ai-drawer-backdrop" aria-label="AI PLAN Assistを閉じる" onClick={() => setOpen(false)} />
          <div className="ai-drawer" role="dialog" aria-modal="true" aria-labelledby="ai-drawer-title">
            <header><div><p className="eyebrow">Personalized PLAN workspace</p><h2 id="ai-drawer-title">希望条件から調整案をつくる</h2></div><button autoFocus className="ai-drawer__close" aria-label="閉じる" onClick={() => setOpen(false)}>×</button></header>
            <p className="ai-disclosure">これはチャット画面ではなく、入力条件から1回ごとに調整案を作る機能です。適合度はルール計算で、AIは文章と候補選択だけを担当し、PLANを自動変更しません。</p>
            {profile && (
              <section className="ai-profile" aria-labelledby="ai-profile-title">
                <h3 id="ai-profile-title">1. AIが参考にするあなたの条件</h3>
                <div className="ai-profile-grid">
                  <label className="ai-field"><span>部屋の広さ</span><select value={profile.room_size} onChange={(e) => update("room_size", e.target.value as AIPreferenceProfileInput["room_size"])}><option value="TINY_5_5">5.5畳前後</option><option value="SMALL_6">6畳前後</option><option value="MEDIUM_7_8">7〜8畳</option></select></label>
                  <label className="ai-field"><span>住まい</span><select value={profile.housing_type} onChange={(e) => update("housing_type", e.target.value as AIPreferenceProfileInput["housing_type"])}><option value="RENTAL">賃貸</option><option value="OWNED">持ち家</option><option value="OTHER">その他</option></select></label>
                  <label className="ai-field"><span>予算上限</span><span className="ai-money-input"><input aria-label="予算上限" type="number" min={1000} max={1000000} step={1000} value={profile.budget_max ?? ""} onChange={(e) => update("budget_max", e.target.value ? Number(e.target.value) : null)} /><small>円</small></span></label>
                  <label className="ai-field"><span>最優先</span><select value={profile.priority_focus} onChange={(e) => update("priority_focus", e.target.value as AIPreferenceProfileInput["priority_focus"])}><option value="BALANCED">バランス</option><option value="BUDGET">予算</option><option value="NEEDS">困りごと</option><option value="EXISTING_FURNITURE">手持ち家具</option><option value="STYLE">テイスト</option></select></label>
                  <label className="ai-field ai-field--wide"><span>好みのテイスト</span><select value={profile.preferred_style ?? ""} onChange={(e) => update("preferred_style", (e.target.value || null) as AIPreferenceProfileInput["preferred_style"])}><option value="">未選択</option><option value="NATURAL">ナチュラル</option><option value="CLEAR_COOL">クリアクール</option><option value="DANDY">ダンディ</option><option value="ELEGANT">エレガント（適合度対象外）</option><option value="COZY">コージー（適合度対象外）</option><option value="COLORFUL">カラフル（適合度対象外）</option></select></label>
                </div>
                <fieldset><legend>困りごと（複数可）</legend><div className="ai-need-grid">{NEEDS.map(([value, text]) => <label className={profile.needs.includes(value) ? "is-selected" : ""} key={value}><input type="checkbox" checked={profile.needs.includes(value)} onChange={(e) => update("needs", e.target.checked ? [...profile.needs, value] : profile.needs.filter((item) => item !== value))} /><span>{text}</span></label>)}</div></fieldset>
                <label className={`ai-check ${profile.preserve_existing_furniture ? "is-selected" : ""}`}><input type="checkbox" checked={profile.preserve_existing_furniture} onChange={(e) => update("preserve_existing_furniture", e.target.checked)} /><span>手持ち家具を残す前提で考える</span></label>
                <button className="button button--secondary" disabled={busy} onClick={() => void savePreferences()}>希望条件を保存して再計算</button>
              </section>
            )}
            {fit && <section aria-labelledby="fit-title"><h3 id="fit-title">2. 希望との適合傾向</h3><FitRadar fit={fit} /></section>}
            <section aria-labelledby="suggestion-title">
              <h3 id="suggestion-title">3. AI調整案（1回ごとの生成）</h3>
              {status && status.reason_code !== "READY" && <p className="ai-status-note"><strong>{status.available ? "接続状態" : "AI調整案は停止中"}</strong><span>{providerStatusMessage(status)}</span></p>}
              <button className="button button--primary" disabled={busy || !status?.available || !profile} onClick={() => void createSuggestions()}>{busy ? "確認中…" : "この条件でAI調整案をつくる"}</button>
              <div className="ai-suggestion-list">{suggestions.map((suggestion) => <article key={suggestion.id}>
                <div className="badge-row"><span className="ai-strategy">{STRATEGY_LABEL[suggestion.strategy]}</span><span>{ACTION_LABEL[suggestion.action]}</span></div>
                <h4>{suggestion.title}</h4><p>{suggestion.rationale}</p>
                <p className="ai-change">{suggestion.target?.name ?? "現在のPLAN"} → {suggestion.proposed_product?.name ?? (suggestion.action === "REMOVE" ? "PLANから外す" : "そのまま残す")}</p>
                <dl><div><dt>購入候補額</dt><dd>{yen(suggestion.before_price)} → {yen(suggestion.after_price)}（{suggestion.price_delta >= 0 ? "+" : ""}{yen(suggestion.price_delta)}）</dd></div><div><dt>適合度</dt><dd>{suggestion.before_fit.overall_score} → {suggestion.after_fit.overall_score}</dd></div></dl>
                <p className="ai-tradeoff">注意：{suggestion.tradeoff}</p>
                <button className="button button--primary" disabled={busy} onClick={() => void applySuggestion(suggestion)}>この提案をPLANに反映</button>
              </article>)}</div>
              {suggestions.length > 0 && <p className="price-caveat">価格は日付付き参照値です。現在価格・在庫を示しません。</p>}
              {result && <p className="ai-apply-result" role="status">「{result.title}」を反映しました。{result.change}。適合度 {result.before} → {result.after}</p>}
              {error && <p className="inline-error" role="alert">{error}</p>}
            </section>
          </div>
        </div>
      ), document.body)}
      {studioOpen && visualLayout && createPortal((
        <CompositionStudio
          plan={plan}
          aiAvailable={Boolean(status?.available)}
          initialLayout={visualLayout.layout_items}
          initialLayoutVersion={visualLayout.version}
          initialReview={visualReview}
          onClose={() => setStudioOpen(false)}
          onAnalyze={analyzeComposition}
          onSave={saveComposition}
          onOpenProductAssist={openProductWorkspaceFromComposition}
        />
      ), document.body)}
    </section>
  );
}
