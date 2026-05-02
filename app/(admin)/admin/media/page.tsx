import { requireActorFromSession } from "@/lib/auth-context";
import { listMedia } from "@/lib/services/media";
import { MediaUploader } from "./MediaUploader";
import { MediaCard } from "./MediaCard";

export const metadata = { title: "Media" };

export default async function MediaLibraryPage() {
  await requireActorFromSession();
  const items = await listMedia();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Media library</h1>
        <p className="text-sm text-[var(--color-muted-fg)]">
          Uploads are stored on the server and referenced by id in content blocks.
        </p>
      </header>

      <MediaUploader />

      {items.length === 0 ? (
        <p className="text-[var(--color-muted-fg)]">No media yet. Upload something to get started.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((m) => (
            <MediaCard key={m.id} item={m} />
          ))}
        </div>
      )}
    </div>
  );
}
