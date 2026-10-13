import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCheck,
  Settings,
  BellOff,
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertOctagon,
  Loader2,
  ShieldAlert,
  ArrowRight,
  Archive,
  Check,
} from "lucide-react";
import { useNotifications, type WealthPassNotification } from "./NotificationContext";
import { NotificationPreferencesModal } from "./NotificationPreferencesModal";
import { NotificationDetailModal } from "./NotificationDetailModal";

interface NotificationCenterProps {
  onNavigate?: (route: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    isCenterOpen,
    setIsCenterOpen,
    isPreferencesOpen,
    setIsPreferencesOpen,
    markAsRead,
    markAllAsRead,
    archiveNotification,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "ACTION">("ALL");
  const [selectedNotification, setSelectedNotification] = useState<WealthPassNotification | null>(null);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedNotification) {
          setSelectedNotification(null);
        } else if (isPreferencesOpen) {
          setIsPreferencesOpen(false);
        } else if (isCenterOpen) {
          setIsCenterOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCenterOpen, isPreferencesOpen, selectedNotification, setIsCenterOpen, setIsPreferencesOpen]);

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "UNREAD") return !n.is_read;
    if (activeTab === "ACTION") return n.type === "ACTION_REQUIRED" || Boolean(n.safe_internal_route);
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case "ERROR":
        return <AlertOctagon className="w-4 h-4 text-rose-400" />;
      case "PROCESSING":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case "ACTION_REQUIRED":
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      default:
        return <Info className="w-4 h-4 text-[#E1E0CC]" />;
    }
  };

  if (!isCenterOpen) {
    return (
      <>
        <NotificationPreferencesModal
          isOpen={isPreferencesOpen}
          onClose={() => setIsPreferencesOpen(false)}
        />
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onNavigate={onNavigate}
          onArchive={archiveNotification}
        />
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Notification center"
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
          onClick={() => setIsCenterOpen(false)}
        >
          <motion.div
            initial={{ x: "100%", opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="w-full max-w-md h-full bg-[#083B8A] border-l border-white/10 flex flex-col shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white tracking-tight">
                    Notification Center
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary text-[#102A56]">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Real-time auditable event dispatch
                </p>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    title="Mark all as read"
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsPreferencesOpen(true)}
                  title="Notification preferences"
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsCenterOpen(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                  aria-label="Close notification center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-5 py-3 border-b border-white/5 flex gap-2 text-xs">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  activeTab === "ALL"
                    ? "bg-primary text-[#102A56]"
                    : "text-gray-400 hover:text-white bg-white/5 hover:bg-white/10"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab("UNREAD")}
                className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  activeTab === "UNREAD"
                    ? "bg-primary text-[#102A56]"
                    : "text-gray-400 hover:text-white bg-white/5 hover:bg-white/10"
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setActiveTab("ACTION")}
                className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                  activeTab === "ACTION"
                    ? "bg-primary text-[#102A56]"
                    : "text-gray-400 hover:text-white bg-white/5 hover:bg-white/10"
                }`}
              >
                Actions
              </button>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs">Synchronizing notifications...</span>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                    <BellOff className="w-6 h-6 text-gray-600" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-300">No notifications found</h4>
                  <p className="text-xs text-gray-500 max-w-xs mt-1">
                    {activeTab === "UNREAD"
                      ? "You are all caught up! No unread notifications."
                      : "Real-time updates regarding discovery and claims will appear here."}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.is_read) markAsRead(notif.id);
                      setSelectedNotification(notif);
                    }}
                    className={`group p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      notif.is_read
                        ? "bg-[#0646AD] border-white/5 hover:border-white/15 opacity-80 hover:opacity-100"
                        : "bg-[#0646AD] border-primary/30 shadow-lg hover:border-primary/50"
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!notif.is_read && (
                      <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />
                    )}

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white/5 shrink-0 mt-0.5">
                        {getTypeIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono uppercase font-semibold text-gray-400">
                            {notif.category_label || notif.category}
                          </span>
                          <span className="text-[10px] text-gray-600 font-mono">
                            &bull; {notif.time_ago}
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-white tracking-tight leading-snug">
                          {notif.title}
                        </h4>

                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Inline actions footer */}
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {notif.safe_internal_route && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!notif.is_read) markAsRead(notif.id);
                                  if (onNavigate) onNavigate(notif.safe_internal_route!);
                                  setIsCenterOpen(false);
                                }}
                                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-white transition-colors"
                              >
                                <span>{notif.action_label || "Act Now"}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            {!notif.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notif.id);
                                }}
                                title="Mark as read"
                                className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveNotification(notif.id);
                              }}
                              title="Archive"
                              className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white"
                            >
                              <Archive className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Modals */}
      <NotificationPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onNavigate={onNavigate}
        onArchive={archiveNotification}
      />
    </>
  );
};
