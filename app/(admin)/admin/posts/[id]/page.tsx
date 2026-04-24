import { notFound } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import { getPostForEdit } from "@/lib/services/posts";
import { PostForm } from "../PostForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PostStatusControl } from "../PostStatusControl";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireActorFromSession();
  const post = await getPostForEdit(id);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
          <p className="text-sm text-[--color-muted-fg]">/blog/{post.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={post.status} />
          <PostStatusControl id={post.id} status={post.status} />
        </div>
      </header>
      <PostForm
        initial={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt ?? undefined,
          body: (post.body as never) ?? [],
          coverMediaId: post.coverMediaId ?? undefined,
          coverUrl: post.cover?.url ?? null,
          tagSlugs: post.tags.map((pt) => pt.tag.slug),
        }}
      />
    </div>
  );
}
