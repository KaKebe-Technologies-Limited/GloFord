"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

interface ActivityEvent {
  id: string;
  action: string;
  module: string;
  entityType: string | null;
  entityId: string | null;
  userId: string | null;
  createdAt: string;
}

export function LiveActivityFeed() {
  const t = useTranslations("admin.analytics");
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource("/api/admin/activity-stream");
    esRef.current = es;

    es.addEventListener("init", (e: MessageEvent) => {
      const initial: ActivityEvent[] = JSON.parse(e.data);
      setEvents(initial.slice(-6));
      setConnected(true);
    });

    es.addEventListener("activity", (e: MessageEvent) => {
      const evt: ActivityEvent = JSON.parse(e.data);
      setEvents((prev) => [...prev.slice(-5), evt]);
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      // Reconnect after 10s
      setTimeout(connect, 10000);
    };

    es.onopen = () => {
      setConnected(true);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
    };
  }, [connect]);

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-[var(--color-muted-fg)]" aria-hidden="true" />
          <h3 className="text-[13px] font-semibold text-[var(--color-fg)]">
            {t("liveActivity")}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              connected
                ? "bg-[var(--color-success)] shadow-[0_0_6px_rgb(var(--token-success)/0.5)]"
                : "bg-[var(--color-muted-fg)]"
            }`}
          />
          <span className="text-[11px] text-[var(--color-muted-fg)]">
            {connected ? t("liveConnected") : t("liveReconnecting")}
          </span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity className="h-5 w-5 text-[var(--color-muted-fg)]" />
          <p className="mt-2 text-[12px] text-[var(--color-muted-fg)]">
            {t("liveWaiting")}
          </p>
        </div>
      ) : (
        <ul className="max-h-[240px] overflow-y-auto">
          <AnimatePresence initial={false}>
            {events.map((evt) => (
              <motion.li
                key={evt.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-2.5 last:border-0"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[rgb(var(--token-primary)/0.08)]">
                  <Activity className="h-3 w-3 text-[var(--color-primary)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-[var(--color-fg)]">
                    {evt.action}
                    {evt.entityType && (
                      <span className="ml-1 font-normal text-[var(--color-muted-fg)]">
                        on {evt.entityType}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-[var(--color-muted-fg)]">
                    {evt.module} &middot; {new Date(evt.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
