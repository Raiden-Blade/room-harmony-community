import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api, track } from "../api/client";
import type { HandoffPayload } from "../api/types";
import { Badge } from "../components/common/Badge";
import { ErrorView, Loading } from "../components/common/StatusView";
import { useAsync } from "../hooks/useAsync";
import { yen } from "../utils/labels";

export function HandoffPage() {
  const { planId = "" } = useParams();
  const plan = useAsync(() => api.plan(planId), [planId]);
  const [preview, setPreview] = useState<HandoffPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plan.data) return;
    void api.handoff(plan.data.id).then(setPreview).catch((reason) => setError(reason instanceof Error ? reason.message : "Previewを作れませんでした"));
  }, [plan.data?.id]);

  useEffect(() => {
    if (!preview) return;
    void track("store_action", { coordinate_id: preview.coordinate_id, properties: { destination: "ROOM_HARMONY_PREVIEW", product_count: preview.product_ids.length } });
    void track("room_harmony_handoff", { coordinate_id: preview.coordinate_id, properties: { destination: "PREVIEW_ONLY", product_count: preview.product_ids.length } });
  }, [preview?.handoff_id]);

  if (plan.loading) return <Loading />;
  if (plan.error || !plan.data) return <ErrorView message={plan.error || "PLANが見つかりません"} />;

  return (
    <div className="page-shell handoff-page">
      <Link className="back-link" to={`/plans/${plan.data.id}`}>← PLANへ戻る</Link>
      <header className="page-intro">
        <div className="badge-row"><Badge tone="warning">PREVIEW ONLY</Badge><Badge>LIVE接続なし</Badge></div>
        <p className="eyebrow">Room Harmony handoff</p>
        <h1>店舗で{plan.data.product_count}商品を比較する</h1>
        <p>実際のRoom Harmonyは開きません。どの商品と目的を渡すか、安全なContractとして確認します。</p>
      </header>
      {error && <ErrorView message={error} />}
      {!preview && !error && <Loading label="Handoff Previewを作っています" />}
      {preview && (
        <div className="handoff-layout">
          <section className="handoff-summary" aria-labelledby="handoff-summary-title">
            <h2 id="handoff-summary-title">共有する内容</h2>
            <dl>
              <div><dt>目的</dt><dd>店舗で選択商品を比較する</dd></div>
              <div><dt>商品</dt><dd>{preview.product_ids.length}件</dd></div>
              <div><dt>概算</dt><dd>{yen(plan.data.price.known_total)}（デモ）</dd></div>
              <div><dt>PLAN ID</dt><dd>{plan.data.id}</dd></div>
            </dl>
            <h3>共有しないもの</h3>
            <ul className="check-list"><li>氏名・メール・住所</li><li>部屋の自由記述や写真</li><li>購入履歴・会員ID</li></ul>
            <div className="handoff-status"><span aria-hidden="true">✓</span><div><strong>境界を確認しました</strong><p>{preview.notice}</p></div></div>
          </section>
          <aside className="handoff-contract">
            <p className="eyebrow">Contract v{preview.schema_version}</p>
            <h2>Payload Preview</h2>
            <pre aria-label="Room Harmony handoff payload">{JSON.stringify(preview, null, 2)}</pre>
          </aside>
        </div>
      )}
      <div className="handoff-actions">
        <Link className="button button--primary" to={`/plans/${plan.data.id}`}>PLANを保持して戻る</Link>
        <p>本番接続は承認済みProduct ID mappingと正式API契約の後にのみ実装します。</p>
      </div>
    </div>
  );
}
