import { create } from 'zustand';
import type { NotificationItem } from './types';
import { fetchUnreadNotifications, markNotificationAsRead, normalizeNotification } from './api';

type NotificationsState = {
  items: NotificationItem[]; // unread only
  loading: boolean;
  initialized: boolean;
};

type NotificationsActions = {
  bootstrap: (size?: number) => Promise<void>;
  add: (item: NotificationItem) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clear: () => void;
};

export const useNotificationsStore = create<NotificationsState & NotificationsActions>()(
  (set, get) => ({
    items: [],
    loading: false,
    initialized: false,

    bootstrap: async (size = 10) => {
      if (get().loading) return;
      set({ loading: true });
      try {
        const unread = await fetchUnreadNotifications(size);
        // Merge + dedupe by id; keep latest first
        const current = get().items;
        const map = new Map<string, NotificationItem>();
        for (const item of [...unread, ...current]) {
          map.set(item.id, item);
        }
        const items = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        set({ items, initialized: true });
      } catch {
        // silent fail to avoid UI disruption
      } finally {
        set({ loading: false });
      }
    },

    add: (incoming) => {
      const item = normalizeNotification(incoming);
      const exists = get().items.some((i) => i.id === item.id);
      if (exists) return;
      const items = [item, ...get().items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      set({ items });
    },

    markRead: async (id: string) => {
      try {
        await markNotificationAsRead(id);
      } catch {
        // ignore network error and still optimistically update
      }
      set({ items: get().items.filter((i) => i.id !== id) });
    },

    markAllRead: async () => {
      const ids = get().items.map((i) => i.id);
      // Optimistic clear
      set({ items: [] });
      try {
        await Promise.all(ids.map((id) => markNotificationAsRead(id)));
      } catch {
        // swallow errors; next bootstrap will reconcile
      }
    },

    clear: () => set({ items: [] }),
  }),
);
