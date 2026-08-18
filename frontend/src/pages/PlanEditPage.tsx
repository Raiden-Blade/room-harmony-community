import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api, track } from "../api/client";
import type { CoordinateDetail, CoordinateItem, ProductSummary } from "../api/types";
import { Badge } from "../components/common/Badge";
import { ErrorView, Loading } from "../components/common/StatusView";
import { useAsync } from "../hooks/useAsync";
import { dateStamp, label, yen } from "../utils/labels";

export function PlanEditPage() {
  const { planId = "" } = useParams();
  const navigate = useNavigate();
  const plan = useAsync(() => api.plan(planId), [planId]);
  const [alternatives, setAlternatives] = useState<Record<number, ProductSummary[]>>({});
  const [existingLabel, setExistingLabel] = useState("");
  const [existingCategory, setExistingCategory] = useState("SUPPORT_FURNITURE");
  const [dimensions, setDimensions] = useState("");
  const [addRole, setAddRole] = useState("SUPPORT_FURNITURE");
  const [addOptions, setAddOptions] = useState<ProductSummary[]>([]);
  const [addProductId, setAddProductId] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    void api.products(addRole).then((response) => {
      setAddOptions(response.results);
      setAddProductId(response.results[0]?.id || "");
    });
  }, [addRole]);

  async function loadAlternatives(item: CoordinateItem) {
    if (!item.product) return;
    const response = await api.products(item.role, item.product.id);
    setAlternatives((current) => ({ ...current, [item.id]: response.results.slice(0, 4) }));
  }

  async function mutate(action: () => Promise<CoordinateDetail>, eventName: Parameters<typeof track>[0], properties: Record<string, string> = {}) {
    setBusy(true);
    setActionError(null);
    try {
      const updated = await action();
      plan.setData(updated);
      await track(eventName, { coordinate_id: updated.id, properties });
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "更新できませんでした");
    } finally {
      setBusy(false);
    }
  }

  function addExisting(event: FormEvent) {
    event.preventDefault();
    if (!existingLabel.trim()) return;
    void mutate(
      () => api.addExisting(planId, existingLabel.trim(), existingCategory, dimensions.trim()),
      "existing_furniture_add",
      { role: existingCategory },
    ).then(() => { setExistingLabel(""); setDimensions(""); });
  }

  function addProduct(event: FormEvent) {
    event.preventDefault();
    if (!addProductId) return;
    void mutate(() => api.addItem(planId, addProductId, addRole), "plan_item_add", { role: addRole });
  }

  async function finish() {
    setBusy(true);
    try {
      const ready = await api.readyPlan(planId);
      await track("plan_ready", { coordinate_id: ready.id, properties: { product_count: ready.product_count, category_count: ready.category_count } });
      navigate(`/plans/${ready.id}`);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "PLANを確定できませんでした");
      setBusy(false);
    }
  }

  if (plan.loading) return <Loading />;
  if (plan.error || !plan.data) return <ErrorView message={plan.error || "PLANが見つかりません"} />;

  return (
    <div className="page-shell plan-editor">
      <header className="page-intro">
        <p className="eyebrow">Limited adaptation</p>
        <h1>自分向けに変更する</h1>
        <p>残す・1商品を置き換える・買い足す・手持ち家具を加える。フル3D編集ではありません。</p>
      </header>
      <div className="editor-layout">
        <div className="editor-main">
          <section aria-labelledby="edit-products-title">
            <h2 id="edit-products-title">購入候補</h2>
            <div className="editor-items">
              {plan.data.items.filter((item) => item.product).map((item) => (
                <article className="editor-item" key={item.id}>
                  <img src={item.product!.image_url} alt="オリジナルの商品プレースホルダー" />
                  <div className="editor-item__copy">
                    <div className="badge-row"><Badge>{label(item.role)}</Badge><Badge tone={item.mutation_state === "ORIGINAL" ? "quiet" : "accent"}>{label(item.mutation_state)}</Badge></div>
                    <h3>{item.product!.name}</h3><p>{yen(item.price_snapshot)}</p>
                    <div className="inline-actions">
                      <button disabled={busy} onClick={() => void mutate(() => api.keepItem(planId, item.id), "plan_item_keep", { role: item.role })}>この商品を残す</button>
                      <button disabled={busy} onClick={() => void loadAlternatives(item)}>別の商品に変更</button>
                    </div>
                    {alternatives[item.id] && (
                      <div className="alternative-list" aria-label={`${item.product!.name}の置換候補`}>
                        {alternatives[item.id].map((product) => (
                          <button key={product.id} disabled={busy} onClick={() => void mutate(
                            () => api.replaceItem(planId, item.id, product.id),
                            "plan_item_replace",
                            { role: item.role, mutation: "REPLACED" },
                          )}>
                            <span>{product.name}</span><strong>{yen(product.price_snapshot)}</strong>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="editor-form-section" aria-labelledby="existing-title">
            <h2 id="existing-title">すでに持っている家具</h2>
            <p>商品IDは不要です。購入候補額には加えません。</p>
            <form className="inline-form" onSubmit={addExisting}>
              <label>家具の名前<input aria-label="手持ち家具の名前" value={existingLabel} onChange={(event) => setExistingLabel(event.target.value)} maxLength={80} required placeholder="例：今使っているチェア" /></label>
              <label>種類<select aria-label="手持ち家具の種類" value={existingCategory} onChange={(event) => setExistingCategory(event.target.value)}><option value="SUPPORT_FURNITURE">サポート家具</option><option value="STORAGE">収納</option><option value="MAIN_FURNITURE">メイン家具</option><option value="OTHER">その他</option></select></label>
              <label>サイズ（任意）<input aria-label="手持ち家具のサイズ" value={dimensions} onChange={(event) => setDimensions(event.target.value)} maxLength={80} placeholder="例：幅90cm" /></label>
              <button className="button button--secondary" disabled={busy} type="submit">手持ち家具を追加</button>
            </form>
            <div className="existing-list">
              {plan.data.items.filter((item) => item.source === "EXISTING_EXTERNAL").map((item) => <p key={item.id}><strong>{item.existing_label}</strong><span>{label(item.role)} {item.dimensions}</span></p>)}
            </div>
          </section>

          <section className="editor-form-section" aria-labelledby="add-product-title">
            <h2 id="add-product-title">1商品を買い足す</h2>
            <form className="inline-form" onSubmit={addProduct}>
              <label>役割<select aria-label="追加商品の役割" value={addRole} onChange={(event) => setAddRole(event.target.value)}><option value="SUPPORT_FURNITURE">サポート家具</option><option value="STORAGE">収納</option><option value="LIGHTING">照明</option><option value="TEXTILE">ファブリック</option></select></label>
              <label>商品<select aria-label="追加する商品" value={addProductId} onChange={(event) => setAddProductId(event.target.value)}>{addOptions.map((product) => <option key={product.id} value={product.id}>{product.name} — {yen(product.price_snapshot)}</option>)}</select></label>
              <button className="button button--secondary" disabled={busy || !addProductId} type="submit">PLANへ追加</button>
            </form>
          </section>
        </div>

        <aside className="plan-total-card">
          <p className="eyebrow">Estimated total</p>
          <strong>{yen(plan.data.price.known_total)}</strong>
          <span>{plan.data.product_count}商品 · {plan.data.category_count}カテゴリ</span>
          <span>デモ合計再計算 · {dateStamp(plan.data.price.calculated_at)}</span>
          {plan.data.price.unknown_item_count > 0 && <p>価格未取得 {plan.data.price.unknown_item_count}件</p>}
          <p className="price-caveat">デモ価格です。手持ち家具は含みません。</p>
          <button className="button button--primary" disabled={busy} onClick={finish}>この内容で比較準備へ</button>
          {actionError && <p className="inline-error" role="alert">{actionError}</p>}
        </aside>
      </div>
    </div>
  );
}
