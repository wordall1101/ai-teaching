"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminSession } from "@/lib/auth/permissions";
import {
  ArticleService,
  NoteService,
  UserService,
} from "@/lib/db/repositories/db-service";
import { generateUUID } from "@/lib/utils";

const baseNoteSchema = z.object({
  articleId: z.string().uuid("请选择有效的文章"),
  userId: z.string().uuid("请选择有效的用户"),
  title: z.string().min(1, "笔记标题不能为空").max(200),
  content: z.string().min(1, "笔记内容不能为空"),
});

const createNoteSchema = baseNoteSchema;
const updateNoteSchema = baseNoteSchema.extend({
  id: z.string().uuid("笔记 ID 格式不正确"),
});

const deleteNoteSchema = z.object({
  id: z.string().uuid("笔记 ID 格式不正确"),
});

const redirectBase = "/admin/notes";

function buildRedirectUrl(
  status: "success" | "error",
  message: string
): string {
  return `${redirectBase}?status=${status}&message=${encodeURIComponent(
    message
  )}`;
}

export async function createNoteAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = createNoteSchema.parse({
      articleId: formData.get("articleId"),
      userId: formData.get("userId"),
      title: formData.get("title"),
      content: formData.get("content"),
    });

    const [article, users] = await Promise.all([
      ArticleService.findById(parsed.articleId),
      UserService.findAll(),
    ]);

    if (!article) {
      redirect(buildRedirectUrl("error", "所选文章不存在，请刷新后重试"));
    }

    if (!users.some((user) => user.id === parsed.userId)) {
      redirect(buildRedirectUrl("error", "所选用户不存在，请刷新后重试"));
    }

    await NoteService.create({
      id: generateUUID(),
      articleId: parsed.articleId,
      userId: parsed.userId,
      title: parsed.title,
      content: parsed.content,
    });

    revalidatePath(redirectBase);
    redirect(buildRedirectUrl("success", "笔记创建成功"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect(buildRedirectUrl("error", error.errors.at(0)?.message ?? "提交参数不合法"));
    }
    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }
    redirect(buildRedirectUrl("error", "创建笔记时发生未知错误"));
  }
}

export async function updateNoteAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = updateNoteSchema.parse({
      id: formData.get("id"),
      articleId: formData.get("articleId"),
      userId: formData.get("userId"),
      title: formData.get("title"),
      content: formData.get("content"),
    });

    const [article, users, note] = await Promise.all([
      ArticleService.findById(parsed.articleId),
      UserService.findAll(),
      NoteService.findById(parsed.id),
    ]);

    if (!note) {
      redirect(buildRedirectUrl("error", "笔记不存在或已删除"));
    }

    if (!article) {
      redirect(buildRedirectUrl("error", "所选文章不存在，请刷新后重试"));
    }

    if (!users.some((user) => user.id === parsed.userId)) {
      redirect(buildRedirectUrl("error", "所选用户不存在，请刷新后重试"));
    }

    await NoteService.update(parsed.id, {
      articleId: parsed.articleId,
      userId: parsed.userId,
      title: parsed.title,
      content: parsed.content,
    });

    revalidatePath(redirectBase);
    redirect(buildRedirectUrl("success", "笔记已更新"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect(buildRedirectUrl("error", error.errors.at(0)?.message ?? "提交参数不合法"));
    }
    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }
    redirect(buildRedirectUrl("error", "更新笔记时发生未知错误"));
  }
}

export async function deleteNoteAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = deleteNoteSchema.parse({
      id: formData.get("id"),
    });

    await NoteService.delete(parsed.id);

    revalidatePath(redirectBase);
    redirect(buildRedirectUrl("success", "笔记已删除"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect(buildRedirectUrl("error", error.errors.at(0)?.message ?? "提交参数不合法"));
    }
    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }
    redirect(buildRedirectUrl("error", "删除笔记时发生未知错误"));
  }
}

