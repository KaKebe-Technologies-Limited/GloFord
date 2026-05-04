"use client";

/**
 * Renders one or more JSON-LD `<script>` blocks.
 *
 * Usage:
 *   <JsonLd data={organizationJsonLd()} />
 *   <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const items = Array.isArray(data) ? data : [data];

  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
