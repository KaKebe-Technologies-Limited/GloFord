import { requireActorFromSession } from "@/lib/auth-context";
import { PostForm } from "../PostForm";

export const metadata = { title: "New post" };

export default async function NewPost() {
  await requireActorFromSession();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New blog post</h1>
      </header>
      <PostForm />
    </div>
  );
}
