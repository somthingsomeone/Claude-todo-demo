import { serializeJsonLd, type JsonLdObject } from "@/lib/seo";

/** Structured data for Google and AI assistants. */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
