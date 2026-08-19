import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { SafeImage } from "../common/SafeImage";

const slides = [
  {
    id: "newlife-storage",
    image: "/assets/hero/nitori/newlife-storage.webp",
    alt: "NITORI公式新生活特集の、収納を取り入れた明るいワンルーム参考画像",
    kicker: "6畳・収納・5万円以内",
    title: "新生活の最初の部屋を、空間ごとに考える",
    cta: "この条件に近い事例を見る",
    to: "/explore?room_size=SMALL_6&need=STORAGE&budget_max=50000",
  },
  {
    id: "compact-living",
    image: "/assets/hero/nitori/compact-living.webp",
    alt: "NITORI公式新生活特集の、限られた広さを活かしたワンルーム参考画像",
    kicker: "5.5畳・コンパクト・5万円以内",
    title: "狭さを隠さず、動ける余白を残す",
    cta: "コンパクトな事例を見る",
    to: "/explore?room_size=TINY_5_5&need=COMPACT&budget_max=50000",
  },
  {
    id: "work-relax",
    image: "/assets/hero/nitori/work-relax.webp",
    alt: "NITORI公式新生活特集の、作業とくつろぎを両立した部屋の参考画像",
    kicker: "6畳・在宅作業・8万円以内",
    title: "仕事と休息を、一つの部屋で切り替える",
    cta: "デスク環境の事例を見る",
    to: "/explore?room_size=SMALL_6&need=WORK_FROM_HOME&budget_max=80000",
  },
  {
    id: "seasonal-bedroom",
    image: "/assets/hero/nitori/seasonal-bedroom.webp",
    alt: "NITORI公式新生活特集の、落ち着いたベッドまわりの参考画像",
    kicker: "前年の事例・今年のPLAN",
    title: "季節の事例を、自分の暮らしへ引き継ぐ",
    cta: "季節テーマを見る",
    to: "/seasonal",
  },
] as const;

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || prefersReducedMotion) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 8000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const slide = slides[active];
  const move = (offset: number) => setActive((current) => (current + offset + slides.length) % slides.length);

  return (
    <div
      className="hero-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="暮らしの条件から探す4つの入口"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <SafeImage
        key={slide.id}
        src={slide.image}
        fallbackSrc="/assets/room-fallback.svg"
        alt={slide.alt}
        loading={active === 0 ? "eager" : "lazy"}
      />
      <div className="hero-carousel__caption" aria-live="polite">
        <span>{slide.kicker}</span>
        <strong>{slide.title}</strong>
        <Link to={slide.to}>{slide.cta} →</Link>
      </div>
      <button className="hero-carousel__arrow hero-carousel__arrow--previous" type="button" onClick={() => move(-1)} aria-label="前の部屋を見る">‹</button>
      <button className="hero-carousel__arrow hero-carousel__arrow--next" type="button" onClick={() => move(1)} aria-label="次の部屋を見る">›</button>
      <div className="hero-carousel__dots" aria-label="スライドを選ぶ">
        {slides.map((item, index) => (
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
      <p className="hero-carousel__source">使用許可を得たNITORI公式新生活特集の参照画像をローカル収録</p>
    </div>
  );
}
