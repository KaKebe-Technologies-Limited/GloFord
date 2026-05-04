import type { Metadata } from "next";
import GalleryGrid from "./GalleryGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://gloford.org";

export const metadata: Metadata = {
  title: "Gallery",
  description: "A visual journey through our programs, events, and community impact.",
  openGraph: {
    title: "Gallery",
    description: "A visual journey through our programs, events, and community impact.",
    type: "website",
    url: `${APP_URL}/gallery`,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Gloford" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function GalleryPage() {
  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            name: "Gallery",
            path: "/gallery",
            description: "A visual journey through our programs, events, and community impact.",
          }),
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Gallery", href: "/gallery" },
          ]),
        ]}
      />
      <GalleryGrid />
    </>
  );
}
