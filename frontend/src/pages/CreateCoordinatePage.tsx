import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { api, mediaUrl, track } from "../api/client";
import type { CreatorProfile, DerivationType, ProductSummary, UploadedImage } from "../api/types";
import { Badge } from "../components/common/Badge";
import { label, yen } from "../utils/labels";

const DERIVATIONS: Array<{ value: DerivationType; label: string }> = [
  { value: "LOWER_BUDGET", label: "予算を抑えた" },
  { value: "SMALLER_ROOM", label: "より小さい部屋向け" },
  { value: "COLOR_VARIATION", label: "色を変えた" },
  { value: "STORAGE_FOCUS", label: "収納を重視した" },
  { value: "EXISTING_FURNITURE", label: "手持ち家具を活かした" },
  { value: "PRODUCT_SUBSTITUTION", label: "商品を置き換えた" },
  { value: "OTHER", label: "その他" },
];

export function CreateCoordinatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentId = searchParams.get("parent");
  const [step, setStep] = useState(1);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [kind, setKind] = useState<"REAL" | "PLAN">("REAL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sizeBand, setSizeBand] = useState("SMALL_6");
  const [housingType, setHousingType] = useState("RENTAL");
  const [household, setHousehold] = useState("SINGLE");
  const [style, setStyle] = useState("NATURAL");
  const [budgetMax, setBudgetMax] = useState(50000);
  const [needs, setNeeds] = useState<string[]>(["STORAGE"]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [existingLabel, setExistingLabel] = useState("");
  const [existingCategory, setExistingCategory] = useState("SUPPORT_FURNITURE");
  const [existingDimensions, setExistingDimensions] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [derivationType, setDerivationType] = useState<DerivationType>("OTHER");
  const [remixNote, setRemixNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void track("create_coordinate_start", { properties: { placement: "CREATE" } });
    void api.creatorMe().then((profile) => {
      setCreator(profile);
      setDisplayName(profile.display_name);
      setBio(profile.bio || "");
    }).catch(() => undefined);
    void api.products().then((response) => setProducts(response.results)).catch((reason) => {
      setError(reason instanceof Error ? reason.message : "商品候補を読み込めませんでした");
    });
  }, []);

  const chosenProducts = useMemo(
    () => products.filter((product) => selectedProducts.includes(product.id)),
    [products, selectedProducts],
  );

  function goToStep(nextStep: number) {
    setStep(nextStep);
    window.requestAnimationFrame(() => {
      const stepper = document.querySelector(".stepper");
      if (stepper && typeof stepper.scrollIntoView === "function") {
        stepper.scrollIntoView({ behavior: "auto", block: "start" });
      }
    });
  }

  async function continueFromIdentity() {
    if (!displayName.trim()) {
      setError("公開用の表示名を入力してください。実名である必要はありません。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const profile = await api.saveCreator(displayName.trim(), bio.trim());
      setCreator(profile);
      goToStep(2);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "表示名を保存できませんでした");
    } finally {
      setBusy(false);
    }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > 5) {
      setError("画像は1つのコーデにつき5枚までです。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const uploaded: UploadedImage[] = [];
      for (const file of files) uploaded.push(await api.uploadImage(file));
      setImages((current) => [...current, ...uploaded]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "画像を処理できませんでした");
    } finally {
      event.target.value = "";
      setBusy(false);
    }
  }

  function continueFromContext() {
    if (!title.trim()) {
      setError("タイトルを入力してください。");
      return;
    }
    setError(null);
    goToStep(3);
  }

  function toggleProduct(productId: string) {
    setSelectedProducts((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    );
  }

  function toggleNeed(need: string) {
    setNeeds((current) => current.includes(need) ? current.filter((item) => item !== need) : [...current, need]);
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!creator) {
      setError("先に表示名を保存してください。");
      goToStep(1);
      return;
    }
    if (!title.trim()) {
      setError("タイトルを入力してください。");
      goToStep(2);
      return;
    }
    if (!chosenProducts.length && !existingLabel.trim()) {
      setError("商品または今持っている家具を1つ以上追加してください。");
      return;
    }
    if (kind === "REAL" && !images.length) {
      setError("REAL ROOMの公開には、実際の部屋画像が1枚以上必要です。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const coordinate = await api.createCoordinate({
        kind,
        title: title.trim(),
        description: description.trim() || null,
        room_type: "ONE_ROOM",
        size_band: sizeBand,
        housing_type: housingType,
        household,
        budget_max: budgetMax,
        style,
        needs,
        products: chosenProducts.map((product) => ({
          product_id: product.id,
          role: product.default_role,
          quantity: 1,
        })),
        existing_furniture: existingLabel.trim() ? [{
          label: existingLabel.trim(),
          category: existingCategory,
          dimensions: existingDimensions.trim() || null,
        }] : [],
        image_ids: images.map((image) => image.id),
        parent_coordinate_id: parentId,
        derivation_type: parentId ? derivationType : null,
        remix_note: parentId ? remixNote.trim() || null : null,
      });
      await track("create_coordinate_complete", { coordinate_id: coordinate.id, properties: { kind } });
      await track(kind === "REAL" ? "real_room_publish" : "plan_publish", {
        coordinate_id: coordinate.id,
        properties: { kind },
      });
      navigate(`/coordinates/${coordinate.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "公開できませんでした");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell create-page">
      <header className="page-intro">
        <p className="eyebrow">Create a useful Coordinate</p>
        <h1>暮らしを、誰かの参考にする</h1>
        <p>人気を競う投稿ではなく、部屋条件・商品・手持ち家具を再利用できる形で共有します。</p>
      </header>

      <ol className="stepper" aria-label="投稿の進み具合">
        {["表示名と種別", "暮らしの条件", "商品・画像・公開"].map((item, index) => (
          <li key={item} className={step === index + 1 ? "is-current" : step > index + 1 ? "is-done" : ""}>
            <span>{index + 1}</span>{item}
          </li>
        ))}
      </ol>

      <form className="create-form" onSubmit={publish}>
        {step === 1 && (
          <fieldset>
            <legend>誰として、何を共有しますか？</legend>
            <p className="form-help">この表示名は公開されますが、Session IDや連絡先は公開されません。</p>
            <label>公開用の表示名<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} required /></label>
            <label>短い自己紹介（任意）<textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={240} rows={3} /></label>
            <div className="kind-choice" role="radiogroup" aria-label="コーデの種別">
              <label className={kind === "REAL" ? "is-selected" : ""}><input type="radio" name="kind" value="REAL" checked={kind === "REAL"} onChange={() => setKind("REAL")} /><strong>REAL ROOM</strong><span>実際に存在する自分の部屋。画像が必要です。</span></label>
              <label className={kind === "PLAN" ? "is-selected" : ""}><input type="radio" name="kind" value="PLAN" checked={kind === "PLAN"} onChange={() => setKind("PLAN")} /><strong>PLAN</strong><span>これから実現したい暮らし。購入済みを意味しません。</span></label>
            </div>
            <button className="button button--primary" type="button" disabled={busy} onClick={() => void continueFromIdentity()}>暮らしの条件へ</button>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset>
            <legend>この暮らしの前提を教えてください</legend>
            <label>タイトル<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} required placeholder="例：手持ちの机を活かす6畳PLAN" /></label>
            <label>工夫・背景（任意）<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={800} rows={4} /></label>
            <div className="form-grid">
              <label>広さ<select value={sizeBand} onChange={(event) => setSizeBand(event.target.value)}><option value="TINY_5_5">5.5畳前後</option><option value="SMALL_6">6畳前後</option><option value="MEDIUM_7_8">7〜8畳</option></select></label>
              <label>住まい<select value={housingType} onChange={(event) => setHousingType(event.target.value)}><option value="RENTAL">賃貸</option><option value="OWNED">持ち家</option></select></label>
              <label>暮らす人<select value={household} onChange={(event) => setHousehold(event.target.value)}><option value="SINGLE">一人暮らし</option><option value="COUPLE">二人暮らし</option><option value="FAMILY">家族</option></select></label>
              <label>雰囲気<select value={style} onChange={(event) => setStyle(event.target.value)}><option value="NATURAL">ナチュラル</option><option value="CLEAR_COOL">クリアクール</option><option value="DANDY">ダンディ</option><option value="ELEGANT">エレガント</option></select></label>
              <label>予算上限<input type="number" min={1000} max={1000000} step={1000} value={budgetMax} onChange={(event) => setBudgetMax(Number(event.target.value))} /></label>
            </div>
            <fieldset className="nested-fieldset"><legend>解決したいこと（複数可）</legend><div className="check-row">{["STORAGE", "LOW_BUDGET", "WORK_FROM_HOME", "RELAX", "SLEEP", "COMPACT"].map((need) => <label key={need}><input type="checkbox" checked={needs.includes(need)} onChange={() => toggleNeed(need)} />{label(need)}</label>)}</div></fieldset>
            <div className="form-actions"><button className="button button--ghost" type="button" onClick={() => goToStep(1)}>戻る</button><button className="button button--primary" type="button" onClick={continueFromContext}>商品・画像へ</button></div>
          </fieldset>
        )}

        {step === 3 && (
          <fieldset>
            <legend>再利用できる情報を加えて公開します</legend>
            <section className="form-section" aria-labelledby="tag-products"><h2 id="tag-products">一緒に使う商品</h2><p className="form-help">デモ商品データから構造的に選びます。画像認識は行いません。</p><div className="product-picker">{products.map((product) => <label key={product.id} className={selectedProducts.includes(product.id) ? "is-selected" : ""}><input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => toggleProduct(product.id)} /><img src={product.image_url} alt="" /><span><strong>{product.name}</strong><small>{label(product.default_role)} · {yen(product.price_snapshot)}</small></span></label>)}</div></section>
            <section className="form-section" aria-labelledby="owned-furniture"><h2 id="owned-furniture">今持っている家具（任意）</h2><div className="form-grid"><label>名前<input value={existingLabel} onChange={(event) => setExistingLabel(event.target.value)} maxLength={80} placeholder="例：今使っている机" /></label><label>種類<select value={existingCategory} onChange={(event) => setExistingCategory(event.target.value)}><option value="SUPPORT_FURNITURE">サポート家具</option><option value="STORAGE">収納</option><option value="LIGHTING">照明</option><option value="OTHER">その他</option></select></label><label>サイズ（任意）<input value={existingDimensions} onChange={(event) => setExistingDimensions(event.target.value)} maxLength={80} /></label></div></section>
            <section className="form-section" aria-labelledby="room-images"><h2 id="room-images">部屋画像 {kind === "REAL" && <Badge tone="warning">REALは必須</Badge>}</h2><p className="form-help">JPEG / PNG / WebP、1枚8MB以下、最大5枚。サーバーで再変換し、EXIFを除去します。</p>{kind === "REAL" && <div className="privacy-notice"><strong>投稿前のプライバシー確認</strong><p>顔・氏名・郵便物・住所・車のナンバーなど、個人情報が画像に写っていないことを自分で確認してください。</p></div>}<label className="upload-box">画像を選ぶ<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => void upload(event)} /></label><div className="upload-preview">{images.map((image) => <img key={image.id} src={mediaUrl(image.url)} alt="アップロードした部屋のプレビュー" />)}</div></section>
            {parentId && <section className="form-section"><h2>参考元からの変更理由</h2><label>変更理由<select value={derivationType} onChange={(event) => setDerivationType(event.target.value as DerivationType)}>{DERIVATIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label>補足（任意）<input value={remixNote} onChange={(event) => setRemixNote(event.target.value)} maxLength={200} /></label></section>}
            <div className="publish-disclosure"><strong>{kind === "REAL" ? "USER申告のREAL ROOM" : "これから実現したい公開PLAN"}</strong><p>{kind === "REAL" ? "NITORIや本システムが実在性・購入・商品使用を確認したものではありません。" : "購入済み、在庫確保、専門家による設計承認を意味しません。"}</p></div>
            <div className="form-actions"><button className="button button--ghost" type="button" onClick={() => goToStep(2)}>戻る</button><button className="button button--primary" disabled={busy} type="submit">{kind === "REAL" ? "REAL ROOMとして公開" : "PLANとして公開"}</button></div>
          </fieldset>
        )}
        {error && <p className="inline-error" role="alert">{error}</p>}
      </form>
    </div>
  );
}
