/**
 * Context-aware image placeholders using Unsplash.
 * This provides high-quality, relevant images for NGO themes.
 */

export type ImageTheme = 
  | "community"
  | "youth"
  | "health"
  | "climate"
  | "staff"
  | "radio"
  | "uganda";

export function getPlaceholderImage(theme: ImageTheme = "community") {
  // Map themes to reliable Unsplash IDs for high-quality context
  const themeMap: Record<ImageTheme, string> = {
    community: "photo-1593113636914-ee10041893c5",
    youth: "photo-1488521787991-ed7bbaae773c",
    health: "photo-1504813184591-01592f2bb94f",
    climate: "photo-1500382017468-9049fed747ef",
    staff: "photo-1522071820081-009f0129c71c",
    radio: "photo-1590602847861-f357a9332bbc",
    uganda: "photo-1583030353099-b3a694cb5c8a",
  };

  const photoId = themeMap[theme] || themeMap.community;
  return `https://images.unsplash.com/${photoId}?q=80&w=800&h=600&auto=format&fit=crop`;
}

/**
 * NGO specific fallback images from a reliable CDN.
 */
export const FALLBACK_IMAGES = {
  hero: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop",
  programs: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2070&auto=format&fit=crop",
  blog: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop",
  donate: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070&auto=format&fit=crop",
};
