import { useSyncExternalStore } from 'react';

class NetworkStore {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notify();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notify();
  };

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): boolean => {
    return this.isOnline;
  };
}

export const networkStore = new NetworkStore();

export function useNetworkStatus(): boolean {
  return useSyncExternalStore(networkStore.subscribe, networkStore.getSnapshot);
}
