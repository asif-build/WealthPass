import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../../services/apiClient";

export interface WealthPassNotification {
  id: string;
  event_type: string;
  category: string;
  category_label: string;
  type: "SUCCESS" | "INFO" | "WARNING" | "ERROR" | "PROCESSING" | "ACTION_REQUIRED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  title: string;
  message: string;
  related_object_type?: string | null;
  related_object_id?: string | null;
  safe_internal_route?: string | null;
  action_label?: string | null;
  action_url?: string | null;
  is_read: boolean;
  read_at?: string | null;
  is_archived: boolean;
  created_at: string;
  time_ago: string;
  delivery_status?: Record<string, any>;
}

export interface NotificationPreferences {
  email_account_security: boolean;
  email_discovery_updates: boolean;
  email_relationship_updates: boolean;
  email_claims_progress: boolean;
  in_app_discovery_updates: boolean;
  in_app_relationship_updates: boolean;
  in_app_claims_progress: boolean;
  web_push_enabled: boolean;
  web_push_discovery: boolean;
  web_push_relationship: boolean;
  web_push_claims: boolean;
}

interface NotificationContextType {
  notifications: WealthPassNotification[];
  unreadCount: number;
  isLoading: boolean;
  activeToast: WealthPassNotification | null;
  dismissToast: () => void;
  triggerToast: (toast: Omit<WealthPassNotification, "id" | "created_at" | "time_ago" | "is_read" | "is_archived">) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  preferences: NotificationPreferences | null;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (newPrefs: Partial<NotificationPreferences>) => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  requestWebPushPermission: () => Promise<{ granted: boolean; message: string }>;
  isCenterOpen: boolean;
  setIsCenterOpen: (open: boolean) => void;
  isPreferencesOpen: boolean;
  setIsPreferencesOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode; user?: any }> = ({ children, user }) => {
  const [notifications, setNotifications] = useState<WealthPassNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<WealthPassNotification | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isCenterOpen, setIsCenterOpen] = useState<boolean>(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);

  const toastTimerRef = useRef<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setActiveToast(null);
  }, []);

  const triggerToast = useCallback((data: Omit<WealthPassNotification, "id" | "created_at" | "time_ago" | "is_read" | "is_archived">) => {
    const syntheticId = `toast-${Date.now()}`;
    const toastObj: WealthPassNotification = {
      ...data,
      id: syntheticId,
      created_at: new Date().toISOString(),
      time_ago: "just now",
      is_read: false,
      is_archived: false,
    };
    setActiveToast(toastObj);

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    // PROCESSING notifications remain visible until dismissed; others auto-dismiss after 5s
    if (toastObj.type !== "PROCESSING") {
      toastTimerRef.current = setTimeout(() => {
        setActiveToast(null);
      }, 5000);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        notifications: WealthPassNotification[];
        unread_count: number;
      }>("/api/notifications/");
      if (res.ok && res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiFetch<{
        success: boolean;
        preferences: NotificationPreferences;
      }>("/api/notifications/preferences/");
      if (res.ok && res.data?.success) {
        setPreferences(res.data.preferences);
      }
    } catch {
      // Non-blocking
    }
  }, [user]);

  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>): Promise<boolean> => {
    try {
      const res = await apiFetch<{
        success: boolean;
        preferences: NotificationPreferences;
      }>("/api/notifications/preferences/", {
        method: "POST",
        body: newPrefs,
      });
      if (res.ok && res.data?.success) {
        setPreferences(res.data.preferences);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const res = await apiFetch<{ success: boolean; unread_count: number }>(`/api/notifications/${id}/read/`, {
        method: "POST",
      });
      if (res.ok && res.data?.success) {
        setUnreadCount(res.data.unread_count);
      }
    } catch {
      // Rollback on network failure
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      const res = await apiFetch<{ success: boolean }>("/api/notifications/mark-all-read/", {
        method: "POST",
      });
      if (!res.ok) {
        fetchNotifications();
      }
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const archiveNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      const res = await apiFetch<{ success: boolean; unread_count: number }>(`/api/notifications/${id}/archive/`, {
        method: "POST",
      });
      if (res.ok && res.data?.success) {
        setUnreadCount(res.data.unread_count);
      }
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const requestWebPushPermission = useCallback(async (): Promise<{ granted: boolean; message: string }> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return { granted: false, message: "Browser does not support Web Push notifications." };
    }

    try {
      const permission = await window.Notification.requestPermission();
      if (permission === "granted") {
        // Register standard push subscription endpoint if serviceWorker is active
        try {
          if ("serviceWorker" in navigator) {
            const reg = await navigator.serviceWorker.ready;
            // Generate synthetic web client push token for standard subscription
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
              await apiFetch("/api/notifications/push/subscribe/", {
                method: "POST",
                body: {
                  endpoint: sub.endpoint,
                  keys: {
                    p256dh: sub.getKey ? btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh") || []))) : "sample_p256dh",
                    auth: sub.getKey ? btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth") || []))) : "sample_auth",
                  },
                  device_name: navigator.userAgent.slice(0, 40),
                },
              });
            }
          }
        } catch {
          // Non-blocking fallback
        }
        await updatePreferences({ web_push_enabled: true });
        return { granted: true, message: "Push notifications enabled successfully." };
      } else {
        await updatePreferences({ web_push_enabled: false });
        return { granted: false, message: "Notification permission was declined in browser settings." };
      }
    } catch (err: any) {
      return { granted: false, message: err?.message || "Permission request failed." };
    }
  }, [updatePreferences]);

  // Real-time delivery: SSE stream with polling fallback
  useEffect(() => {
    if (!user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    fetchNotifications();
    fetchPreferences();

    // Setup Server-Sent Events (SSE)
    let sse: EventSource | null = null;
    try {
      sse = new EventSource("/api/notifications/stream/");
      eventSourceRef.current = sse;

      sse.addEventListener("connected", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (typeof data.unread_count === "number") {
            setUnreadCount(data.unread_count);
          }
        } catch {
          // Ignore
        }
      });

      sse.addEventListener("notification", (e: MessageEvent) => {
        try {
          const newNotif: WealthPassNotification = JSON.parse(e.data);
          setNotifications((prev) => {
            // Deduplicate incoming
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
          setUnreadCount((prev) => prev + 1);

          // Trigger Dynamic Island toast overlay
          setActiveToast(newNotif);
          if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          if (newNotif.type !== "PROCESSING") {
            toastTimerRef.current = setTimeout(() => {
              setActiveToast(null);
            }, 6000);
          }
        } catch {
          // Ignore parse errors
        }
      });

      sse.onerror = () => {
        // SSE error or reconnection: clean up and rely on polling fallback
        sse?.close();
      };
    } catch {
      // SSE not supported or blocked
    }

    // Polling fallback every 20 seconds for maximum reliability
    const interval = setInterval(() => {
      apiFetch<{ success: boolean; unread_count: number }>("/api/notifications/unread-count/").then((res) => {
        if (res.ok && res.data?.success) {
          setUnreadCount((prev) => {
            if (res.data!.unread_count !== prev) {
              fetchNotifications();
            }
            return res.data!.unread_count;
          });
        }
      }).catch(() => {});
    }, 20000);

    return () => {
      clearInterval(interval);
      if (sse) sse.close();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [user, fetchNotifications, fetchPreferences]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        activeToast,
        dismissToast,
        triggerToast,
        markAsRead,
        markAllAsRead,
        archiveNotification,
        preferences,
        fetchPreferences,
        updatePreferences,
        refreshNotifications: fetchNotifications,
        requestWebPushPermission,
        isCenterOpen,
        setIsCenterOpen,
        isPreferencesOpen,
        setIsPreferencesOpen,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return ctx;
};
