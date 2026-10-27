"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { initialBudgetData, type BudgetData } from "./types";

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
//
// The budget currently lives in localStorage. Everything goes through the
// BudgetStore interface below, so swapping in a server/database source later
// means writing one more implementation of this interface — the hook and all
// the UI stay unchanged.

export interface BudgetStore {
  load(): BudgetData | null;
  save(data: BudgetData): void;
}

const STORAGE_KEY = "budget:v1";

/** localStorage-backed store. No-ops gracefully on the server / when blocked. */
export const localStorageBudgetStore: BudgetStore = {
  load() {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      // Shallow-merge over defaults so older saved shapes gain new fields.
      return { ...initialBudgetData, ...(JSON.parse(raw) as BudgetData) };
    } catch {
      return null;
    }
  },
  save(data) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or unavailable — the in-memory state still works.
    }
  },
};

/**
 * Owns the budget state and keeps it persisted through the given store.
 *
 * Reads via `useSyncExternalStore` so the server render and the first client
 * render both use {@link initialBudgetData} (the server snapshot), avoiding a
 * hydration mismatch, then the real saved value is read on the client. State
 * lives in a ref and changes are broadcast to subscribers — the external store
 * here is "the saved budget", with localStorage as its backing medium.
 */
export function useBudgetData(store: BudgetStore = localStorageBudgetStore) {
  // One subscriber set + cached snapshot per hook instance.
  const ref = useRef<{
    data: BudgetData;
    listeners: Set<() => void>;
    hydrated: boolean;
  }>(null);

  if (ref.current === null) {
    ref.current = {
      data: initialBudgetData,
      listeners: new Set(),
      hydrated: false,
    };
  }
  const self = ref.current;

  const subscribe = useCallback(
    (onChange: () => void) => {
      self.listeners.add(onChange);
      // First subscription (client only) hydrates from the store.
      if (!self.hydrated) {
        self.hydrated = true;
        const saved = store.load();
        if (saved) {
          self.data = saved;
          self.listeners.forEach((l) => l());
        }
      }
      return () => self.listeners.delete(onChange);
    },
    [self, store],
  );

  const getSnapshot = useCallback(() => self.data, [self]);
  const getServerSnapshot = useCallback(() => initialBudgetData, []);

  const data = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const updateData = useCallback(
    (patch: Partial<BudgetData>) => {
      self.data = { ...self.data, ...patch };
      store.save(self.data);
      self.listeners.forEach((l) => l());
    },
    [self, store],
  );

  return { data, updateData };
}
