"use client";

import { useEffect, useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { addLine, applyCartChanges, sanitizeLines, setQuantity, type CartLine } from "./logic";

type CartState = {
  lines: CartLine[];
  /** True while the cart drawer is open. */
  isOpen: boolean;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  applyChanges: (changes: Parameters<typeof applyCartChanges>[1]) => void;
  open: () => void;
  close: () => void;
};

/**
 * The cart lives in localStorage so it survives reloads. It is hydrated on
 * the client after the first render (see useCartHydrated) to avoid
 * server/client mismatches.
 */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      add: (line, quantity = 1) => set((s) => ({ lines: addLine(s.lines, line, quantity) })),
      setQuantity: (variantId, quantity) =>
        set((s) => ({ lines: setQuantity(s.lines, variantId, quantity) })),
      remove: (variantId) => set((s) => ({ lines: setQuantity(s.lines, variantId, 0) })),
      clear: () => set({ lines: [] }),
      applyChanges: (changes) => set((s) => ({ lines: applyCartChanges(s.lines, changes) })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "ksheera-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
      merge: (persisted, current) => ({
        ...current,
        lines: sanitizeLines((persisted as { lines?: unknown } | undefined)?.lines),
      }),
      skipHydration: true,
    },
  ),
);

function subscribeHydration(onChange: () => void) {
  return useCart.persist.onFinishHydration(onChange);
}

/** Loads the stored cart once on the client; returns true when it is loaded. */
export function useCartHydrated(): boolean {
  useEffect(() => {
    if (!useCart.persist.hasHydrated()) void useCart.persist.rehydrate();
  }, []);
  return useSyncExternalStore(
    subscribeHydration,
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}
