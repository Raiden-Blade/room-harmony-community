import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { SafeImage } from "../common/SafeImage";

export const HERO_SLIDES = [
  {
    id: "newlife-storage",
    image: "/assets/hero/nitori/newlife-storage.webp",
    alt: "NITORI公式新生活特集の、シンプルな家具と収納を取り入れた部屋の参考画像",
    kicker: "シンプルにそろえる部屋",
    title: "収納を取り入れて、毎日の余白をつくる",
    cta: "収納の参考コーデを見る",
    to: "/explore?need=STORAGE",
  },
  {
    id: "compact-living",
    image: "/assets/hero/nitori/compact-living.webp",
    alt: "NITORI公式新生活特集の、デスクと飾る収納を組み合わせた部屋の参考画像",
    kicker: "好きなものを楽しむ部屋",
    title: "見せる・隠すを分けて、好きを楽しむ",
    cta: "収納の参考コーデを見る",
    to: "/explore?need=STORAGE",
  },
  {
    id: "work-relax",
    image: "/assets/hero/nitori/work-relax.webp",
    alt: "NITORI公式新生活特集の、昇降デスクとチェアを中心にした部屋の参考画像",
    kicker: "集中できるワークスペース",
    title: "作業に集中できる家具構成から考える",
    cta: "在宅作業の参考コーデを見る",
    to: "/explore?need=WORK_FROM_HOME",
  },
  {
    id: "seasonal-bedroom",
    image: "/assets/hero/nitori/seasonal-bedroom.webp",
    alt: "NITORI公式新生活特集の、ベッド上の収納ラックで空間を使い分ける部屋の参考画像",
    kicker: "限られた空間を使い分ける部屋",
    title: "収納と可変家具で、過ごし方を切り替える",
    cta: "省スペースの参考コーデを見る",
    to: "/explore?need=COMPACT",
  },
] as const;

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || prefersReducedMotion) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % HERO_SLIDES.length),
      8000,
    );
    return () => window.clearInterval(timer);
  }, [paused]);

  const slide = HERO_SLIDES[active];
  const move = (offset: number) => setActive(
    (current) => (current + offset + HERO_SLIDES.length) % HERO_SLIDES.length,
  );

  return (
    <div
      className="hero-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="暮らしのテーマから探す4つの入口"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="hero-carousel__media">
        <SafeImage
          key={slide.id}
          src={slide.image}
          fallbackSrc="/assets/room-fallback.svg"
          fallbackLabel="参照画像を表示できないため、デモ画像を表示中"
          alt={slide.alt}
          loading={active === 0 ? "eager" : "lazy"}
        />
        <button className="hero-carousel__arrow hero-carousel__arrow--previous" type="button" onClick={() => move(-1)} aria-label="前の部屋を見る">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <button className="hero-carousel__arrow hero-carousel__arrow--next" type="button" onClick={() => move(1)} aria-label="次の部屋を見る">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </button>
        <div className="hero-carousel__dots" aria-label="スライドを選ぶ">
          {HERO_SLIDES.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === active ? "is-active" : ""}
              onClick={() => setActive(index)}
              aria-label={`${index + 1}枚目: ${item.kicker}`}
              aria-current={index === active ? "true" : undefined}
            />
          ))}
        </div>
      </div>
      <div className="hero-carousel__caption" aria-live="polite">
        <span>{slide.kicker}</span>
        <strong>{slide.title}</strong>
        <Link to={slide.to}>{slide.cta} →</Link>
      </div>
      <p className="hero-carousel__source">使用許可を得たNITORI公式新生活特集の参照画像をローカル収録</p>
    </div>
  );
}
