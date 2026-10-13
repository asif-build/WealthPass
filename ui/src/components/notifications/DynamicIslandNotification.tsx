import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertOctagon,
  Loader2,
  ArrowRight,
  X,
  ShieldAlert,
} from "lucide-react";
import type { WealthPassNotification } from "./NotificationContext";

interface DynamicIslandNotificationProps {
  notification: WealthPassNotification | null;
  onDismiss: () => void;
  onNavigate?: (route: string) => void;
}

export const DynamicIslandNotification: React.FC<DynamicIslandNotificationProps> = ({
  notification,
  onDismiss,
  onNavigate,
}) => {
  if (!notification) return null;

  const getTypeTheme = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          accentBg: "bg-emerald-500/10",
          border: "border-emerald-500/30",
          dot: "bg-emerald-400",
          badge: "bg-emerald-950/60 text-emerald-300",
        };
      case "WARNING":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          accentBg: "bg-amber-500/10",
          border: "border-amber-500/30",
          dot: "bg-amber-400",
          badge: "bg-amber-950/60 text-amber-300",
        };
      case "ERROR":
        return {
          icon: <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />,
          accentBg: "bg-rose-500/10",
          border: "border-rose-500/30",
          dot: "bg-rose-400",
          badge: "bg-rose-950/60 text-rose-300",
        };
      case "PROCESSING":
        return {
          icon: <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />,
          accentBg: "bg-primary/10",
          border: "border-primary/30",
          dot: "bg-primary animate-ping",
          badge: "bg-primary/20 text-primary",
        };
      case "ACTION_REQUIRED":
        return {
          icon: <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />,
          accentBg: "bg-purple-500/10",
          border: "border-purple-500/30",
          dot: "bg-purple-400",
          badge: "bg-purple-950/60 text-purple-300",
        };
      case "INFO":
      default:
        return {
          icon: <Info className="w-4 h-4 text-[#E1E0CC] shrink-0" />,
          accentBg: "bg-white/5",
          border: "border-white/15",
          dot: "bg-[#E1E0CC]",
          badge: "bg-white/10 text-[#E1E0CC]",
        };
    }
  };

  const theme = getTypeTheme(notification.type);

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.safe_internal_route && onNavigate) {
      onNavigate(notification.safe_internal_route);
      onDismiss();
    }
  };

  return (
    <aside
      aria-label="System notifications"
      className="fixed top-5 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: -24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 30,
            mass: 0.8,
          }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.y < -30) {
              onDismiss();
            }
          }}
          className={`pointer-events-auto max-w-md w-full rounded-2xl bg-[#083B8A]/95 backdrop-blur-xl border ${theme.border} shadow-2xl p-4 flex flex-col gap-2.5 overflow-hidden relative cursor-default`}
          role="alert"
          aria-live="polite"
        >
          {/* Top Pill Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
              <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-gray-400">
                {notification.category_label || notification.category}
              </span>
              <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-semibold ${theme.badge}`}>
                {notification.type.replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-500 font-mono">
                {notification.time_ago || "Just now"}
              </span>
              <button
                onClick={onDismiss}
                className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl ${theme.accentBg}`}>
              {theme.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-white tracking-tight truncate">
                {notification.title}
              </h4>
              <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5 line-clamp-2">
                {notification.message}
              </p>
            </div>
          </div>

          {/* Action Trigger Button if route available */}
          {notification.safe_internal_route && (
            <div className="pt-1 flex justify-end">
              <button
                onClick={handleActionClick}
                className="group flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 text-[11px] text-primary hover:text-white transition-all border border-white/10 cursor-pointer"
              >
                <span>{notification.action_label || "Review Details"}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </aside>
  );
};
