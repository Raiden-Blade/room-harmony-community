import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { api, track, trackOnce } from "../api/client";
import { CoordinateCard } from "../components/coordinate/CoordinateCard";
import { EmptyView, ErrorView, Loading } from "../components/common/StatusView";
import { useAsync } from "../hooks/useAsync";

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "similar";
  const [roomSize, setRoomSize] = useState(searchParams.get("room_size") || "SMALL_6");
  const [need, setNeed] = useState(searchParams.get("need") || "STORAGE");
  const [budget, setBudget] = useState(searchParams.get("budget_max") || "50000");
  const options = useAsync(() => api.options(), []);
  const requestParams = useMemo(() => {
    const next = new URLSearchParams({ mode, limit: "18" });
    if (mode === "similar") {
      next.set("room_size", searchParams.get("room_size") || "SMALL_6");
      next.set("need", searchParams.get("need") || "STORAGE");
      next.set("budget_max", searchParams.get("budget_max") || "50000");
    }
    return next;
  }, [mode, searchParams]);
  const discovery = useAsync(() => api.discover(requestParams), [requestParams.toString()]);
  const detailQuery = mode === "similar"
    ? new URLSearchParams({
        room_size: searchParams.get("room_size") || "SMALL_6",
        need: searchParams.get("need") || "STORAGE",
        budget_max: searchParams.get("budget_max") || "50000",
      }).toString()
    : "";

  useEffect(() => {
    if (!discovery.data) return;
    discovery.data.results.forEach((coordinate, rank) => {
      trackOnce(`discovery-impression:${mode}:${requestParams.toString()}:${coordinate.id}`, "discovery_impression", {
        coordinate_id: coordinate.id,
        comparison_condition: discovery.data?.comparison_condition,
        properties: { mode, rank: rank + 1, match_dimension_count: coordinate.match_reasons.length },
      });
    });
  }, [discovery.data, mode]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams({ mode: "similar", room_size: roomSize, need, budget_max: budget });
    setSearchParams(next);
    void track("context_select", {
      comparison_condition: "similar",
      properties: { room_size: roomSize, need, budget_max: Number(budget) },
    });
  }

  function setMode(nextMode: string) {
    const next = new URLSearchParams(searchParams);
    next.set("mode", nextMode);
    setSearchParams(next);
  }

  return (
    <div className="page-shell">
      <header className="page-intro">
        <p className="eyebrow">Explore</p>
        <h1>あなたの条件に近いコーデ</h1>
        <p>人気だけでなく、部屋・困りごと・予算の一致を優先します。</p>
      </header>

      <div className="explore-tabs" role="tablist" aria-label="表示基準">
        <button role="tab" aria-selected={mode === "similar"} onClick={() => setMode("similar")}>あなたに近い</button>
        <button role="tab" aria-selected={mode === "popular"} onClick={() => setMode("popular")}>編集部ピック</button>
        <button role="tab" aria-selected={mode === "newlife"} onClick={() => setMode("newlife")}>新生活2027</button>
      </div>

      {mode === "similar" && (
        <form className="filter-panel" onSubmit={submit} aria-label="近いコーデの条件">
          <label>部屋の広さ
            <select aria-label="部屋の広さ" value={roomSize} onChange={(event) => setRoomSize(event.target.value)}>
              {options.data?.room_sizes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>いちばんの困りごと
            <select aria-label="いちばんの困りごと" value={need} onChange={(event) => setNeed(event.target.value)}>
              {options.data?.needs.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>購入予算の目安
            <select aria-label="購入予算の目安" value={budget} onChange={(event) => setBudget(event.target.value)}>
              {options.data?.budgets.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button className="button button--primary" type="submit">この条件で探す</button>
        </form>
      )}

      <div className="result-summary" aria-live="polite">
        <strong>{discovery.data?.results.length || 0}件</strong>
        <span>{mode === "similar" ? "条件一致をルールで並べています" : mode === "popular" ? "比較用のBaseline表示です" : "新生活向けの編集コレクションです"}</span>
      </div>
      {discovery.loading && <Loading label="近い暮らしを探しています" />}
      {discovery.error && <ErrorView message={discovery.error} action={<button onClick={discovery.refresh}>再試行</button>} />}
      {discovery.data && discovery.data.results.length === 0 && (
        <EmptyView title="この条件に合うコーデはまだありません">
          <p>条件を変えるか、編集部ピックから近い事例を探してみてください。</p>
          <button className="button button--secondary" onClick={() => setMode("popular")}>編集部ピックを見る</button>
        </EmptyView>
      )}
      <section className="coordinate-grid" aria-label="コーディネート一覧">
        {discovery.data?.results.map((coordinate) => (
          <CoordinateCard
            key={coordinate.id}
            coordinate={coordinate}
            detailQuery={detailQuery}
            showMatchReasons={mode === "similar"}
          />
        ))}
      </section>
    </div>
  );
}
