"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { ImageIcon } from "lucide-react";

export default function GalleryPage() {
  const [images, setImages] = useState<
    Array<{ id: string; url: string; alt: string | null }>
  >([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((data) => setImages(data))
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[rgb(248_250_249)] to-[rgb(240_247_244)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--color-primary)]">
                In Pictures
              </p>
              <h1 className="font-display text-4xl font-bold text-[var(--color-fg)] sm:text-5xl">
                Gallery
              </h1>
              <p className="mt-4 text-lg text-[var(--color-muted-fg)]">
                A visual journey through our programs, events, and community
                impact.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ImageIcon className="mb-4 h-12 w-12 text-[rgb(var(--token-muted-fg)/0.30)]" />
              <p className="text-[var(--color-muted-fg)]">
                Gallery images will appear here once uploaded.
              </p>
            </div>
          ) : (
            <>
              <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
                {images.map((img, i) => (
                  <ScrollReveal key={img.id} delay={(i % 4) * 0.05}>
                    <button
                      onClick={() => {
                        setLightboxIndex(i);
                        setLightboxOpen(true);
                      }}
                      className="group mb-4 block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-[var(--color-border)]"
                    >
                      <Image
                        src={img.url}
                        alt={img.alt ?? "Gallery image"}
                        width={600}
                        height={400}
                        className="w-full object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </button>
                  </ScrollReveal>
                ))}
              </div>

              <ImageLightbox
                images={images.map((img) => ({
                  src: img.url,
                  alt: img.alt ?? undefined,
                }))}
                initialIndex={lightboxIndex}
                open={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
              />
            </>
          )}
        </div>
      </section>
    </>
  );
}
