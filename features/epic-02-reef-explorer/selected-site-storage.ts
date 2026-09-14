import type { ReefSite } from "./types";

export const selectedReefSiteStorageKey = "reefcare-my-i2-selected-reef-site";

export type StoredReefSite = Pick<ReefSite, "id" | "name" | "publicAreaLabel">;

export function storeSelectedReefSite(site: ReefSite) {
  if (typeof window === "undefined") return;
  const stored: StoredReefSite = {
    id: site.id,
    name: site.name,
    publicAreaLabel: site.publicAreaLabel,
  };
  window.localStorage.setItem(selectedReefSiteStorageKey, JSON.stringify(stored));
}

export function readSelectedReefSite(): StoredReefSite | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(selectedReefSiteStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredReefSite>;
    if (
      typeof parsed.id !== "string"
      || typeof parsed.name !== "string"
      || typeof parsed.publicAreaLabel !== "string"
    ) {
      window.localStorage.removeItem(selectedReefSiteStorageKey);
      return null;
    }
    return parsed as StoredReefSite;
  } catch {
    window.localStorage.removeItem(selectedReefSiteStorageKey);
    return null;
  }
}

export function clearSelectedReefSite() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(selectedReefSiteStorageKey);
}

