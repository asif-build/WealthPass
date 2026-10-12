import React from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "./NotificationContext";

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = "" }) => {
  const { unreadCount, isCenterOpen, setIsCenterOpen } = useNotifications();

  return (
    <button
      onClick={() => setIsCenterOpen(!isCenterOpen)}
      className={`relative p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
      aria-label={`Notifications, ${unreadCount} unread`}
      aria-expanded={isCenterOpen}
    >
      <Bell className="w-4 h-4" />

      {unreadCount > 0 && (
        <>
          {/* Subtle pulse ring */}
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary/40 animate-ping pointer-events-none" />
          {/* Badge indicator */}
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-black text-[9px] font-bold font-mono flex items-center justify-center shadow-lg border border-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        </>
      )}
    </button>
  );
};
