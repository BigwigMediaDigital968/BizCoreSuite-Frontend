// src/utils/loadStringeeSdk.ts
const STRINGEE_SDK_URL =
  "https://cdn.stringee.com/sdk/latest/js/stringee-1.0.10.min.js";

let loadPromise: Promise<void> | null = null;

export const loadStringeeSdk = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).StringeeClient) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${STRINGEE_SDK_URL}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Stringee SDK"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = STRINGEE_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Stringee SDK"));
    document.head.appendChild(script);
  });

  return loadPromise;
};