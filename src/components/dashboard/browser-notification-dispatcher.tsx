"use client";

import { useEffect } from "react";

import { markBrowserNotificationsSent } from "@/app/actions";
import type { AppNotification } from "@/lib/generator-types";

interface BrowserNotificationDispatcherProps {
  notifications: AppNotification[];
}

export function BrowserNotificationDispatcher({ notifications }: BrowserNotificationDispatcherProps) {
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted" || notifications.length === 0) return;
    const pending = notifications.filter((notification) => !notification.browserNotifiedAt);
    if (pending.length === 0) return;
    let cancelled = false;

    async function dispatch() {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (cancelled) return;
        for (const notification of pending) {
          await registration.showNotification(notification.title, {
            body: notification.body,
            tag: notification.id,
            data: {
              url: notification.generatorId
                ? `/dashboard/generators/${notification.generatorId}`
                : "/dashboard/notifications",
            },
          });
        }
        if (!cancelled) await markBrowserNotificationsSent(pending.map((notification) => notification.id));
      } catch (error) {
        console.error("Browser notification could not be shown", error);
      }
    }

    void dispatch();
    return () => {
      cancelled = true;
    };
  }, [notifications]);

  return null;
}
