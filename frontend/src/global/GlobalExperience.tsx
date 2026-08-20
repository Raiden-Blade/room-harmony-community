import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlobeCanvas } from "./GlobeCanvas";

type Region = { name: string; area: string; title: string; image: string; tag: string; longitude: number; latitude: number };
type Market = {
  iso: string; slug: string; en: string; jp: string; city: string; longitude: number; latitude: number; activationLongitude: number;
  kind: "market" | "community";
  lead: string; images: string[]; regions: Region[];
};

const room = (name: string) => `/assets/rooms/${name}`;

const markets: Market[] = [
  {
    iso: "JPN", slug: "japan", en: "JAPAN", jp: "日本", city: "TOKYO · KUMAMOTO", longitude: 138, latitude: 36, activationLongitude: 138, kind: "market",
    lead: "余白、木の温もり、整える知恵。毎日の小さな心地よさを集めました。",
    images: [room("coord-001-storage-natural.webp"), room("coord-013-work-natural.webp"), room("coord-025-sleep-natural.webp"), room("coord-031-compact-natural.webp")],
    regions: [
      { name: "北海道", area: "HOKKAIDO", title: "長い冬を軽やかに過ごす部屋", image: room("coord-025-sleep-natural.webp"), tag: "あたたかい", longitude: 142.8, latitude: 43.1 },
      { name: "東京都", area: "TOKYO", title: "都市の余白をつくる収納", image: room("coord-002-storage-clear-cool.webp"), tag: "コンパクト", longitude: 139.7, latitude: 35.7 },
      { name: "関西", area: "KANSAI", title: "家族が自然に集まるダイニング", image: room("coord-013-work-natural.webp"), tag: "家族暮らし", longitude: 135.5, latitude: 34.7 },
      { name: "熊本県", area: "KUMAMOTO", title: "木色と風を感じるリビング", image: room("coord-001-storage-natural.webp"), tag: "ナチュラル", longitude: 130.7, latitude: 32.8 },
    ],
  },
  {
    iso: "CHN", slug: "china", en: "MAINLAND CHINA", jp: "中国大陸", city: "SHANGHAI · CHENGDU", longitude: 104, latitude: 35, activationLongitude: 126, kind: "market",
    lead: "大胆なコントラストと実用性。広さに合わせて暮らしを編集するアイデア。",
    images: [room("coord-003-storage-dandy.webp"), room("coord-015-work-dandy.webp"), room("coord-021-relax-dandy.webp"), room("hero-work-relax.webp")],
    regions: [
      { name: "上海", area: "SHANGHAI", title: "濃色家具で輪郭をつくる部屋", image: room("coord-003-storage-dandy.webp"), tag: "ダンディ", longitude: 121.47, latitude: 31.23 },
      { name: "北京", area: "BEIJING", title: "仕事と休息を切り替える空間", image: room("hero-work-relax.webp"), tag: "ワーク", longitude: 116.4, latitude: 39.9 },
      { name: "成都", area: "CHENGDU", title: "低い家具でくつろぐリビング", image: room("coord-021-relax-dandy.webp"), tag: "ロースタイル", longitude: 104.06, latitude: 30.67 },
      { name: "深圳", area: "SHENZHEN", title: "黒を効かせた都市型デスク", image: room("coord-015-work-dandy.webp"), tag: "モダン", longitude: 114.06, latitude: 22.54 },
    ],
  },
  {
    iso: "THA", slug: "thailand", en: "THAILAND", jp: "タイ", city: "BANGKOK · CHIANG MAI", longitude: 101, latitude: 15, activationLongitude: 114, kind: "market",
    lead: "明るい色、涼やかな素材、のびやかな配置。風が通る暮らしのヒント。",
    images: [room("coord-007-budget-natural.webp"), room("coord-014-work-clear-cool.webp"), room("coord-023-relax-cozy.webp"), room("hero-newlife-storage.webp")],
    regions: [
      { name: "バンコク", area: "BANGKOK", title: "白と黒で涼しく整えるワーク角", image: room("coord-014-work-clear-cool.webp"), tag: "クリア", longitude: 100.5, latitude: 13.75 },
      { name: "チェンマイ", area: "CHIANG MAI", title: "木の素材感を楽しむ穏やかな部屋", image: room("coord-007-budget-natural.webp"), tag: "自然素材", longitude: 98.99, latitude: 18.79 },
      { name: "プーケット", area: "PHUKET", title: "明るいファブリックでくつろぐ", image: room("coord-023-relax-cozy.webp"), tag: "カラー", longitude: 98.39, latitude: 7.88 },
      { name: "コンケン", area: "KHON KAEN", title: "収納で床の余白をつくる", image: room("hero-newlife-storage.webp"), tag: "収納", longitude: 102.82, latitude: 16.43 },
    ],
  },
  {
    iso: "MYS", slug: "malaysia", en: "MALAYSIA", jp: "マレーシア", city: "KUALA LUMPUR · PENANG", longitude: 102, latitude: 4, activationLongitude: 102, kind: "market",
    lead: "集う場所を中心に、素材と色を重ねる。多様な家族に寄り添う空間。",
    images: [room("coord-008-budget-clear-cool.webp"), room("coord-019-relax-natural.webp"), room("coord-004-storage-elegant.webp"), room("hero-seasonal-bedroom.webp")],
    regions: [
      { name: "クアラルンプール", area: "KUALA LUMPUR", title: "都会の暮らしを軽やかにまとめる", image: room("coord-008-budget-clear-cool.webp"), tag: "シンプル", longitude: 101.69, latitude: 3.14 },
      { name: "ペナン", area: "PENANG", title: "素材を重ねた穏やかなリビング", image: room("coord-019-relax-natural.webp"), tag: "ミックス", longitude: 100.33, latitude: 5.41 },
      { name: "ジョホール", area: "JOHOR", title: "家族の持ち物を美しく収める", image: room("coord-004-storage-elegant.webp"), tag: "収納", longitude: 103.74, latitude: 1.49 },
      { name: "サバ", area: "SABAH", title: "ベッドまわりを立体的に使う", image: room("hero-seasonal-bedroom.webp"), tag: "省スペース", longitude: 116.07, latitude: 5.98 },
    ],
  },
  {
    iso: "SGP", slug: "singapore", en: "SINGAPORE", jp: "シンガポール", city: "CENTRAL · EAST", longitude: 104, latitude: 1.35, activationLongitude: 90, kind: "market",
    lead: "小さな住まいを賢く、心地よく。ひとつの家具に複数の役割を。",
    images: [room("coord-002-storage-clear-cool.webp"), room("coord-031-compact-natural.webp"), room("coord-014-work-clear-cool.webp"), room("hero-compact-living.webp")],
    regions: [
      { name: "中央部", area: "CENTRAL", title: "仕事と生活を一室で切り替える", image: room("coord-014-work-clear-cool.webp"), tag: "ワーク", longitude: 103.84, latitude: 1.35 },
      { name: "東部", area: "EAST", title: "家族の動線を邪魔しない収納", image: room("coord-002-storage-clear-cool.webp"), tag: "機能的", longitude: 103.94, latitude: 1.35 },
      { name: "北部", area: "NORTH", title: "家具を絞って広く見せる部屋", image: room("coord-031-compact-natural.webp"), tag: "コンパクト", longitude: 103.82, latitude: 1.43 },
      { name: "西部", area: "WEST", title: "飾るものと隠すものを分ける", image: room("hero-compact-living.webp"), tag: "収納", longitude: 103.7, latitude: 1.35 },
    ],
  },
  {
    iso: "AUS", slug: "australia", en: "AUSTRALIA", jp: "オーストラリア", city: "SYDNEY · MELBOURNE", longitude: 134, latitude: -25, activationLongitude: 170, kind: "community",
    lead: "光をたっぷり取り込み、屋内と屋外をゆるやかにつなぐ。開放感のある暮らし。",
    images: [room("hero-compact-living.webp"), room("coord-007-budget-natural.webp"), room("coord-019-relax-natural.webp"), room("hero-seasonal-bedroom.webp")],
    regions: [
      { name: "シドニー", area: "SYDNEY", title: "海辺の光を取り込むリビング", image: room("coord-019-relax-natural.webp"), tag: "開放感", longitude: 151.21, latitude: -33.87 },
      { name: "メルボルン", area: "MELBOURNE", title: "古さと新しさを混ぜる部屋", image: room("hero-compact-living.webp"), tag: "ミックス", longitude: 144.96, latitude: -37.81 },
      { name: "ブリスベン", area: "BRISBANE", title: "自然素材で涼しく整える", image: room("coord-007-budget-natural.webp"), tag: "ナチュラル", longitude: 153.03, latitude: -27.47 },
      { name: "パース", area: "PERTH", title: "夕暮れを楽しむ穏やかな寝室", image: room("hero-seasonal-bedroom.webp"), tag: "リラックス", longitude: 115.86, latitude: -31.95 },
    ],
  },
  {
    iso: "CAN", slug: "canada", en: "CANADA", jp: "カナダ", city: "VANCOUVER · MONTRÉAL", longitude: -106, latitude: 56, activationLongitude: -125, kind: "community",
    lead: "長い冬に寄り添う木の温もりと、都市の多様さを受け止める柔らかな空間。",
    images: [room("coord-025-sleep-natural.webp"), room("coord-001-storage-natural.webp"), room("coord-005-storage-cozy.webp"), room("hero-seasonal-bedroom.webp")],
    regions: [
      { name: "バンクーバー", area: "VANCOUVER", title: "森の色を重ねた都市の部屋", image: room("coord-001-storage-natural.webp"), tag: "木の温もり", longitude: -123.12, latitude: 49.28 },
      { name: "モントリオール", area: "MONTRÉAL", title: "色と古家具を楽しむリビング", image: room("coord-005-storage-cozy.webp"), tag: "ヴィンテージ", longitude: -73.57, latitude: 45.5 },
      { name: "トロント", area: "TORONTO", title: "小さな部屋を明るく使い切る", image: room("coord-025-sleep-natural.webp"), tag: "都市暮らし", longitude: -79.38, latitude: 43.65 },
      { name: "ケベック", area: "QUÉBEC", title: "冬の夜を包むあたたかな寝室", image: room("hero-seasonal-bedroom.webp"), tag: "コージー", longitude: -71.21, latitude: 46.81 },
    ],
  },
  {
    iso: "USA", slug: "united-states", en: "UNITED STATES", jp: "アメリカ", city: "NEW YORK · CALIFORNIA", longitude: -98, latitude: 39, activationLongitude: -100, kind: "community",
    lead: "都市のコンパクトさから西海岸の伸びやかさまで、自分らしさを大胆に編集。",
    images: [room("coord-014-work-clear-cool.webp"), room("coord-015-work-dandy.webp"), room("coord-031-compact-natural.webp"), room("hero-work-relax.webp")],
    regions: [
      { name: "ニューヨーク", area: "NEW YORK", title: "一室で仕事と生活を切り替える", image: room("hero-work-relax.webp"), tag: "ロフト", longitude: -74.01, latitude: 40.71 },
      { name: "カリフォルニア", area: "CALIFORNIA", title: "光と余白を楽しむ西海岸の部屋", image: room("coord-031-compact-natural.webp"), tag: "カジュアル", longitude: -118.24, latitude: 34.05 },
      { name: "シカゴ", area: "CHICAGO", title: "濃色を効かせた都会のワーク角", image: room("coord-015-work-dandy.webp"), tag: "インダストリアル", longitude: -87.63, latitude: 41.88 },
      { name: "ポートランド", area: "PORTLAND", title: "道具と植物が共存する空間", image: room("coord-014-work-clear-cool.webp"), tag: "クラフト", longitude: -122.68, latitude: 45.52 },
    ],
  },
  {
    iso: "BRA", slug: "brazil", en: "BRAZIL", jp: "ブラジル", city: "SÃO PAULO · RIO", longitude: -51, latitude: -10, activationLongitude: -51, kind: "community",
    lead: "鮮やかな色と植物、家族が集まる大きな居場所。陽気さを日常の中へ。",
    images: [room("coord-023-relax-cozy.webp"), room("coord-005-storage-cozy.webp"), room("coord-019-relax-natural.webp"), room("coord-004-storage-elegant.webp")],
    regions: [
      { name: "サンパウロ", area: "SÃO PAULO", title: "色とアートが響き合う都市の部屋", image: room("coord-023-relax-cozy.webp"), tag: "カラー", longitude: -46.63, latitude: -23.55 },
      { name: "リオ", area: "RIO DE JANEIRO", title: "風が抜ける明るいリビング", image: room("coord-019-relax-natural.webp"), tag: "オープン", longitude: -43.17, latitude: -22.91 },
      { name: "クリチバ", area: "CURITIBA", title: "端正な収納で緑を引き立てる", image: room("coord-004-storage-elegant.webp"), tag: "グリーン", longitude: -49.27, latitude: -25.43 },
      { name: "バイーア", area: "BAHIA", title: "手仕事の色を重ねるくつろぎ空間", image: room("coord-005-storage-cozy.webp"), tag: "ハンドクラフト", longitude: -38.5, latitude: -12.97 },
    ],
  },
  {
    iso: "FRA", slug: "france", en: "FRANCE", jp: "フランス", city: "PARIS · PROVENCE", longitude: 2, latitude: 46, activationLongitude: -10, kind: "community",
    lead: "古いものを残しながら、好きなものを静かに重ねる。余韻のあるフレンチスタイル。",
    images: [room("coord-004-storage-elegant.webp"), room("coord-005-storage-cozy.webp"), room("coord-025-sleep-natural.webp"), room("hero-seasonal-bedroom.webp")],
    regions: [
      { name: "パリ", area: "PARIS", title: "小さなアパルトマンを美しく使う", image: room("coord-004-storage-elegant.webp"), tag: "エレガント", longitude: 2.35, latitude: 48.86 },
      { name: "プロヴァンス", area: "PROVENCE", title: "淡い色と自然素材のダイニング", image: room("coord-025-sleep-natural.webp"), tag: "素朴", longitude: 6.05, latitude: 43.95 },
      { name: "リヨン", area: "LYON", title: "古家具を主役にした静かな部屋", image: room("coord-005-storage-cozy.webp"), tag: "クラシック", longitude: 4.84, latitude: 45.76 },
      { name: "ボルドー", area: "BORDEAUX", title: "深い色で整える穏やかな寝室", image: room("hero-seasonal-bedroom.webp"), tag: "シック", longitude: -0.58, latitude: 44.84 },
    ],
  },
  {
    iso: "ITA", slug: "italy", en: "ITALY", jp: "イタリア", city: "MILANO · TOSCANA", longitude: 12, latitude: 42, activationLongitude: 5, kind: "community",
    lead: "端正なデザインと、家族の時間を大切にする温かな食卓。その両方を一室に。",
    images: [room("coord-003-storage-dandy.webp"), room("coord-021-relax-dandy.webp"), room("coord-013-work-natural.webp"), room("coord-019-relax-natural.webp")],
    regions: [
      { name: "ミラノ", area: "MILANO", title: "輪郭の美しい家具で整える", image: room("coord-003-storage-dandy.webp"), tag: "モダン", longitude: 9.19, latitude: 45.46 },
      { name: "トスカーナ", area: "TOSCANA", title: "食卓を中心に家族が集まる部屋", image: room("coord-013-work-natural.webp"), tag: "ダイニング", longitude: 11.25, latitude: 43.77 },
      { name: "ローマ", area: "ROMA", title: "古い質感と濃色を重ねるリビング", image: room("coord-021-relax-dandy.webp"), tag: "タイムレス", longitude: 12.5, latitude: 41.9 },
      { name: "シチリア", area: "SICILIA", title: "陽射しと素材感を楽しむ空間", image: room("coord-019-relax-natural.webp"), tag: "地中海", longitude: 14, latitude: 37.6 },
    ],
  },
  {
    iso: "SWE", slug: "sweden", en: "SWEDEN", jp: "スウェーデン", city: "STOCKHOLM · SKÅNE", longitude: 15, latitude: 62, activationLongitude: 25, kind: "community",
    lead: "少ない光をやわらかく受け止める白、木、布。長く使えるものを丁寧に選ぶ暮らし。",
    images: [room("coord-002-storage-clear-cool.webp"), room("coord-008-budget-clear-cool.webp"), room("coord-014-work-clear-cool.webp"), room("coord-031-compact-natural.webp")],
    regions: [
      { name: "ストックホルム", area: "STOCKHOLM", title: "白と木で光を広げる部屋", image: room("coord-002-storage-clear-cool.webp"), tag: "北欧", longitude: 18.07, latitude: 59.33 },
      { name: "スコーネ", area: "SKÅNE", title: "自然素材と余白を楽しむ暮らし", image: room("coord-031-compact-natural.webp"), tag: "ナチュラル", longitude: 13, latitude: 55.6 },
      { name: "ヨーテボリ", area: "GÖTEBORG", title: "小さなワーク角を軽やかにつくる", image: room("coord-014-work-clear-cool.webp"), tag: "機能的", longitude: 11.97, latitude: 57.7 },
      { name: "ダーラナ", area: "DALARNA", title: "静かな色で冬を心地よく過ごす", image: room("coord-008-budget-clear-cool.webp"), tag: "ヒュッゲ", longitude: 14.5, latitude: 61 },
    ],
  },
];

