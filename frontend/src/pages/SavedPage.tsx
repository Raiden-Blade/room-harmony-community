import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { api, track } from "../api/client";
import { EmptyView, ErrorView, Loading } from "../components/common/StatusView";
import { SafeImage } from "../components/common/SafeImage";
import { CoordinateCard } from "../components/coordinate/CoordinateCard";
import { useAsync } from "../hooks/useAsync";
import { label, yen } from "../utils/labels";

export function SavedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const aiIntent = searchParams.get("intent") === "ai";
  const collection = useAsync(async () => ({ saved: await api.saved(), plans: await api.plans() }), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function createPlan(coordinateId: string, budgetMax: number) {
    setBusyId(coordinateId);
    setActionError(null);
    try {
      const plan = await api.createPlan(coordinateId, budgetMax);
      await track("plan_start", { coordinate_id: coordinateId });
      navigate(`/plans/${plan.id}/edit`);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "PLANを作れませんでした");
    } finally {
      setBusyId(null);
    }
  }

  if (collection.loading) return <Loading />;
  if (collection.error || !collection.data) return <ErrorView message={collection.error || "読み込めません"} />;

  return (
    <div className="page-shell">
      <header className="page-intro">
        <p className="eyebrow">Saved & My PLAN</p>
        <h1>あとで見る事例と、自分のPLAN</h1>
        <p>Saveは「参考候補」、PLANは「自分の条件へ変え始めたもの」です。</p>
      </header>
      {aiIntent && (
        <aside className="ai-entry-handoff" aria-labelledby="ai-entry-title">
          <p className="eyebrow">AI Room Check</p>
          <h2 id="ai-entry-title">AIと調整するPLANを選ぶ</h2>
          <p>AI評価は単独のChat画面ではなく、商品と配置を持つ自分用PLANの編集画面で行います。</p>
          {collection.data.plans.length === 0
            ? <Link className="button button--primary" to="/explore">元になるコーデを探す</Link>
            : <a className="button button--secondary" href="#plans-title">My PLANから選ぶ</a>}
        </aside>
      )}
      {actionError && <p className="inline-error" role="alert">{actionError}</p>}

      <section className="section section--flush" aria-labelledby="plans-title">
        <div className="section-heading"><div><p className="eyebrow">Private</p><h2 id="plans-title">My PLAN</h2></div></div>
        {collection.data.plans.length === 0 ? (
          <EmptyView title="PLANはまだありません"><p>気になるコーデを見つけて「自分向けにアレンジ」すると、ここに検討用PLANができます。</p><Link className="button button--secondary" to="/explore">元になるコーデを探す</Link></EmptyView>
        ) : (
          <div className="plan-list">
            {collection.data.plans.map((plan) => (
              <article className="plan-row" key={plan.id}>
                <SafeImage src={plan.image_url} alt="PLANの元になったコーディネート画像" />
                <div><p className="eyebrow">{label(plan.status)} · {label(plan.size_band)}</p><h3>{plan.title}</h3><p>{yen(plan.price.known_total)} · {plan.product_count}商品</p></div>
                <Link className="button button--secondary" to={aiIntent ? `/plans/${plan.id}/edit` : `/plans/${plan.id}`}>{aiIntent ? "AIと調整する" : "PLANを確認"}</Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section section--flush" aria-labelledby="saved-title">
        <div className="section-heading"><div><p className="eyebrow">Reference later</p><h2 id="saved-title">保存したコーデ</h2></div><p>Likeではなく、次の検討候補です。</p></div>
        {collection.data.saved.length === 0 ? (
          <EmptyView title="保存したコーデはありません"><Link className="button button--primary" to="/explore">コーデを探す</Link></EmptyView>
        ) : (
          <div className="saved-grid">
            {collection.data.saved.map((coordinate) => (
              <div className="saved-card-wrap" key={coordinate.id}>
                <CoordinateCard coordinate={coordinate} />
                <button className="button button--primary" disabled={busyId === coordinate.id} onClick={() => createPlan(coordinate.id, coordinate.budget_max)}>
                  自分向けに変更する
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
