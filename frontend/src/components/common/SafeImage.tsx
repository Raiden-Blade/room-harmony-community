import { ImgHTMLAttributes, useEffect, useState } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
  fallbackLabel?: string;
};

export function SafeImage({
  src = "",
  fallbackSrc = "/assets/room-fallback.svg",
  fallbackLabel,
  onError,
  ...props
}: Props) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setUsingFallback(false);
  }, [src]);

  return (
    <>
      <img
        {...props}
        src={currentSrc}
        onError={(event) => {
          onError?.(event);
          if (currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
            setUsingFallback(true);
          }
        }}
      />
      {usingFallback && fallbackLabel && <span className="image-fallback-label" role="status">{fallbackLabel}</span>}
    </>
  );
}
