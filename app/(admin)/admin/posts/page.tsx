import Link from "next/link";
import { Plus } from "lucide-react";
import { requireActorFromSession } from "@/lib/auth-context";
import { listPosts } from "@/lib/services/posts";
import { Button } from "@/components/ui/Button";
import { PostListClient } from "./PostListClient";
import type { Post, User } from "@prisma/client";

export const metadata = { title: "Blog" };

type PostWithAuthor = Post & { author: User | null };

export default async function PostsListPage() {
  await requireActorFromSession();
  const rows = await listPosts();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog posts</h1>
          <p className="text-sm text-[var(--color-muted-fg)]">Stories, updates, and announcements.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4" /> New post
          </Link>
        </Button>
      </header>

      <PostListClient data={rows as PostWithAuthor[]} />
    </div>
  );
}
