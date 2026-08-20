import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";

import { mediaUrl } from "../../api/client";
import type { AIVisualReview, CoordinateDetail, CoordinateItem, PlanVisualLayout, VisualLayoutItem } from "../../api/types";
import { yen } from "../../utils/labels";
import { SafeImage } from "../common/SafeImage";

const STAGE_WIDTH = 760;
const STAGE_HEIGHT = 480;

type StudioItem = VisualLayoutItem & {
  displayIndex: number;
  name: string;
  role: string;
  imageUrl: string;
  price: number | null;
  width: number;
  height: number;
};

type DragState = { itemId: number; offsetX: number; offsetY: number };

const ROLE_SIZE: Record<string, [number, number]> = {
  MAIN_FURNITURE: [210, 135],
  STORAGE: [110, 130],
  SUPPORT_FURNITURE: [120, 100],
  LIGHTING: [92, 80],
  TEXTILE: [210, 80],
};

function startingPoint(role: string, occurrence: number, index: number): [number, number] {
  if (role === "MAIN_FURNITURE") return [405 + occurrence * 22, 305 + occurrence * 16];
  if (role === "STORAGE") return [105 + occurrence * 125, 342 + (occurrence % 2) * 4];
  if (role === "SUPPORT_FURNITURE") return [610 - occurrence * 105, 342];
  if (role === "LIGHTING") return [650 - occurrence * 105, 115];
  if (role === "TEXTILE") return [405 + occurrence * 115, 428];
  return [165 + (index % 4) * 145, 235 + Math.floor(index / 4) * 105];
}

function toStudioItems(items: CoordinateItem[], savedLayout: VisualLayoutItem[]): StudioItem[] {
  const roleCounts: Record<string, number> = {};
  const savedById = new Map(savedLayout.map((item) => [item.item_id, item]));
  return items.filter((item) => item.product).slice(0, 20).map((item, index) => {
    const product = item.product!;
    const occurrence = roleCounts[item.role] || 0;
    roleCounts[item.role] = occurrence + 1;
    const [width, height] = ROLE_SIZE[item.role] || [130, 110];
    const [baseX, baseY] = startingPoint(item.role, occurrence, index);
    const saved = savedById.get(item.id);
    return {
      item_id: item.id,
      product_id: product.id,
      displayIndex: index + 1,
      name: product.name,
      role: item.role,
      imageUrl: mediaUrl(product.image_url),
      price: item.price_snapshot,
      x: saved ? saved.x * STAGE_WIDTH : Math.max(width / 2, Math.min(STAGE_WIDTH - width / 2, baseX)),
      y: saved ? saved.y * STAGE_HEIGHT : Math.max(height / 2, Math.min(STAGE_HEIGHT - height / 2, baseY)),
      scale: saved?.scale ?? 1,
      rotation: saved?.rotation ?? 0,
      visible: saved?.visible ?? true,
      width,
      height,
    };
  });
}

function drawRoundedImage(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - sourceSize) / 2;
  const sourceY = (image.naturalHeight - sourceSize) / 2;
  context.beginPath();
  context.roundRect(-width / 2, -height / 2, width, height, 13);
  context.fillStyle = "rgba(255, 255, 255, .96)";
  context.fill();
  context.clip();
  context.globalAlpha = 0.98;
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, -width / 2, -height / 2, width, height);
  context.globalAlpha = 1;
}

