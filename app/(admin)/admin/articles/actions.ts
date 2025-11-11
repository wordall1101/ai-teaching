"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminSession } from "@/lib/auth/permissions";
import {
  ArticleService,
  CategoryService,
  NoteService,
  TocItemService,
} from "@/lib/db/repositories/db-service";
import { generateUUID } from "@/lib/utils";

const baseArticleSchema = z.object({
  title: z.string().min(1, "文章标题不能为空").max(200),
  slug: z
    .string()
    .min(1, "Slug 不能为空")
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug 仅能包含小写字母、数字和短横线"),
  categoryId: z.string().uuid("请选择有效的分类"),
  coverImage: z
    .string()
    .url("封面地址需为合法的 URL")
    .max(500)
    .optional()
    .or(z.literal("")),
  excerpt: z
    .string()
    .max(1000, "摘要需控制在 1000 字以内")
    .optional()
    .or(z.literal("")),
  original: z.string().optional().or(z.literal("")),
  historical: z.string().optional().or(z.literal("")),
  translation: z.string().optional().or(z.literal("")),
  order: z.coerce
    .number({ invalid_type_error: "排序值必须是数字" })
    .int("排序值必须是整数")
    .min(0, "排序值不能小于 0")
    .default(0),
});

const createArticleSchema = baseArticleSchema;

const updateArticleSchema = baseArticleSchema.extend({
  id: z.string().uuid("文章 ID 格式不正确"),
});

const deleteArticleSchema = z.object({
  id: z.string().uuid("文章 ID 格式不正确"),
});

const redirectBase = "/admin/articles";

function buildRedirectUrl(
  status: "success" | "error",
  message: string
): string {
  return `${redirectBase}?status=${status}&message=${encodeURIComponent(
    message
  )}`;
}

export async function createArticleAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = createArticleSchema.parse({
      title: formData.get("title"),
      slug: formData.get("slug"),
      categoryId: formData.get("categoryId"),
      coverImage: formData.get("coverImage"),
      excerpt: formData.get("excerpt"),
      original: formData.get("original"),
      historical: formData.get("historical"),
      translation: formData.get("translation"),
      order: formData.get("order"),
    });

    const category = await CategoryService.findById(parsed.categoryId);
    if (!category) {
      redirect(buildRedirectUrl("error", "所选分类不存在，请刷新后重试"));
    }

    const existed = await ArticleService.findBySlug(parsed.slug);
    if (existed) {
      redirect(buildRedirectUrl("error", "Slug 已存在，请更换后重试"));
    }

    const id = generateUUID();

    await ArticleService.create({
      id,
      categoryId: parsed.categoryId,
      title: parsed.title,
      slug: parsed.slug,
      coverImage: parsed.coverImage || null,
      excerpt: parsed.excerpt || null,
      original: parsed.original || null,
      historical: parsed.historical || null,
      translation: parsed.translation || null,
      order: parsed.order,
    });

    revalidatePath(redirectBase);
    redirect(buildRedirectUrl("success", "文章创建成功"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect(buildRedirectUrl("error", error.errors.at(0)?.message ?? "提交参数不合法"));
    }
    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }
    redirect(buildRedirectUrl("error", "创建文章时发生未知错误"));
  }
}

export async function updateArticleAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = updateArticleSchema.parse({
      id: formData.get("id"),
      title: formData.get("title"),
      slug: formData.get("slug"),
      categoryId: formData.get("categoryId"),
      coverImage: formData.get("coverImage"),
      excerpt: formData.get("excerpt"),
      original: formData.get("original"),
      historical: formData.get("historical"),
      translation: formData.get("translation"),
      order: formData.get("order"),
    });

    const category = await CategoryService.findById(parsed.categoryId);
    if (!category) {
      redirect(buildRedirectUrl("error", "所选分类不存在，请刷新后重试"));
    }

    const current = await ArticleService.findById(parsed.id);
    if (!current) {
      redirect(buildRedirectUrl("error", "文章不存在或已被删除"));
    }

    if (current.slug !== parsed.slug) {
      const existed = await ArticleService.findBySlug(parsed.slug);
      if (existed && existed.id !== parsed.id) {
        redirect(buildRedirectUrl("error", "Slug 已存在，请更换后重试"));
      }
    }

    await ArticleService.update(parsed.id, {
      title: parsed.title,
      slug: parsed.slug,
      categoryId: parsed.categoryId,
      coverImage: parsed.coverImage || null,
      excerpt: parsed.excerpt || null,
      original: parsed.original || null,
      historical: parsed.historical || null,
      translation: parsed.translation || null,
      order: parsed.order,
    });

    revalidatePath(redirectBase);
    redirect(buildRedirectUrl("success", "文章已更新"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect(buildRedirectUrl("error", error.errors.at(0)?.message ?? "提交参数不合法"));
    }
    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }
    redirect(buildRedirectUrl("error", "更新文章时发生未知错误"));
  }
}

export async function deleteArticleAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = deleteArticleSchema.parse({
      id: formData.get("id"),
    });

    const [notes, tocItems] = await Promise.all([
      NoteService.findByArticleId(parsed.id),
      TocItemService.findByEntity("article", parsed.id),
    ]);

    if (notes.length > 0) {
      redirect(
        buildRedirectUrl("error", "该文章仍有关联的学习笔记，请先处理后再删除")
      );
    }

    if (tocItems.length > 0) {
      await TocItemService.deleteByEntity("article", parsed.id);
    }

    await ArticleService.delete(parsed.id);

    revalidatePath(redirectBase);
    redirect(buildRedirectUrl("success", "文章已删除"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect(buildRedirectUrl("error", error.errors.at(0)?.message ?? "提交参数不合法"));
    }
    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }
    redirect(buildRedirectUrl("error", "删除文章时发生未知错误"));
  }
}

