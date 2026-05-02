import type { Metadata } from "next";
import GalleryGrid from "./GalleryGrid";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";
const DEFAULT_OG = `${APP_URL}/seed-images/gloford/hero-community.jpg`;

export const metadata: Metadata = {
  title: "Gallery",
  description: "A visual journey through our programs, events, and community impact.",
  openGraph: {
    title: "Gallery",
    description: "A visual journey through our programs, events, and community impact.",
    type: "website",
    url: `${APP_URL}/gallery`,
    images: [{ url: DEFAULT_OG, width: 1200, height: 630, alt: "Gloford Foundation" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function GalleryPage() {
  return <GalleryGrid />;
}
