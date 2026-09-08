import type { CarFilterOptions } from '../services/api';

/**
 * Small, dependency-free localStorage helpers for persisting UI state
 * (active filters + recently-viewed cars) so the static site "remembers"
 * a returning visitor between page loads.
 *
 * Everything degrades to no-ops/empty when storage is unavailable.
 */

const FILTERS_KEY = 'vc:ui:filters';
const RECENT_KEY = 'vc:ui:recent';
const MAX_RECENT = 6;

/** Load persisted marketplace filters (merged by the caller over defaults). */
export function loadFilters(): CarFilterOptions {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(FILTERS_KEY);
    return raw ? (JSON.parse(raw) as CarFilterOptions) : {};
  } catch {
    return {};
  }
}

/** Persist the current marketplace filters. */
export function saveFilters(filters: CarFilterOptions): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // Storage full / disabled — non-fatal.
  }
}

export interface RecentCar {
  id: string;
  year: number;
  make: string;
  model: string;
  title: string;
  price: number;
  image: string;
}

/** Stored recently-viewed cars, most recent first. */
export function getRecentCars(): RecentCar[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as RecentCar[]) : [];
  } catch {
    return [];
  }
}

/** Prepend a freshly-viewed car (deduped, capped) and return the new list. */
export function addRecentCar(car: RecentCar): RecentCar[] {
  const list = getRecentCars().filter((c) => c.id !== car.id);
  list.unshift(car);
  const trimmed = list.slice(0, MAX_RECENT);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
    } catch {
      // Non-fatal.
    }
  }
  return trimmed;
}