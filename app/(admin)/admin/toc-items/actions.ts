"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminSession } from "@/lib/auth/permissions";
import {
  ArticleService,
  CourseService,
  NoteService,
  TocItemService,
} from "@/lib/db/repositories/db-service";
import { generateUUID } from "@/lib/utils";

const supportedEntityTypes = ["article", "note", "course"] as const;

const baseTocItemSchema = z.object({
  entityType: z.enum(supportedEntityTypes, {
    errorMap: () => ({ message: "实体类型不合法" }),
  }),
  entityId: z.string().uuid("实体 ID 格式不正确"),
  title: z.string().min(1, "目录标题不能为空").max(200),
  anchorId: z
    .string()
    .min(1, "Anchor 不能为空")
    .max(200)
    .regex(/^[a-zA-Z0-9-_]+$/, "Anchor 仅能包含字母、数字、中划线与下划线"),
  level: z.coerce
    .number({ invalid_type_error: "层级必须是数字" })
    .int("层级必须是整数")
    .min(1, "层级至少为 1"),
  order: z.coerce
    .number({ invalid_type_error: "排序必须是数字" })
    .int("排序必须是整数")
    .min(0, "排序值不能小于 0")
    .default(0),
});

const createTocItemSchema = baseTocItemSchema;

const updateTocItemSchema = baseTocItemSchema.extend({
  id: z.string().uuid("目录 ID 格式不正确"),
});

const deleteTocItemSchema = z.object({
  id: z.string().uuid("目录 ID 格式不正确"),
});

const redirectBase = "/admin/toc-items";

function buildRedirectUrl(
  status: "success" | "error",
  message: string
): string {
  return `${redirectBase}?status=${status}&message=${encodeURIComponent(
    message
  )}`;
}

async function assertEntityExists(
  entityType: (typeof supportedEntityTypes)[number],
  entityId: string
) {
  if (entityType === "article") {
    const exists = await ArticleService.findById(entityId);
    if (!exists) {
      redirect(buildRedirectUrl("error", "关联的文章不存在"));
    }
  }

  if (entityType === "note") {
    const exists = await NoteService.findById(entityId);
    if (!exists) {
      redirect(buildRedirectUrl("error", "关联的笔记不存在"));
    }
  }

  if (entityType === "course") {
    const exists = await CourseService.findById(entityId);
    if (!exists) {
      redirect(buildRedirectUrl("error", "关联的课程不存在"));
    }
  }
}

export async function createTocItemAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = createTocItemSchema.parse({
      entityType: formData.get("entityType"),
      entityId: formData.get("entityId"),
      title: formData.get("title"),
      anchorId: formData.get("anchorId"),
      level: formData.get("level"),
      order: formData.get("order"),
    });

    await assertEntityExists(parsed.entityType, parsed.entityId);

    await TocItemService.create({
      id: generateUUID(),
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      title: parsed.title,
      anchorId: parsed.anchorId,
      level: parsed.level,
      order: parsed.order,
    });

    revalidatePath(redirectBase);
    redirect(buildRedirectUrl("success", "目录项创建成功"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect(buildRedirectUrl("error", error.errors.at(0)?.message ?? "提交参数不合法"));
    }
    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }
    redirect(buildRedirectUrl("error", "创建目录项时发生未知错误"));
  }
}

export async function updateTocItemAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = updateTocItemSchema.parse({
      id: formData.get("id"),
      entityType: formData.get("entityType"),
      entityId: formData.get("entityId"),
      title: formData.get("title"),
      anchorId: formData.get("anchorId"),
      level: formData.get("level"),
      order: formData.get("order"),
    });

    await assertEntityExists(parsed.entityType, parsed.entityId);

    await TocItemService.update(parsed.id, {
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      title: parsed.title,
      anchorId: parsed.anchorId,
      level: parsed.level,
      order: parsed.order,
    });

    revalidatePath(redirectBase);
    redirect(buildRedirectUrl("success", "目录项已更新"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect(buildRedirectUrl("error", error.errors.at(0)?.message ?? "提交参数不合法"));
    }
    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }
    redirect(buildRedirectUrl("error", "更新目录项时发生未知错误"));
  }
}

export async function deleteTocItemAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = deleteTocItemSchema.parse({
      id: formData.get("id"),
    });

    await TocItemService.delete(parsed.id);

    revalidatePath(redirectBase);
    redirect(buildRedirectUrl("success", "目录项已删除"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect(buildRedirectUrl("error", error.errors.at(0)?.message ?? "提交参数不合法"));
    }
    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }
    redirect(buildRedirectUrl("error", "删除目录项时发生未知错误"));
  }
}

