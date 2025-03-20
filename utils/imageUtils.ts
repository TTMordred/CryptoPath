import { toast } from "sonner";

// Keep track of hostnames we've already warned about to avoid spam
const reportedHostnames = new Set<string>();

/**
 * Extracts hostname from a URL string
 */
export const extractHostname = (url: string): string | null => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
};

/**
 * Reports an image hostname error through the debug event system
 */
export const reportImageHostnameError = (hostname: string) => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Only report each hostname once
    if (!reportedHostnames.has(hostname)) {
      reportedHostnames.add(hostname);
      
      // Log helpful information to console
      console.error(
        `Next.js Image Error: Hostname "${hostname}" is not configured in next.config.js.\n` +
        `To fix this, add the following to your next.config.js in the images.remotePatterns section:\n\n` +
        `{\n  protocol: "https",\n  hostname: "${hostname}",\n  pathname: "/**",\n},`
      );
      
      // Dispatch custom event for the debug badge to display
      window.dispatchEvent(
        new CustomEvent('nextImageHostnameError', { 
          detail: { 
            hostname,
            timestamp: Date.now()
          } 
        })
      );
      
      // Show a toast notification for immediate feedback
      if (toast && typeof toast.error === 'function') {
        toast.error(
          `Image hostname "${hostname}" not configured`,
          {
            description: "Check console for details on how to fix this",
            duration: 5000,
          }
        );
      }
    }
  }
};

/**
 * Safely handles image URLs in Next.js
 * - Validates image URLs
 * - Reports hostname errors during development
 * - Returns a safe fallback when needed
 */
export const getSafeImageUrl = (url: string | undefined, fallbackUrl: string = "/images/token-placeholder.png"): string => {
  if (!url) return fallbackUrl;
  
  // Local images and data URLs are always safe
  if (url.startsWith("/") || url.startsWith("data:")) {
    return url;
  }
  
  // Return the URL as is - we'll handle errors on the Image component side
  return url;
};

/**
 * A wrapper for the Next.js Image onError handler
 * Reports hostname errors and sets a fallback image
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>, fallbackSrc: string = "/images/token-placeholder.png") => {
  const target = event.target as HTMLImageElement;
  const src = target.src;
  const hostname = extractHostname(src);
  
  // Report the hostname error
  if (hostname) {
    reportImageHostnameError(hostname);
  }
  
  // Set fallback image
  target.src = fallbackSrc;
  // Prevent further error events for this image
  target.onerror = null;
};

/**
 * Enhanced Image component options for development mode
 * to bypass hostname verification during development
 */
export const getDevImageProps = () => {
  return process.env.NODE_ENV === 'development' 
    ? { unoptimized: false,} 
    : {};
};
