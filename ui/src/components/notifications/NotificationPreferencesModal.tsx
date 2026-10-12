import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Shield,
  Search,
  Users,
  FileCheck,
  Bell,
  Check,
  Smartphone,
  Mail,
  Loader2,
} from "lucide-react";
import { useNotifications } from "./NotificationContext";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { preferences, updatePreferences, requestWebPushPermission } = useNotifications();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [webPushStatus, setWebPushStatus] = useState<string | null>(null);

  if (!isOpen || !preferences) return null;

  const handleToggle = async (key: string, value: boolean) => {
    setIsSaving(true);
    setSaveSuccess(false);
    const ok = await updatePreferences({ [key]: value });
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleEnableWebPush = async () => {
    setWebPushStatus("Requesting browser permission...");
    const res = await requestWebPushPermission();
    setWebPushStatus(res.message);
    setTimeout(() => setWebPushStatus(null), 4000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#121212] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-medium text-white tracking-tight">
                Notification Preferences
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Customize alert routing across email, in-app, and web push channels.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-6 space-y-6">
            {/* 1. Account & Security Alerts (Non-configurable mandatory) */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-white">Account &amp; Security Alerts</h4>
                    <span className="text-[9px] uppercase px-2 py-0.5 rounded-full font-bold bg-amber-950/60 text-amber-300 border border-amber-500/20">
                      Mandatory
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    Password resets, login anomalies, and clearance status updates are critical for identity safety.
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-500 font-mono shrink-0">Always On</span>
            </div>

            {/* 2. Asset Discovery */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Asset Discovery Alerts</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Notifications when statutory matches are found or registry scans conclude.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <label className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 cursor-pointer">
                  <span className="text-[11px] text-gray-300 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-primary" /> Email
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.email_discovery_updates}
                    onChange={(e) => handleToggle("email_discovery_updates", e.target.checked)}
                    className="accent-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 cursor-pointer">
                  <span className="text-[11px] text-gray-300 flex items-center gap-1.5">
                    <Bell className="w-3 h-3 text-primary" /> In-App
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.in_app_discovery_updates}
                    onChange={(e) => handleToggle("in_app_discovery_updates", e.target.checked)}
                    className="accent-primary"
                  />
                </label>
              </div>
            </div>

            {/* 3. Relationship Verification */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Relationship &amp; Evidence Reviews</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Document OCR extraction results, clarification requests, and reviewer transitions.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <label className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 cursor-pointer">
                  <span className="text-[11px] text-gray-300 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-primary" /> Email
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.email_relationship_updates}
                    onChange={(e) => handleToggle("email_relationship_updates", e.target.checked)}
                    className="accent-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 cursor-pointer">
                  <span className="text-[11px] text-gray-300 flex items-center gap-1.5">
                    <Bell className="w-3 h-3 text-primary" /> In-App
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.in_app_relationship_updates}
                    onChange={(e) => handleToggle("in_app_relationship_updates", e.target.checked)}
                    className="accent-primary"
                  />
                </label>
              </div>
            </div>

            {/* 4. Claims Progress */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Claim Milestones &amp; Recovery</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Claim docket readiness, submission receipts, and institutional recovery confirmations.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <label className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 cursor-pointer">
                  <span className="text-[11px] text-gray-300 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-primary" /> Email
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.email_claims_progress}
                    onChange={(e) => handleToggle("email_claims_progress", e.target.checked)}
                    className="accent-primary"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 cursor-pointer">
                  <span className="text-[11px] text-gray-300 flex items-center gap-1.5">
                    <Bell className="w-3 h-3 text-primary" /> In-App
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.in_app_claims_progress}
                    onChange={(e) => handleToggle("in_app_claims_progress", e.target.checked)}
                    className="accent-primary"
                  />
                </label>
              </div>
            </div>

            {/* 5. Browser Web Push Channel */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Browser Push Notifications</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Receive alerts on your desktop or mobile browser even when WealthPass is minimized.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Status: {preferences.web_push_enabled ? "Active" : "Disabled"}
                </span>
                {!preferences.web_push_enabled ? (
                  <button
                    onClick={handleEnableWebPush}
                    className="px-4 py-1.5 rounded-full bg-primary text-black text-xs font-semibold hover:bg-white transition-all cursor-pointer"
                  >
                    Enable Browser Push
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                    <Check className="w-3.5 h-3.5" /> Subscribed
                  </span>
                )}
              </div>
              {webPushStatus && (
                <p className="text-[11px] text-primary font-mono mt-1">{webPushStatus}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSaving && (
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </span>
              )}
              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Preferences saved
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
