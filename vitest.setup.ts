import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "PointerEvent", {
  configurable: true,
  value: MouseEvent,
});

Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
  configurable: true,
  value: () => undefined,
});

Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
  configurable: true,
  value: () => undefined,
});
