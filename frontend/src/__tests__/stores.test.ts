import { describe, it, expect, vi, beforeEach } from 'vitest';
import { historyStore } from '../state/historyStore';
import { networkStore } from '../state/networkStore';
import type { CalculationItem } from '../types/calculator';

describe('External Stores (useSyncExternalStore)', () => {
  beforeEach(() => {
    historyStore.clear();
    vi.restoreAllMocks();
  });

  describe('historyStore', () => {
    it('initializes with empty items', () => {
      expect(historyStore.getSnapshot()).toEqual([]);
    });

    it('adds calculation items keeping newest first and capped at 20', () => {
      for (let i = 1; i <= 25; i++) {
        const item: CalculationItem = {
          id: `${i}`,
          operation: 'add',
          a: `${i}`,
          b: '1',
          result: `${i + 1}`,
          expression: `${i} + 1 = ${i + 1}`,
          timestamp: new Date().toISOString(),
        };
        historyStore.addCalculation(item);
      }

      const snapshot = historyStore.getSnapshot();
      expect(snapshot.length).toBe(20);
      expect(snapshot[0].id).toBe('25');
      expect(snapshot[19].id).toBe('6');
    });

    it('notifies subscribers on mutation', () => {
      const listener = vi.fn();
      const unsubscribe = historyStore.subscribe(listener);

      historyStore.addCalculation({
        id: '1',
        operation: 'add',
        a: '1',
        b: '2',
        result: '3',
        expression: '1 + 2 = 3',
        timestamp: new Date().toISOString(),
      });

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      historyStore.addCalculation({
        id: '2',
        operation: 'add',
        a: '2',
        b: '2',
        result: '4',
        expression: '2 + 2 = 4',
        timestamp: new Date().toISOString(),
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('syncWithBackend updates history on success', async () => {
      const mockItems: CalculationItem[] = [
        {
          id: '10',
          operation: 'sqrt',
          a: '100',
          b: null,
          result: '10',
          expression: 'sqrt(100) = 10',
          timestamp: new Date().toISOString(),
        },
      ];

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: mockItems, total: 1 }),
      });

      await historyStore.syncWithBackend();
      expect(historyStore.getSnapshot()).toEqual(mockItems);
    });

    it('syncWithBackend silently retains state if network fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
      await historyStore.syncWithBackend();
      expect(historyStore.getSnapshot()).toEqual([]);
    });
  });

  describe('networkStore', () => {
    it('returns boolean snapshot', () => {
      expect(typeof networkStore.getSnapshot()).toBe('boolean');
    });

    it('subscribes and unsubscribes cleanly', () => {
      const listener = vi.fn();
      const unsubscribe = networkStore.subscribe(listener);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('updates snapshot and notifies listeners on online and offline events', () => {
      const listener = vi.fn();
      const unsubscribe = networkStore.subscribe(listener);

      window.dispatchEvent(new Event('offline'));
      expect(networkStore.getSnapshot()).toBe(false);
      expect(listener).toHaveBeenCalled();

      window.dispatchEvent(new Event('online'));
      expect(networkStore.getSnapshot()).toBe(true);
      unsubscribe();
    });
  });
});
