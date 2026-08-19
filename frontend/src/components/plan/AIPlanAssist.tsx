import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { api, track } from "../../api/client";
import type {
  AIPreferenceProfile,
  AIPreferenceProfileInput,
  AISuggestion,
  AIStatus,
  CoordinateDetail,
  FitAssessment,
} from "../../api/types";
import { yen } from "../../utils/labels";
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

function unavailableMessage(status: AIStatus | null): string {
  if (!status || status.reason_code === "DISABLED" || status.reason_code === "KEY_MISSING") {
    return "現在利用できません。API設定なしで起動しています。適合度と通常編集は利用できます。";
  }
  if (status.reason_code === "AUTH_ERROR") {
    return "現在利用できません。API設定を確認してください。適合度と通常編集は利用できます。";
  }
  return "一時的に利用できません。時間をおいて再度お試しください。通常編集は利用できます。";
}

export function AIPlanAssist({ planId, plan, onApplied }: {
  planId: string;
  plan: CoordinateDetail;
  onApplied: (updated: CoordinateDetail) => void;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [profile, setProfile] = useState<AIPreferenceProfile | null>(null);
  const [fit, setFit] = useState<FitAssessment | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ before: number; after: number; title: string; change: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

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
      const change = `${suggestion.target?.name ?? "現在のPLAN"} → ${suggestion.proposed_product?.name ?? (suggestion.action === "REMOVE" ? "PLANから外す" : "そのまま残す")}`;
      setResult({ before: response.before_fit.overall_score, after: response.after_fit.overall_score, title: suggestion.title, change });
      await track("ai_suggestion_apply", { coordinate_id: planId, product_id: suggestion.proposed_product?.product_id, properties: { strategy: suggestion.strategy, action: suggestion.action, before_score_bucket: scoreBucket(response.before_fit.overall_score), after_score_bucket: scoreBucket(response.after_fit.overall_score) } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "提案を反映できませんでした");
      void track("ai_suggestion_reject", { coordinate_id: planId, properties: { strategy: suggestion.strategy, action: suggestion.action } });
    } finally { setBusy(false); }
  }

  return (
    <section className="ai-assist-card" aria-labelledby="ai-assist-title">
      <p className="eyebrow">AI PLAN Assist</p>
      <h2 id="ai-assist-title">あなた向けPLAN適合度</h2>
      {fit ? <><strong className="ai-assist-card__score">{fit.overall_score}<small>/100</small></strong><p>{fit.summary}</p></> : <p>適合度を計算しています…</p>}
      <p>入力条件との適合度です。正解や美しさの採点ではありません。</p>
      <button className="button button--secondary" onClick={openWorkspace}>AIと一緒に調整する</button>
      {open && createPortal((
        <div className="ai-drawer-layer">
          <button className="ai-drawer-backdrop" aria-label="AI PLAN Assistを閉じる" onClick={() => setOpen(false)} />
          <div className="ai-drawer" role="dialog" aria-modal="true" aria-labelledby="ai-drawer-title">
            <header><div><p className="eyebrow">Personalized PLAN workspace</p><h2 id="ai-drawer-title">希望から、次の一手を考える</h2></div><button autoFocus className="ai-drawer__close" aria-label="閉じる" onClick={() => setOpen(false)}>×</button></header>
            <p className="ai-disclosure">この適合度は正解や美しさの点数ではなく、入力した条件と現在のPLANのルール計算です。文章と候補選択だけがAIで、自動変更はしません。</p>
            {profile && (
              <section className="ai-profile" aria-labelledby="ai-profile-title">
                <h3 id="ai-profile-title">1. AIが参考にするあなたの条件</h3>
                <div className="ai-profile-grid">
                  <label>部屋の広さ<select value={profile.room_size} onChange={(e) => update("room_size", e.target.value as AIPreferenceProfileInput["room_size"])}><option value="TINY_5_5">5.5畳前後</option><option value="SMALL_6">6畳前後</option><option value="MEDIUM_7_8">7〜8畳</option></select></label>
                  <label>住まい<select value={profile.housing_type} onChange={(e) => update("housing_type", e.target.value as AIPreferenceProfileInput["housing_type"])}><option value="RENTAL">賃貸</option><option value="OWNED">持ち家</option><option value="OTHER">その他</option></select></label>
                  <label>予算上限<input type="number" min={1000} max={1000000} step={1000} value={profile.budget_max ?? ""} onChange={(e) => update("budget_max", e.target.value ? Number(e.target.value) : null)} /></label>
                  <label>好み<select value={profile.preferred_style ?? ""} onChange={(e) => update("preferred_style", (e.target.value || null) as AIPreferenceProfileInput["preferred_style"])}><option value="">未選択</option><option value="NATURAL">ナチュラル</option><option value="CLEAR_COOL">クリアクール</option><option value="DANDY">ダンディ</option><option value="ELEGANT">エレガント（適合度対象外）</option><option value="COZY">コージー（適合度対象外）</option><option value="COLORFUL">カラフル（適合度対象外）</option></select></label>
                  <label>最優先<select value={profile.priority_focus} onChange={(e) => update("priority_focus", e.target.value as AIPreferenceProfileInput["priority_focus"])}><option value="BALANCED">バランス</option><option value="BUDGET">予算</option><option value="NEEDS">困りごと</option><option value="EXISTING_FURNITURE">手持ち家具</option><option value="STYLE">テイスト</option></select></label>
                </div>
                <fieldset><legend>困りごと（複数可）</legend><div className="ai-need-grid">{NEEDS.map(([value, text]) => <label key={value}><input type="checkbox" checked={profile.needs.includes(value)} onChange={(e) => update("needs", e.target.checked ? [...profile.needs, value] : profile.needs.filter((item) => item !== value))} />{text}</label>)}</div></fieldset>
                <label className="ai-check"><input type="checkbox" checked={profile.preserve_existing_furniture} onChange={(e) => update("preserve_existing_furniture", e.target.checked)} />手持ち家具を残す前提で考える</label>
                <button className="button button--secondary" disabled={busy} onClick={() => void savePreferences()}>希望条件を保存して再計算</button>
              </section>
            )}
            {fit && <section aria-labelledby="fit-title"><h3 id="fit-title">2. 現在の適合度</h3><FitRadar fit={fit} /></section>}
            <section aria-labelledby="suggestion-title">
              <h3 id="suggestion-title">3. AIによる提案（プロトタイプ）</h3>
              {!status?.available && <p className="ai-status-note">AI提案は停止中です。{unavailableMessage(status)}</p>}
              <button className="button button--primary" disabled={busy || !status?.available || !profile} onClick={() => void createSuggestions()}>{busy ? "確認中…" : "この希望でAI提案をつくる"}</button>
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
    </section>
  );
}
