import { useEffect, useRef } from "react";

type Position = [number, number];
type Geometry = { type: "Polygon" | "MultiPolygon"; coordinates: Position[][] | Position[][][] };
type CountryFeature = { geometry: Geometry; properties: { ADM0_A3: string; NAME: string } };
type FeatureCollection = { features: CountryFeature[] };

type Props = {
  activeIso: string;
  activeLatitude: number;
  activeLongitude: number;
  mode: "world" | "country";
  paused: boolean;
  rotationSpeed: number;
  stops: Array<{ index: number; activationLongitude: number }>;
  regions: Array<{ longitude: number; latitude: number }>;
  onFacing: (index: number) => void;
  onProjection: (projection: { x: number; y: number; depth: number; opacity: number; scale: number }) => void;
  onRegionProjection: (points: Array<{ x: number; y: number }>) => void;
};

const rad = (value: number) => value * Math.PI / 180;
const shortestAngle = (from: number, to: number) => ((to - from + 540) % 360) - 180;

function polygonsOf(feature: CountryFeature) {
  return feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates as Position[][]]
    : feature.geometry.coordinates as Position[][][];
}
export function GlobeCanvas({ activeIso, activeLatitude, activeLongitude, mode, paused, rotationSpeed, stops, regions, onFacing, onProjection, onRegionProjection }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ activeIso, activeLatitude, activeLongitude, mode, paused, rotationSpeed, stops, regions, onFacing, onProjection, onRegionProjection });

  useEffect(() => {
    stateRef.current = { activeIso, activeLatitude, activeLongitude, mode, paused, rotationSpeed, stops, regions, onFacing, onProjection, onRegionProjection };
  }, [activeIso, activeLatitude, activeLongitude, mode, paused, rotationSpeed, stops, regions, onFacing, onProjection, onRegionProjection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maybeContext = canvas.getContext("2d");
    if (!maybeContext) return;
    const context: CanvasRenderingContext2D = maybeContext;

    let frame = 0;
    let world: CountryFeature[] = [];
    let markets: CountryFeature[] = [];
    let longitude = stateRef.current.activeLongitude;
    let facingIndex = -1;
    let transition = stateRef.current.mode === "country" ? 1 : 0;
    let previous = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const size = Math.max(280, Math.round(canvas.clientWidth));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * ratio;
      canvas.height = size * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    function globePoint(lon: number, lat: number, radius: number, cx: number, cy: number) {
      const lambda = rad(lon - longitude);
      const phi = rad(lat);
      return {
        visible: Math.cos(phi) * Math.cos(lambda) > 0,
        x: cx + radius * Math.cos(phi) * Math.sin(lambda),
        y: cy - radius * Math.sin(phi),
      };
    }

    function globeRing(ring: Position[], radius: number, cx: number, cy: number) {
      let drawing = false;
      context.beginPath();
      const step = ring.length > 240 ? Math.ceil(ring.length / 240) : 1;
      for (let index = 0; index < ring.length; index += step) {
        const [lon, lat] = ring[index];
        const point = globePoint(lon, lat, radius, cx, cy);
        if (!point.visible) { drawing = false; continue; }
        if (!drawing) { context.moveTo(point.x, point.y); drawing = true; }
        else context.lineTo(point.x, point.y);
      }
      context.closePath();
    }

    function drawGlobe(size: number, alpha: number) {
      if (alpha <= .01) return;
      const cx = size / 2;
      const cy = size / 2;
      const radius = size * .448 * (1 - transition * .08);
      context.save();
      context.globalAlpha = alpha;
      context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.clip();

      const ocean = context.createRadialGradient(cx - radius * .38, cy - radius * .42, radius * .03, cx, cy, radius * 1.14);
      ocean.addColorStop(0, "#eef9ed"); ocean.addColorStop(.3, "#a8dccc"); ocean.addColorStop(.73, "#319d83"); ocean.addColorStop(1, "#095d50");
      context.fillStyle = ocean; context.fillRect(0, 0, size, size);

      context.strokeStyle = "rgba(255,255,255,.22)"; context.lineWidth = .7;
      for (let lat = -60; lat <= 60; lat += 30) {
        const ring: Position[] = [];
        for (let lon = -180; lon <= 180; lon += 3) ring.push([lon, lat]);
        globeRing(ring, radius, cx, cy); context.stroke();
      }
      for (let lon = -180; lon < 180; lon += 30) {
        const ring: Position[] = [];
        for (let lat = -88; lat <= 88; lat += 2) ring.push([lon, lat]);
        globeRing(ring, radius, cx, cy); context.stroke();
      }

      for (const feature of world) {
        const selected = feature.properties.ADM0_A3 === stateRef.current.activeIso
          || (stateRef.current.activeIso === "CHN" && feature.properties.ADM0_A3 === "TWN");
        context.fillStyle = selected ? "#e2ea76" : "#d5e2a0";
        context.strokeStyle = selected ? "rgba(22,84,68,.82)" : "rgba(24,87,70,.36)";
        context.lineWidth = selected ? 1.7 : .58;
        for (const polygon of polygonsOf(feature)) {
          for (const ring of polygon) globeRing(ring, radius, cx, cy);
          context.fill("evenodd"); context.stroke();
        }
      }
      context.restore();

      context.save(); context.globalAlpha = alpha;
      const shine = context.createRadialGradient(cx - radius * .36, cy - radius * .4, 0, cx - radius * .36, cy - radius * .4, radius * .67);
      shine.addColorStop(0, "rgba(255,255,255,.36)"); shine.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = shine; context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.fill();
      context.strokeStyle = "rgba(8,86,71,.25)"; context.lineWidth = 1.2; context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.stroke();
      context.restore();
    }

    function drawCountry(size: number, alpha: number) {
      if (alpha <= .01) return;
      const feature = markets.find((item) => item.properties.ADM0_A3 === stateRef.current.activeIso)
        ?? world.find((item) => item.properties.ADM0_A3 === stateRef.current.activeIso);
      if (!feature) return;
      const related = stateRef.current.activeIso === "CHN"
        ? [feature, world.find((item) => item.properties.ADM0_A3 === "TWN")].filter(Boolean) as CountryFeature[]
        : [feature];
      const polygons = related.flatMap(polygonsOf);
      const points = polygons.flat(2) as Position[];
      const minLon = Math.min(...points.map(([lon]) => lon));
      const maxLon = Math.max(...points.map(([lon]) => lon));
      const minLat = Math.min(...points.map(([, lat]) => lat));
      const maxLat = Math.max(...points.map(([, lat]) => lat));
      const midLon = (minLon + maxLon) / 2;
      const midLat = (minLat + maxLat) / 2;
      const lonFactor = Math.cos(rad(midLat));
      const scale = Math.min(size * .66 / Math.max(1, (maxLon - minLon) * lonFactor), size * .72 / Math.max(1, maxLat - minLat));
      const project = ([lon, lat]: Position) => [size / 2 + (lon - midLon) * lonFactor * scale, size / 2 - (lat - midLat) * scale] as const;

      context.save(); context.globalAlpha = alpha;
      context.shadowColor = "rgba(18,91,73,.2)"; context.shadowBlur = 30; context.shadowOffsetY = 22;
      for (const polygon of polygons) {
        context.beginPath();
        for (const ring of polygon) {
          ring.forEach((point, index) => { const [x, y] = project(point); if (index === 0) context.moveTo(x, y); else context.lineTo(x, y); });
          context.closePath();
        }
        const wash = context.createLinearGradient(size * .2, size * .15, size * .8, size * .85);
        wash.addColorStop(0, "#b7ddc4"); wash.addColorStop(.58, "#62b39c"); wash.addColorStop(1, "#19816d");
        context.fillStyle = wash; context.fill("evenodd");
      }
      context.shadowColor = "transparent";
      context.strokeStyle = "rgba(13,91,72,.58)"; context.lineWidth = 1.1;
      for (const polygon of polygons) {
        context.beginPath();
        for (const ring of polygon) {
          ring.forEach((point, index) => { const [x, y] = project(point); if (index === 0) context.moveTo(x, y); else context.lineTo(x, y); }); context.closePath();
        }
        context.stroke();
      }
      context.globalCompositeOperation = "source-atop";
      context.strokeStyle = "rgba(255,255,255,.16)"; context.lineWidth = .7;
      for (let x = size * .15; x < size * .9; x += 19) { context.beginPath(); context.moveTo(x, size * .1); context.lineTo(x + size * .45, size * .9); context.stroke(); }
      context.restore();
      stateRef.current.onRegionProjection(stateRef.current.regions.map((region) => {
        const [x, y] = project([region.longitude, region.latitude]);
        return { x, y };
      }));
    }

    const draw = (now: number) => {
      const elapsed = Math.min(48, now - previous); previous = now;
      const state = stateRef.current;
      if (!reducedMotion && !state.paused && state.mode === "world") longitude = (longitude + elapsed * .0042 * state.rotationSpeed + 360) % 360;
      if (state.mode === "world" && state.stops.length) {
        const nearest = state.stops.reduce((best, stop) => {
          const distance = Math.abs(shortestAngle(longitude, stop.activationLongitude));
          return distance < best.distance ? { index: stop.index, distance } : best;
        }, { index: state.stops[0].index, distance: Number.POSITIVE_INFINITY });
        if (nearest.index !== facingIndex) {
          facingIndex = nearest.index;
          state.onFacing(nearest.index);
        }
      }

      const targetTransition = state.mode === "country" ? 1 : 0;
      transition += (targetTransition - transition) * Math.min(.09, elapsed * .0032);
      const size = canvas.clientWidth;
      context.clearRect(0, 0, size, size);
      drawGlobe(size, 1 - transition);
      drawCountry(size, transition);

      const anchor = globePoint(state.activeLongitude, state.activeLatitude, size * .448 * (1 - transition * .08), size / 2, size / 2);
      const lambda = rad(state.activeLongitude - longitude);
      const depth = Math.cos(rad(state.activeLatitude)) * Math.cos(lambda);
      const visibility = Math.max(0, Math.min(1, (depth - .02) / .55));
      const opacity = visibility * visibility * (3 - 2 * visibility) * (1 - transition);
      state.onProjection({ x: anchor.x, y: anchor.y, depth, opacity, scale: .56 + visibility * .4 });
      frame = requestAnimationFrame(draw);
    };

    Promise.all([
      fetch("/data/world.geojson").then((response) => response.json()),
      fetch("/data/markets.geojson").then((response) => response.json()),
    ]).then(([worldData, marketData]: FeatureCollection[]) => {
      world = worldData.features; markets = marketData.features;
    }).catch(() => { world = []; markets = []; });

    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} className="geoCanvas" aria-label={mode === "world" ? "正確な国境データを使った地球" : `${activeIso}の正確な国土輪郭`} />;
}
