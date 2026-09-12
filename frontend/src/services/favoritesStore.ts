'use client';

// Lightweight module-level favorites store kept in sync via useSyncExternalStore.
// It mirrors the backend `/favorites` list so hearts light up consistently across
// the home grid, the detail page, and /saved without a full refetch on every toggle.
import { apiClient } from './api';

const KEY = 'valuecars_favorite_ids';

let ids: Set<string> = new Set();
let hydrated = false;
const listeners = new Set<() => void>();

function load(): void {
  if (hydrated) return;
  hydrated = true;
  try {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(KEY);
      if (raw) ids = new Set(JSON.parse(raw) as string[]);
    }
  } catch {
    // Corrupt cache -> start empty.
  }
}

function emit(): void {
  ids = new Set(ids); // new reference so useSyncExternalStore re-renders listeners
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(KEY, JSON.stringify(Array.from(ids)));
    }
  } catch {
    // Storage unavailable (private mode) -> keep in-memory only.
  }
  listeners.forEach((l) => l());
}

export function subscribe(cb: () => void): () => void {
  load();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getSnapshot(): Set<string> {
  load();
  return ids;
}

export function isFavorited(carId: string): boolean {
  load();
  return ids.has(carId);
}

/** Sync a known favorites list (e.g. after login or visiting /saved). */
export function setFavorites(carIds: string[]): void {
  ids = new Set(carIds);
  emit();
}

/** Calls the backend toggle; throws if the user is not authenticated. */
export async function toggleFavorite(carId: string): Promise<boolean> {
  const res = await apiClient.toggleFavorite(carId);
  if (res.is_favorited) {
    ids.add(carId);
  } else {
    ids.delete(carId);
  }
  emit();
  return res.is_favorited;
}