function drawRoom(context: CanvasRenderingContext2D) {
  const wall = context.createLinearGradient(0, 0, 0, 315);
  wall.addColorStop(0, "#f7f5ef");
  wall.addColorStop(1, "#e9eee8");
  context.fillStyle = wall;
  context.fillRect(0, 0, STAGE_WIDTH, 315);

  const floor = context.createLinearGradient(0, 300, 0, STAGE_HEIGHT);
  floor.addColorStop(0, "#d8c7ae");
  floor.addColorStop(1, "#bda789");
  context.fillStyle = floor;
  context.beginPath();
  context.moveTo(0, 294);
  context.lineTo(STAGE_WIDTH, 294);
  context.lineTo(STAGE_WIDTH, STAGE_HEIGHT);
  context.lineTo(0, STAGE_HEIGHT);
  context.closePath();
  context.fill();

  context.strokeStyle = "rgba(112, 94, 70, .18)";
  context.lineWidth = 1;
  for (let index = -4; index < 10; index += 1) {
    context.beginPath();
    context.moveTo(STAGE_WIDTH / 2, 294);
    context.lineTo(index * 115, STAGE_HEIGHT);
    context.stroke();
  }

  context.fillStyle = "#dbe6e4";
  context.strokeStyle = "#b7c7c4";
  context.lineWidth = 8;
  context.fillRect(52, 48, 205, 150);
  context.strokeRect(52, 48, 205, 150);
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(154, 48);
  context.lineTo(154, 198);
  context.moveTo(52, 123);
  context.lineTo(257, 123);
  context.stroke();

  context.fillStyle = "rgba(255, 255, 255, .76)";
  context.fillRect(0, 287, STAGE_WIDTH, 12);
  context.fillStyle = "rgba(33, 70, 59, .72)";
  context.font = "700 13px 'Yu Gothic UI', sans-serif";
  context.fillText("6畳サンプルルーム · 配置イメージ", 20, 26);
}

function withinItem(item: StudioItem, x: number, y: number): boolean {
  if (!item.visible) return false;
  const radians = -item.rotation * Math.PI / 180;
  const dx = x - item.x;
  const dy = y - item.y;
  const localX = dx * Math.cos(radians) - dy * Math.sin(radians);
  const localY = dx * Math.sin(radians) + dy * Math.cos(radians);
  return Math.abs(localX) <= item.width * item.scale / 2 && Math.abs(localY) <= item.height * item.scale / 2;
}

