"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminSession } from "@/lib/auth/permissions";
import {
  ArticleService,
  CategoryService,
  CourseService,
} from "@/lib/db/repositories/db-service";
import { generateUUID } from "@/lib/utils";

const createCategorySchema = z.object({
  title: z.string().min(1, "分类名称不能为空").max(100),
  description: z
    .string()
    .max(500, "分类描述需在500字符以内")
    .optional()
    .nullable(),
  parentId: z
    .string()
    .uuid("父级分类格式不正确")
    .optional()
    .nullable(),
  order: z.coerce
    .number({ invalid_type_error: "排序值必须是数字" })
    .int("排序值必须是整数")
    .min(0, "排序值不能小于0")
    .default(0),
});

const updateCategorySchema = createCategorySchema.extend({
  id: z.string().uuid("分类ID格式不正确"),
});

const deleteCategorySchema = z.object({
  id: z.string().uuid("分类ID格式不正确"),
});

function buildRedirectUrl(
  status: "success" | "error",
  message: string
): string {
  return `/admin/categories?status=${status}&message=${encodeURIComponent(
    message
  )}`;
}

export async function createCategoryAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = createCategorySchema.parse({
      title: formData.get("title"),
      description: formData.get("description"),
      parentId: formData.get("parentId") || null,
      order: formData.get("order") ?? 0,
    });

    const id = generateUUID();
    let level = 0;
    let path = id;

    if (parsed.parentId) {
      const parent = await CategoryService.findById(parsed.parentId);
      if (!parent) {
        redirect(buildRedirectUrl("error", "父级分类不存在"));
      }
      level = (parent.level ?? 0) + 1;
      const parentPath = parent.path ?? parent.id;
      path = parentPath ? `${parentPath}/${id}` : id;
    }

    await CategoryService.create({
      id,
      title: parsed.title,
      description: parsed.description ?? null,
      parentId: parsed.parentId ?? null,
      order: parsed.order,
      level,
      path,
    });

    revalidatePath("/admin/categories");
    redirect(buildRedirectUrl("success", "分类创建成功"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.at(0)?.message ?? "提交数据不合法";
      redirect(buildRedirectUrl("error", message));
    }

    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }

    redirect(buildRedirectUrl("error", "创建分类时发生未知错误"));
  }
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = updateCategorySchema.parse({
      id: formData.get("id"),
      title: formData.get("title"),
      description: formData.get("description"),
      parentId: formData.get("parentId") || null,
      order: formData.get("order") ?? 0,
    });

    if (parsed.parentId) {
      const current = await CategoryService.findById(parsed.id);
      if (current?.parentId !== parsed.parentId) {
        redirect(buildRedirectUrl("error", "暂不支持调整分类层级，请创建新的分类"));
      }
    }

    await CategoryService.update(parsed.id, {
      title: parsed.title,
      description: parsed.description ?? null,
      order: parsed.order,
    });

    revalidatePath("/admin/categories");
    redirect(buildRedirectUrl("success", "分类更新成功"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.at(0)?.message ?? "提交数据不合法";
      redirect(buildRedirectUrl("error", message));
    }

    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }

    redirect(buildRedirectUrl("error", "更新分类时发生未知错误"));
  }
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = deleteCategorySchema.parse({
      id: formData.get("id"),
    });

    const [children, relatedArticles, relatedCourses] = await Promise.all([
      CategoryService.findByParentId(parsed.id),
      ArticleService.findByCategoryId(parsed.id),
      CourseService.findByCategoryId(parsed.id),
    ]);

    if (children.length > 0) {
      redirect(
        buildRedirectUrl("error", "请先删除该分类下的子分类后再尝试删除")
      );
    }

    if (relatedArticles.length > 0) {
      redirect(
        buildRedirectUrl("error", "请先解除该分类下的文章关联后再尝试删除")
      );
    }

    if (relatedCourses.length > 0) {
      redirect(
        buildRedirectUrl("error", "请先解除该分类下的课程关联后再尝试删除")
      );
    }

    await CategoryService.delete(parsed.id);
    revalidatePath("/admin/categories");
    redirect(buildRedirectUrl("success", "分类已删除"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.at(0)?.message ?? "提交数据不合法";
      redirect(buildRedirectUrl("error", message));
    }

    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }

    redirect(buildRedirectUrl("error", "删除分类时发生未知错误"));
  }
}

