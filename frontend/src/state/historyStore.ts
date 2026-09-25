import { useSyncExternalStore } from 'react';
import type { CalculationItem } from '../types/calculator';
import { fetchHistoryAPI } from '../services/apiClient';

class HistoryStore {
  private items: CalculationItem[] = [];
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): CalculationItem[] => {
    return this.items;
  };

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  addCalculation(calc: CalculationItem) {
    // Keep max 20, newest first
    this.items = [calc, ...this.items.filter((item) => item.id !== calc.id)].slice(0, 20);
    this.notify();
  }

  setHistory(items: CalculationItem[]) {
    this.items = items.slice(0, 20);
    this.notify();
  }

  async syncWithBackend() {
    try {
      const items = await fetchHistoryAPI();
      this.setHistory(items);
    } catch {
      // Retain existing client state if network fails
    }
  }

  clear() {
    this.items = [];
    this.notify();
  }
}

export const historyStore = new HistoryStore();

export function useHistory(): CalculationItem[] {
  return useSyncExternalStore(historyStore.subscribe, historyStore.getSnapshot);
}
