import React from "react";
import { NotFound3 } from "./NotFound3";

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
  attemptedPath?: string;
}

/**
 * WealthPass 404 Page
 * Featuring "404 3" block from React Bits Pro (Centered 404 with large blurred numerals and compact CTA).
 */
export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigate,
  attemptedPath = typeof window !== "undefined" ? window.location.pathname : "/404"
}) => {
  return (
    <NotFound3
      onNavigate={onNavigate}
      attemptedPath={attemptedPath}
      title="Page not found"
      description="The page you are looking for doesn't exist, has been removed, or is temporarily inaccessible."
      backHomeText="Back to home"
    />
  );
};

export default NotFoundPage;