export function CompositionStudio({ plan, aiAvailable, initialLayout, initialLayoutVersion, initialReview, onClose, onAnalyze, onSave, onOpenProductAssist }: {
  plan: CoordinateDetail;
  aiAvailable: boolean;
  initialLayout: VisualLayoutItem[];
  initialLayoutVersion: number;
  initialReview: AIVisualReview | null;
  onClose: () => void;
  onAnalyze: (imageDataUrl: string, items: VisualLayoutItem[]) => Promise<AIVisualReview>;
  onSave: (baseVersion: number, items: VisualLayoutItem[]) => Promise<PlanVisualLayout>;
  onOpenProductAssist: () => void;
}) {
  const initialItems = useMemo(() => toStudioItems(plan.items, initialLayout), [plan.items, initialLayout]);
  const [items, setItems] = useState<StudioItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<number | null>(initialItems[0]?.item_id ?? null);
  const [history, setHistory] = useState<StudioItem[][]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [version, setVersion] = useState(initialLayoutVersion);
  const [activePanel, setActivePanel] = useState<"PRODUCTS" | "AI">("PRODUCTS");
  const [review, setReview] = useState<AIVisualReview | null>(initialReview);
  const [previewBase, setPreviewBase] = useState<StudioItem[] | null>(null);
  const [savedMessage, setSavedMessage] = useState(initialLayout.length ? "保存済みの配置を復元しました" : "まだ保存されていません");
  const [localError, setLocalError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCache = useRef(new Map<string, HTMLImageElement>());
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setSelectedId(initialItems[0]?.item_id ?? null);
    setHistory([]);
    setDirty(false);
    setVersion(initialLayoutVersion);
    setSavedMessage(initialLayout.length ? "保存済みの配置を復元しました" : "まだ保存されていません");
  }, [initialItems]);

  useEffect(() => setReview(initialReview), [initialReview]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
    drawRoom(context);
    const ordered = [...items].sort((left, right) => {
      if (left.item_id === selectedId) return 1;
      if (right.item_id === selectedId) return -1;
      return left.y - right.y;
    });
    ordered.forEach((item) => {
      if (!item.visible) return;
      let image = imageCache.current.get(item.imageUrl);
      if (!image) {
        image = new Image();
        image.crossOrigin = "anonymous";
        image.src = item.imageUrl;
        image.onload = () => setItems((current) => [...current]);
        imageCache.current.set(item.imageUrl, image);
      }
      context.save();
      context.translate(item.x, item.y);
      context.rotate(item.rotation * Math.PI / 180);
      context.scale(item.scale, item.scale);
      context.shadowColor = "rgba(30, 42, 34, .2)";
      context.shadowBlur = 14;
      context.shadowOffsetY = 7;
      if (image.complete && image.naturalWidth > 0) {
        drawRoundedImage(context, image, item.width, item.height);
      } else {
        context.fillStyle = "#edf1ec";
        context.beginPath();
        context.roundRect(-item.width / 2, -item.height / 2, item.width, item.height, 13);
        context.fill();
      }
      context.shadowColor = "transparent";
      if (item.item_id === selectedId) {
        context.strokeStyle = "#d47b45";
        context.lineWidth = 4 / item.scale;
        context.setLineDash([8 / item.scale, 5 / item.scale]);
        context.strokeRect(-item.width / 2, -item.height / 2, item.width, item.height);
        context.setLineDash([]);
      }
      context.fillStyle = "#244d40";
      context.beginPath();
      context.arc(-item.width / 2 + 16, -item.height / 2 + 16, 13, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#fff";
      context.font = "800 12px 'Yu Gothic UI', sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(item.displayIndex), -item.width / 2 + 16, -item.height / 2 + 16);
      context.restore();
    });
  }, [items, selectedId]);

  const selected = items.find((item) => item.item_id === selectedId) || null;

  function point(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * STAGE_WIDTH / rect.width,
      y: (event.clientY - rect.top) * STAGE_HEIGHT / rect.height,
    };
  }

  function remember() {
    setHistory((current) => [...current, items.map((item) => ({ ...item }))].slice(-20));
  }

  function selectAndDrag(event: ReactPointerEvent<HTMLCanvasElement>) {
    const currentPoint = point(event);
    const hit = [...items].reverse().find((item) => withinItem(item, currentPoint.x, currentPoint.y));
    if (!hit) {
      setSelectedId(null);
      return;
    }
    remember();
    setSelectedId(hit.item_id);
    dragRef.current = { itemId: hit.item_id, offsetX: currentPoint.x - hit.x, offsetY: currentPoint.y - hit.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current) return;
    const currentPoint = point(event);
    setItems((current) => current.map((item) => item.item_id === dragRef.current?.itemId ? {
      ...item,
      x: Math.max(30, Math.min(STAGE_WIDTH - 30, currentPoint.x - dragRef.current.offsetX)),
      y: Math.max(40, Math.min(STAGE_HEIGHT - 25, currentPoint.y - dragRef.current.offsetY)),
    } : item));
    setDirty(true);
    setSavedMessage("未保存の変更があります");
  }

  function stopDrag(event: ReactPointerEvent<HTMLCanvasElement>) {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function updateSelected(change: (item: StudioItem) => StudioItem) {
    if (selectedId === null) return;
    remember();
    setItems((current) => current.map((item) => item.item_id === selectedId ? change(item) : item));
    setDirty(true);
    setSavedMessage("未保存の変更があります");
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setItems(previous);
    setHistory((current) => current.slice(0, -1));
    setDirty(true);
    setSavedMessage("未保存の変更があります");
  }

  function reset() {
    remember();
    setItems(initialItems.map((item) => ({ ...item })));
    setSelectedId(initialItems[0]?.item_id ?? null);
    setDirty(true);
    setSavedMessage("未保存の変更があります");
  }

  function serialize(current: StudioItem[] = items): VisualLayoutItem[] {
    return current.map(({ item_id, product_id, x, y, scale, rotation, visible }) => ({
      item_id,
      product_id,
      x: Number((x / STAGE_WIDTH).toFixed(3)),
      y: Number((y / STAGE_HEIGHT).toFixed(3)),
      scale: Number(scale.toFixed(2)),
      rotation,
      visible,
    }));
  }

  async function persist(current: StudioItem[] = items): Promise<boolean> {
    setSaving(true);
    setLocalError(null);
    try {
      const stored = await onSave(version, serialize(current));
      setVersion(stored.version);
      setDirty(false);
      setSavedMessage("このPLANに保存しました");
      return true;
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : "配置を保存できませんでした。");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function analyze() {
    if (!canvasRef.current) return;
    if (!aiAvailable) {
      setActivePanel("AI");
      setLocalError("AIは現在オフです。start-demo.cmdを通常起動し、画像入力対応のAIサービスとAPI keyを設定してから、もう一度お試しください。");
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    try {
      if (dirty && !(await persist())) return;
      const imageDataUrl = canvasRef.current.toDataURL("image/jpeg", 0.82);
      const response = await onAnalyze(imageDataUrl, serialize());
      setReview(response);
      setActivePanel("AI");
      setPreviewBase(null);
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : "画像による評価を作成できませんでした。");
    } finally {
      setSubmitting(false);
    }
  }

  function previewAIChanges() {
    if (!review?.layout_changes.length || previewBase) return;
    const before = items.map((item) => ({ ...item }));
    const changes = new Map(review.layout_changes.map((change) => [change.item_id, change]));
    setHistory((current) => [...current, before].slice(-20));
    setPreviewBase(before);
    setItems((current) => current.map((item) => {
      const change = changes.get(item.item_id);
      return change ? {
        ...item,
        x: change.x * STAGE_WIDTH,
        y: change.y * STAGE_HEIGHT,
        scale: change.scale,
        rotation: change.rotation,
      } : item;
    }));
    setDirty(true);
    setSavedMessage("AI案をプレビュー中です");
  }

  function discardAIPreview() {
    if (!previewBase) return;
    setItems(previewBase);
    setPreviewBase(null);
    setDirty(false);
    setSavedMessage("AI案を反映せず、保存済みの配置に戻しました");
  }

  async function acceptAIPreview() {
    if (!previewBase) return;
    if (await persist()) setPreviewBase(null);
  }

  return (
    <div className="composition-layer" role="dialog" aria-modal="true" aria-labelledby="composition-title">
      <div className="composition-studio">
        <header className="composition-studio__header">
          <div><p className="eyebrow">Visual coordination prototype</p><h2 id="composition-title">AIと一緒に配置イメージを試す</h2></div>
          <div className="composition-studio__header-actions">
            <span className={`ai-connection-pill ${aiAvailable ? "is-ready" : "is-off"}`}>{aiAvailable ? "AI接続済み" : "AI未接続・配置のみ利用可能"}</span>
            <button className="ai-drawer__close" aria-label="配置画面を閉じる" onClick={onClose}>×</button>
          </div>
        </header>
        <div className="composition-studio__body">
          <p className="composition-note">参考PLANの商品をそのまま配置しています。ドラッグ・回転・75〜125%の拡大縮小ができます。これは配置イメージで、実寸や設置可否の確認ではありません。</p>
          <div className="composition-layout">
            <main className="composition-workspace">
              <canvas
                ref={canvasRef}
                width={STAGE_WIDTH}
                height={STAGE_HEIGHT}
                className="composition-canvas"
                aria-label="商品を配置する6畳サンプルルーム"
                onPointerDown={selectAndDrag}
                onPointerMove={drag}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
              />
              <div className="composition-toolbar" aria-label="選択商品の操作">
                <button disabled={!selected?.visible} onClick={() => updateSelected((item) => ({ ...item, rotation: Math.max(-180, item.rotation - 15) }))}>↶ 15°</button>
                <button disabled={!selected?.visible} onClick={() => updateSelected((item) => ({ ...item, rotation: Math.min(180, item.rotation + 15) }))}>↷ 15°</button>
                <button disabled={!selected?.visible || selected.scale <= .75} onClick={() => updateSelected((item) => ({ ...item, scale: Math.max(.75, item.scale - .1) }))}>− 小さく</button>
                <button disabled={!selected?.visible || selected.scale >= 1.25} onClick={() => updateSelected((item) => ({ ...item, scale: Math.min(1.25, item.scale + .1) }))}>＋ 大きく</button>
                <button disabled={!selected?.visible} onClick={() => updateSelected((item) => ({ ...item, visible: false }))}>配置から外す</button>
              </div>
              <div className="composition-history-actions">
                <button className="button button--ghost" disabled={history.length === 0} onClick={undo}>1つ前に戻す</button>
                <button className="button button--secondary" onClick={reset}>元の提案に戻す</button>
              </div>
            </main>

            <aside className="composition-sidebar">
              <div className="composition-tabs" role="tablist" aria-label="配置サポート">
                <button role="tab" aria-selected={activePanel === "PRODUCTS"} className={activePanel === "PRODUCTS" ? "is-active" : ""} onClick={() => setActivePanel("PRODUCTS")}>商品</button>
                <button role="tab" aria-selected={activePanel === "AI"} className={activePanel === "AI" ? "is-active" : ""} onClick={() => setActivePanel("AI")}>AIアドバイス</button>
              </div>
              {activePanel === "PRODUCTS" ? <div role="tabpanel" className="composition-panel">
                <section className="composition-reference">
                  <p className="eyebrow">Reference</p>
                  <SafeImage src={plan.image_url} alt="参考にしたコーディネートの室内写真" />
                  <small>参考写真と購入候補は別の参照情報です。</small>
                </section>
                <section>
                  <h3>今回のPLAN商品</h3>
                  <div className="composition-product-list">
                    {items.map((item) => (
                      <button
                        key={item.item_id}
                        className={item.item_id === selectedId ? "is-selected" : ""}
                        onClick={() => {
                          setSelectedId(item.item_id);
                          if (!item.visible) {
                            remember();
                            setItems((current) => current.map((candidate) => candidate.item_id === item.item_id ? { ...candidate, visible: true } : candidate));
                            setDirty(true);
                            setSavedMessage("未保存の変更があります");
                          }
                        }}
                      >
                        <span>{item.displayIndex}</span>
                        <SafeImage src={item.imageUrl} fallbackSrc="/assets/product-fallback.svg" alt="" />
                        <strong>{item.name}</strong>
                        <small>{item.visible ? yen(item.price) : "配置から外しました · 再配置"}</small>
                      </button>
                    ))}
                  </div>
                </section>
              </div> : <div role="tabpanel" className="composition-panel composition-ai-panel">
                {!aiAvailable && <p className="ai-status-note"><strong>AIは現在オフです</strong><span>配置は保存できます。AI評価を使う場合は、start-demo.cmdを通常起動してAIサービスを設定してください。</span></p>}
                {review ? <>
                  <div className="composition-ai-summary"><span>AIの所見</span><p>{review.summary}</p></div>
                  <div className="composition-ai-observations">{review.observations.map((observation) => <article key={observation.code}><strong>{observation.label}</strong><p>{observation.observation}</p><small>{observation.suggestion}</small></article>)}</div>
                  {review.layout_changes.length > 0 ? <section className="composition-ai-changes">
                    <h3>画面で試せる変更</h3>
                    <ul>{review.layout_changes.map((change) => <li key={change.item_id}><strong>商品 {items.find((item) => item.item_id === change.item_id)?.displayIndex ?? change.item_id}</strong><span>{change.reason}</span></li>)}</ul>
                    <div>{previewBase ? <><button className="button button--primary" disabled={saving} onClick={() => void acceptAIPreview()}>このAI案を保存</button><button className="button button--secondary" onClick={discardAIPreview}>AI案を取り消す</button></> : <button className="button button--secondary" onClick={previewAIChanges}>AI案を画面でプレビュー</button>}</div>
                  </section> : <p className="composition-ai-empty">今回は安全に反映できる位置変更を生成していません。文章の提案を参考に手動で調整できます。</p>}
                </> : <div className="composition-ai-empty"><strong>配置後にAIへ相談できます</strong><p>AIは配色・視覚的重心・余白・スタイルのまとまりだけを確認します。</p></div>}
                <button className="button button--ghost composition-product-assist" onClick={onOpenProductAssist}>希望条件から商品候補を見直す</button>
              </div>}
            </aside>
          </div>
        </div>
        <footer className="composition-footer">
          {localError && <p className="inline-error composition-footer__error" role="alert">{localError}</p>}
          <div><strong>配置の保存状態</strong><span>{saving ? "保存中…" : savedMessage}</span></div>
          <div className="composition-footer__actions">
            <button className="button button--secondary" disabled={!dirty || saving || submitting} onClick={() => void persist()}>{saving ? "保存中…" : "配置を保存"}</button>
            <button className="button button--primary" disabled={submitting} onClick={() => void analyze()}>
              {submitting ? "画像を確認中…" : "この配置をAIと一緒に見直す"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
