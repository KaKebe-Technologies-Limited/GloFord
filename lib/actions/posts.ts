"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActorFromSession } from "@/lib/auth-context";
import { createPost, updatePost, setPostStatus, deletePost } from "@/lib/services/posts";

export async function createPostAction(raw: unknown) {
  const actor = await requireActorFromSession();
  const row = await createPost(actor, raw);
  revalidatePath("/admin/posts");
  redirect(`/admin/posts/${row.id}`);
}

export async function updatePostAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await updatePost(actor, raw);
  revalidatePath("/admin/posts");
}

export async function setPostStatusAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await setPostStatus(actor, raw);
  revalidatePath("/admin/posts");
}

export async function deletePostAction(raw: unknown) {
  const actor = await requireActorFromSession();
  await deletePost(actor, raw);
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}