const marketStops = markets.map((market, index) => ({ index, activationLongitude: market.activationLongitude }));

const lensCodeByIso: Record<string, string> = {
  JPN: "JP", CHN: "CN", THA: "TH", MYS: "MY", SGP: "SG", AUS: "AU",
  CAN: "CA", USA: "US", BRA: "BR", FRA: "FR", ITA: "IT", SWE: "SE",
};

const otherMarkets = ["香港", "韓国", "ベトナム", "フィリピン", "インドネシア", "インド"];

export function GlobalExperience() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [view, setView] = useState<"world" | "country">("world");
  const [clusterReady, setClusterReady] = useState(true);
  const [clusterHovered, setClusterHovered] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [introComplete, setIntroComplete] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [toast, setToast] = useState("");
  const changeTimer = useRef<number | null>(null);
  const clusterRef = useRef<HTMLButtonElement>(null);
  const geoVisualRef = useRef<HTMLDivElement>(null);
  const regionLineRef = useRef<SVGSVGElement>(null);
  const regionTileRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const clusterInteractive = useRef(false);
  const activeMarket = useMemo(() => markets[activeIndex], [activeIndex]);
  const paused = view === "country" || clusterHovered || manualPaused || !introComplete;

  const updateProjection = useCallback(({ x, y, depth, opacity, scale }: { x: number; y: number; depth: number; opacity: number; scale: number }) => {
    const cluster = clusterRef.current;
    if (!cluster) return;
    cluster.style.setProperty("--anchor-x", `${x}px`);
    cluster.style.setProperty("--anchor-y", `${y}px`);
    cluster.style.setProperty("--geo-opacity", opacity.toFixed(3));
    cluster.style.setProperty("--geo-scale", scale.toFixed(3));
    cluster.dataset.depth = depth.toFixed(3);
    const interactive = clusterReady && opacity > .24;
    cluster.style.pointerEvents = interactive ? "auto" : "none";
    if (clusterInteractive.current !== interactive) {
      clusterInteractive.current = interactive;
      cluster.tabIndex = interactive ? 0 : -1;
      cluster.setAttribute("aria-hidden", interactive ? "false" : "true");
    }
  }, [clusterReady]);

  const selectMarket = useCallback((index: number) => {
    if (index === activeIndex || view !== "world") return;
    setClusterReady(false);
    setClusterHovered(false);
    if (changeTimer.current) window.clearTimeout(changeTimer.current);
    changeTimer.current = window.setTimeout(() => {
      setActiveIndex(index);
      window.setTimeout(() => setClusterReady(true), 80);
    }, 320);
  }, [activeIndex, view]);

  const faceMarket = useCallback((index: number) => selectMarket(index), [selectMarket]);

  const updateRegionProjection = useCallback((points: Array<{ x: number; y: number }>) => {
    const geo = geoVisualRef.current;
    const svg = regionLineRef.current;
    if (!geo || !svg) return;
    const geoRect = geo.getBoundingClientRect();
    points.forEach((point, index) => {
      const tile = regionTileRefs.current[index];
      const line = svg.querySelector<SVGPolylineElement>(`[data-region-line="${index}"]`);
      const dot = svg.querySelector<SVGCircleElement>(`[data-region-dot="${index}"]`);
      if (!tile || !line || !dot) return;
      const tileRect = tile.getBoundingClientRect();
      const tileIsLeft = tileRect.left + tileRect.width / 2 < geoRect.left + geoRect.width / 2;
      const startX = (tileIsLeft ? tileRect.right : tileRect.left) - geoRect.left;
      const startY = tileRect.top + tileRect.height / 2 - geoRect.top;
      const elbowX = startX + (tileIsLeft ? 24 : -24);
      line.setAttribute("points", `${startX},${startY} ${elbowX},${startY} ${point.x},${point.y}`);
      dot.setAttribute("cx", String(point.x));
      dot.setAttribute("cy", String(point.y));
    });
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIntroComplete(true);
      return;
    }
    const introTimer = window.setTimeout(() => setIntroComplete(true), 2050);
    return () => window.clearTimeout(introTimer);
  }, []);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && view === "country") {
        setView("world"); setSelectedRegion(null); setClusterReady(true);
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [view]);

  useEffect(() => () => { if (changeTimer.current) window.clearTimeout(changeTimer.current); }, []);

  function enterCountry() {
    setClusterHovered(false);
    setSelectedRegion(null);
    setView("country");
  }

  function backToWorld() {
    setSelectedRegion(null);
    setView("world");
    setClusterReady(true);
  }

  function bridgeTo(path: string) {
    window.parent.postMessage({ type: "room-around:navigate", path }, window.location.origin);
  }

  function prototypeAction(label: string) {
    const lensCode = lensCodeByIso[activeMarket.iso] ?? "JP";
    const path = label === "AIルーム評価"
      ? "/saved?intent=ai"
      : label === "投稿ページ" || label === "コーディネート投稿"
        ? "/create"
        : label === "MY PLAN" || label === "保存・PLAN"
          ? "/saved"
          : label === "コーディネート詳細"
            ? `/explore?global_lens=${lensCode}`
            : label.endsWith("のコーディネート")
              ? "/explore?mode=popular"
              : null;

    if (path) {
      bridgeTo(path);
      return;
    }

    setToast(`${label}を選択しました。`);
    window.setTimeout(() => setToast(""), 2400);
  }

  function accelerateBackward() {
    setManualPaused(false);
    setRotationSpeed((current) => current > 0 ? -.7 : Math.max(-2.1, Number((current - .35).toFixed(2))));
  }

  function accelerateForward() {
    setManualPaused(false);
    setRotationSpeed((current) => current < 0 ? .7 : Math.min(2.1, Number((current + .35).toFixed(2))));
  }

  return (
    <main>
      <header className="siteHeader">
        <a className="brand" href="#top" aria-label="Room Around ホーム"><span className="brandMark">RA</span><span><strong>Room Around</strong><small>GLOBAL COORDINATE DISCOVERY</small></span></a>
        <nav aria-label="メインナビゲーション">
          <a href="#world">世界から見つける</a><a href="#how">楽しみ方</a><button onClick={() => prototypeAction("AIルーム評価")}>AI評価</button><button className="postButton" onClick={() => prototypeAction("投稿ページ")}>コーディネートを投稿</button>
        </nav>
        <span className="prototypeFlag">VISUAL PROTOTYPE 02</span>
      </header>

      <section className={`hero ${view === "country" ? "countryMode" : "worldMode"} ${view === "world" && !introComplete ? "introPlaying" : "introComplete"}`} id="top">
        <div className="heroTopline"><span>ROOM HARMONY COMMUNITY</span><i /><span>12 STORIES / GLOBAL</span></div>

        <div className="worldStage" id="world">
          {view === "country" && (
            <button className="worldBack" onClick={backToWorld}><span>←</span><span><small>BACK TO WORLD</small>世界へ戻る</span></button>
          )}

          <div className="brandPrelude" aria-hidden="true">
            <span className="brandPreludeDepth" />
            <img src="/assets/nitori-mark.svg" alt="" />
          </div>
          <div className="nitoriBackdrop" aria-hidden="true">
            <span className="nitoriMarkDepth" />
            <img src="/assets/nitori-mark.svg" alt="" />
          </div>
          <div className="orbit orbitOne" /><div className="orbit orbitTwo" />
          <div ref={geoVisualRef} className={`geoVisual ${view === "country" ? "flatMode" : ""}`}>
            <GlobeCanvas activeIso={activeMarket.iso} activeLatitude={activeMarket.latitude} activeLongitude={activeMarket.longitude} mode={view} paused={paused} rotationSpeed={rotationSpeed} stops={marketStops} regions={activeMarket.regions} onFacing={faceMarket} onProjection={updateProjection} onRegionProjection={updateRegionProjection} />
            <div className="mapIdentity" aria-hidden={view !== "country"}>
              <b>{activeMarket.jp}</b><span>{activeMarket.en}</span>
            </div>
            {view === "country" && (
              <svg ref={regionLineRef} className="regionLeaders" width="100%" height="100%" aria-hidden="true">
                {activeMarket.regions.map((region, index) => <g key={region.name}><polyline data-region-line={index} /><circle data-region-dot={index} r="5" /></g>)}
              </svg>
            )}
            {view === "world" && (
              <button
                ref={clusterRef}
                key={activeMarket.slug}
                className={`photoCluster ${clusterReady ? "isVisible" : ""} ${clusterHovered ? "isHovered" : ""}`}
                onMouseEnter={() => setClusterHovered(true)}
                onMouseLeave={() => setClusterHovered(false)}
                onFocus={() => setClusterHovered(true)}
                onBlur={() => setClusterHovered(false)}
                onClick={enterCountry}
                aria-label={`${activeMarket.jp}の地域コーディネートを見る`}
              >
                <span className="clusterLine" /><span className="clusterPin" />
                <figure className="clusterShot shotOne"><img src={activeMarket.images[0]} alt="" /></figure>
                <figure className="clusterShot shotTwo"><img src={activeMarket.images[1]} alt="" /></figure>
                <figure className="clusterShot shotThree"><img src={activeMarket.images[2]} alt="" /></figure>
                <figure className="clusterShot shotFour"><img src={activeMarket.images[3]} alt="" /></figure>
                <span className="clusterCaption"><small>{activeMarket.kind === "market" ? "MARKET COORDINATE" : "GLOBAL INSPIRATION"} · {activeMarket.en}</small><b>{activeMarket.jp}の暮らし</b><em>4 COORDINATES — VIEW AREA →</em></span>
              </button>
            )}
          </div>

          {view === "country" && (
            <div className="regionConstellation" aria-label={`${activeMarket.jp}の地域コーディネート`}>
              {activeMarket.regions.map((region, index) => (
                <button ref={(node) => { regionTileRefs.current[index] = node; }} key={region.name} className={`regionTile tile${index + 1} ${selectedRegion?.name === region.name ? "selected" : ""}`} onClick={() => setSelectedRegion(region)}>
                  <img src={region.image} alt={`${region.name}のコーディネート`} />
                  <span><small>{region.area}</small><b>{region.name}</b><em>{region.title}</em></span>
                </button>
              ))}
            </div>
          )}

          {view === "world" && (
            <div className="rotationControls" aria-label="地球の回転速度を操作">
              <button onClick={accelerateBackward} aria-label="逆方向へ加速"><span>↶</span><small>BACK</small></button>
              <button className="rotationPause" onClick={() => setManualPaused((current) => !current)} aria-pressed={manualPaused} aria-label={manualPaused ? "回転を再開" : "回転を止める"}>
                <span>{manualPaused ? "▶" : "Ⅱ"}</span><small>{manualPaused ? "STOP" : `${rotationSpeed < 0 ? "−" : ""}${Math.abs(rotationSpeed).toFixed(2).replace(/0$/, "")}×`}</small>
              </button>
              <button onClick={accelerateForward} aria-label="正方向へ加速"><span>↷</span><small>FORWARD</small></button>
            </div>
          )}
        </div>

        <aside className="heroCopy">
          {view === "world" ? (
            <div className="copyIn">
              <p className="sectionIndex">ROOM HARMONY × GLOBAL COMMUNITY</p>
              <h1 className="worldTitle">
                <span className="titlePrelude">世界の部屋から、</span>
                <span className="titleStatement"><strong>自分らしい</strong><em>暮らしへ。</em></span>
              </h1>
              <p className="lead">世界のコーディネートを見つけて、AIの視点をヒントに、自分だけのPLANへ。気に入った暮らしは、次の誰かのために投稿できます。</p>
              <button className="primaryTextLink" onClick={enterCountry}>{activeMarket.jp}を深く見る <span>↗</span></button>
              <div className="featureActions" aria-label="Room Harmony の主な機能">
                <button className="featureAction aiAction" onClick={() => prototypeAction("AIルーム評価")}>
                  <span className="actionIcon" aria-hidden="true">✦</span>
                  <span><small>AI ROOM CHECK</small><b>AIに部屋を評価してもらう</b><em>色・配置・まとまりをヒントに</em></span>
                  <i aria-hidden="true">↗</i>
                </button>
                <button className="featureAction" onClick={() => prototypeAction("コーディネート投稿")}>
                  <span className="actionIcon" aria-hidden="true">＋</span>
                  <span><small>POST YOUR ROOM</small><b>コーディネートを投稿</b><em>REAL ROOMを共有</em></span>
                  <i aria-hidden="true">↗</i>
                </button>
                <button className="featureAction" onClick={() => prototypeAction("MY PLAN")}>
                  <span className="actionIcon" aria-hidden="true">♡</span>
                  <span><small>SAVE &amp; ADAPT</small><b>MY PLANをつくる</b><em>保存して自分向けに編集</em></span>
                  <i aria-hidden="true">↗</i>
                </button>
              </div>
              <div className="activeMarketLabel" key={activeMarket.slug}><span>{String(activeIndex + 1).padStart(2, "0")}</span><div><small>{activeMarket.kind === "market" ? "MARKET COORDINATE" : "GLOBAL COMMUNITY"}</small><b>{activeMarket.en}</b><em>{activeMarket.city}</em></div></div>
            </div>
          ) : selectedRegion ? (
            <div className="copyIn regionDetail" key={selectedRegion.name}>
              <p className="sectionIndex">03 — AREA COORDINATE</p>
              <div className="crumb"><button onClick={backToWorld}>WORLD</button><span>/</span><button onClick={() => setSelectedRegion(null)}>{activeMarket.en}</button><span>/</span><b>{selectedRegion.area}</b></div>
              <img className="detailThumb" src={selectedRegion.image} alt={`${selectedRegion.name}のコーディネート`} />
              <p className="detailArea">{activeMarket.jp} · {selectedRegion.name}</p>
              <h2>{selectedRegion.title}</h2>
              <span className="detailTag">#{selectedRegion.tag}</span>
              <div className="prototypeOptions">
                <button onClick={() => prototypeAction("コーディネート詳細")}>詳しく見る →</button>
                <button onClick={() => prototypeAction("保存・PLAN")}>♡ 保存・PLAN</button>
              </div>
              <p className="prototypeNote">詳しく見ると既存のコーデ検索へ、保存・PLANはMY PLANへ進みます。</p>
            </div>
          ) : (
            <div className="copyIn" key={`country-${activeMarket.slug}`}>
              <p className="sectionIndex">02 — LOCAL COORDINATES</p>
              <div className="crumb"><button onClick={backToWorld}>WORLD</button><span>/</span><b>{activeMarket.en}</b></div>
              <h1 className="countryTitle"><small>{activeMarket.en}</small>{activeMarket.jp}を、<br /><em>地域からめぐる。</em></h1>
              <p className="lead">{activeMarket.lead} 地図のまわりにある写真から、気になる地域を選んでください。</p>
              <p className="interactionHint"><i /> 写真を選ぶと詳細の選択肢が開きます</p>
            </div>
          )}
        </aside>

        {view === "world" && (
          <div className="marketRail" aria-label="世界のコーディネートを選択">
            {markets.map((market, index) => <button key={market.iso} className={index === activeIndex ? "active" : ""} onClick={() => selectMarket(index)}><span>{String(index + 1).padStart(2, "0")}</span>{market.jp}</button>)}
          </div>
        )}
      </section>

      <section className="marketScope" aria-label="グローバルコミュニティの候補地域">
        <span>MORE COMMUNITY STORIES</span>{otherMarkets.map((market) => <button key={market} onClick={() => prototypeAction(`${market}のコーディネート`)}>{market}<i>＋</i></button>)}
      </section>

      <section className="experience" id="how">
        <div className="experienceTitle"><p className="sectionIndex">HOW THE JOURNEY FLOWS</p><h2>眺めるだけで終わらない、<br />暮らしの発見へ。</h2></div>
        <div className="experienceSteps">
          <article><span>01</span><b>世界から見つける</b><p>地球と写真群から、心が動く国の暮らしを選ぶ。</p></article>
          <article><span>02</span><b>地域まで近づく</b><p>正確な国土輪郭と地域カードから、違いを楽しむ。</p></article>
          <article><span>03</span><b>自分の部屋につなぐ</b><p>AI評価、保存、MY PLAN、投稿へつながる選択肢を用意。</p></article>
        </div>
      </section>

      <section className="prototypeCta">
        <div><p>YOUR ROOM, YOUR STORY.</p><h2>次は、あなたの暮らしが<br />世界の誰かの発見になる。</h2></div>
        <button onClick={() => prototypeAction("投稿ページ")}>コーディネートを投稿する <span>↗</span></button>
        <div className="ctaWatermark" aria-hidden="true">ROOM<br />AROUND</div>
      </section>

      <footer><a className="brand footerBrand" href="#top"><span className="brandMark">RA</span><span><strong>Room Around</strong><small>GLOBAL COORDINATE DISCOVERY</small></span></a><p>暮らしのアイデアで、世界を近くに。</p><small>CONCEPT PROTOTYPE — NOT AN OFFICIAL NITORI SERVICE</small></footer>
      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </main>
  );
}
