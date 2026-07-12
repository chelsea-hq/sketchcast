const STORAGE_KEY = "sketchcast.brand-kit.v1";

export interface BrandKit {
  accent: string;
  signature: string;
}
export const DEFAULT_BRAND_KIT: BrandKit = {
  accent: "#6366f1",
  signature: "",
};

const HEX = /^#[0-9a-f]{6}$/i;

export function getBrandKit(): BrandKit {
  if (typeof window === "undefined") return DEFAULT_BRAND_KIT;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<BrandKit> | null;
    return {
      accent: parsed?.accent && HEX.test(parsed.accent) ? parsed.accent : DEFAULT_BRAND_KIT.accent,
      signature: typeof parsed?.signature === "string" ? parsed.signature.slice(0, 50) : "",
    };
  } catch {
    return DEFAULT_BRAND_KIT;
  }
}

export function saveBrandKit(brandKit: BrandKit): BrandKit {
  const safe = {
    accent: HEX.test(brandKit.accent) ? brandKit.accent : DEFAULT_BRAND_KIT.accent,
    signature: brandKit.signature.trim().slice(0, 50),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  return safe;
}
