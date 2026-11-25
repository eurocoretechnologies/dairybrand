"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Incoming = { id: string; reference: string; customerName: string };

/** Two soft tones. Browsers only play sound after the page has been interacted with. */
function chime() {
  try {
    const ctx = new AudioContext();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.32);
    });
    setTimeout(() => void ctx.close(), 1000);
  } catch {
    // Sound is a nice-to-have.
  }
}

/**
 * Listens for new and changed orders while the dashboard is open: refreshes
 * the page, plays a chime and shows a notice for new orders, and puts the
 * count of unseen orders in the tab title.
 */
export function RealtimeOrders() {
  const router = useRouter();
  const [incoming, setIncoming] = useState<Incoming[]>([]);
  const baseTitle = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel("owner-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const row = payload.new as { id: string; reference: string; customer_name: string };
        setIncoming((list) =>
          [
            { id: row.id, reference: row.reference, customerName: row.customer_name },
            ...list,
          ].slice(0, 5),
        );
        chime();
        router.refresh();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => {
        router.refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  useEffect(() => {
    baseTitle.current ??= document.title.replace(/^\(\d+\)\s*/, "");
    document.title = incoming.length
      ? `(${incoming.length}) ${baseTitle.current}`
      : baseTitle.current;
  }, [incoming]);

  if (incoming.length === 0) return null;
  return (
    <div
      role="status"
      className="fixed right-4 bottom-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {incoming.map((o) => (
        <div
          key={o.id}
          className="flex items-center justify-between gap-3 rounded-2xl bg-primary p-4 text-on-primary shadow-xl"
        >
          <Link
            href={`/admin/orders/${o.id}`}
            className="min-w-0"
            onClick={() => setIncoming((l) => l.filter((x) => x.id !== o.id))}
          >
            <span className="block text-xs tracking-[0.12em] uppercase opacity-80">New order</span>
            <span className="block truncate font-semibold">
              {o.reference} · {o.customerName}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setIncoming((l) => l.filter((x) => x.id !== o.id))}
            aria-label={`Dismiss ${o.reference}`}
            className="flex size-11 flex-none items-center justify-center rounded-full hover:bg-on-primary/10"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
