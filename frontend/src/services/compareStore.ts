import { Car } from '../types/car';

const COMPARE_STORAGE_KEY = 'valuecars_compare_cars';

let listeners: Array<() => void> = [];
let compareCars: Car[] = [];

// Initialize from localStorage
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (raw) compareCars = JSON.parse(raw);
  } catch {
    compareCars = [];
  }
}

function notify() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareCars));
    } catch {}
  }
  listeners.forEach((listener) => listener());
}

export function subscribeCompare(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getCompareSnapshot(): Car[] {
  return compareCars;
}

export function getCompareServerSnapshot(): Car[] {
  return [];
}

export function toggleCompareCar(car: Car): boolean {
  const index = compareCars.findIndex((c) => c.id === car.id);
  if (index >= 0) {
    compareCars = compareCars.filter((c) => c.id !== car.id);
    notify();
    return false;
  } else {
    if (compareCars.length >= 3) {
      alert('You can compare up to 3 cars at a time.');
      return false;
    }
    compareCars = [...compareCars, car];
    notify();
    return true;
  }
}

export function removeCompareCar(carId: string) {
  compareCars = compareCars.filter((c) => c.id !== carId);
  notify();
}

export function clearCompare() {
  compareCars = [];
  notify();
}
