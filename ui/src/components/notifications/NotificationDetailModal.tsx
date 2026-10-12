import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertOctagon,
  Loader2,
  ShieldAlert,
  ArrowRight,
  Clock,
  Layers,
  Archive,
} from "lucide-react";
import type { WealthPassNotification } from "./NotificationContext";

interface DetailModalProps {
  notification: WealthPassNotification | null;
  onClose: () => void;
  onNavigate?: (route: string) => void;
  onArchive: (id: string) => void;
}

export const NotificationDetailModal: React.FC<DetailModalProps> = ({
  notification,
  onClose,
  onNavigate,
  onArchive,
}) => {
  if (!notification) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "WARNING":
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case "ERROR":
        return <AlertOctagon className="w-5 h-5 text-rose-400" />;
      case "PROCESSING":
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case "ACTION_REQUIRED":
        return <ShieldAlert className="w-5 h-5 text-purple-400" />;
      default:
        return <Info className="w-5 h-5 text-[#E1E0CC]" />;
    }
  };

  const handleAction = () => {
    if (notification.safe_internal_route && onNavigate) {
      onNavigate(notification.safe_internal_route);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#121212] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                {getTypeIcon(notification.type)}
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-primary font-semibold">
                  {notification.category_label || notification.category}
                </span>
                <span className="text-[10px] text-gray-500 font-mono ml-2">
                  {notification.priority} Priority
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="py-5 space-y-4">
            <h3 className="text-lg font-medium text-white tracking-tight">
              {notification.title}
            </h3>

            <p className="text-xs text-gray-300 leading-relaxed bg-black/40 p-4 rounded-2xl border border-white/5">
              {notification.message}
            </p>

            {/* Metadata pills */}
            <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-400 font-mono">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{new Date(notification.created_at).toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>{notification.event_type}</span>
              </div>
            </div>

            {/* Channel telemetry status */}
            {notification.delivery_status && Object.keys(notification.delivery_status).length > 0 && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-gray-400 font-mono">
                <span className="text-gray-500 uppercase block mb-1">Dispatch Channels:</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(notification.delivery_status).map(([k, v]) => (
                    <span key={k} className="px-2 py-0.5 rounded bg-black border border-white/10">
                      {k}: <strong className="text-gray-200">{String(v)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                onArchive(notification.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>

            {notification.safe_internal_route ? (
              <button
                onClick={handleAction}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-black text-xs font-semibold hover:bg-white transition-all cursor-pointer"
              >
                <span>{notification.action_label || "Proceed to Route"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white transition-all cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
