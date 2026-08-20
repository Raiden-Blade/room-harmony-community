import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "scrollTo", { value: () => undefined, writable: true });
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: () => null, writable: true });
Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
  value: () => "data:image/jpeg;base64,dGVzdA==",
  writable: true,
});
