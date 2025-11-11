"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdminSession } from "@/lib/auth/permissions";
import {
  CategoryService,
  CourseService,
} from "@/lib/db/repositories/db-service";
import { generateUUID } from "@/lib/utils";

const courseStatus = ["upcoming", "ongoing", "completed"] as const;

const dateSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((value) => {
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new z.ZodError([
        {
          code: "custom",
          message: "日期格式不正确",
          path: [],
        },
      ]);
    }
    return parsed;
  });

const baseCourseSchema = z.object({
  title: z.string().min(1, "课程标题不能为空").max(200),
  description: z
    .string()
    .max(2000, "课程描述需在 2000 字以内")
    .optional()
    .or(z.literal("")),
  coverImage: z
    .string()
    .url("封面地址需为合法的 URL")
    .max(500)
    .optional()
    .or(z.literal("")),
  status: z.enum(courseStatus, {
    errorMap: () => ({ message: "课程状态不合法" }),
  }),
  categoryId: z
    .string()
    .uuid("请选择有效的分类")
    .optional()
    .or(z.literal("")),
  startDate: dateSchema,
  endDate: dateSchema,
});

const createCourseSchema = baseCourseSchema;

const updateCourseSchema = baseCourseSchema.extend({
  id: z.string().uuid("课程 ID 格式不正确"),
});

const deleteCourseSchema = z.object({
  id: z.string().uuid("课程 ID 格式不正确"),
});

const redirectBase = "/admin/courses";

function buildRedirectUrl(
  status: "success" | "error",
  message: string
): string {
  return `${redirectBase}?status=${status}&message=${encodeURIComponent(
    message
  )}`;
}

function normalizeDate(value: Date | null) {
  return value ? new Date(value) : null;
}

export async function createCourseAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = createCourseSchema.parse({
      title: formData.get("title"),
      description: formData.get("description"),
      coverImage: formData.get("coverImage"),
      status: formData.get("status"),
      categoryId: formData.get("categoryId"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    });

    if (parsed.categoryId) {
      const category = await CategoryService.findById(parsed.categoryId);
      if (!category) {
        redirect(buildRedirectUrl("error", "所选分类不存在，请刷新后重试"));
      }
    }

    if (parsed.startDate && parsed.endDate) {
      if (parsed.startDate.getTime() > parsed.endDate.getTime()) {
        redirect(
          buildRedirectUrl("error", "开始日期不能晚于结束日期")
        );
      }
    }

    await CourseService.create({
      id: generateUUID(),
      title: parsed.title,
      description: parsed.description || null,
      coverImage: parsed.coverImage || null,
      status: parsed.status,
      categoryId: parsed.categoryId || null,
      startDate: normalizeDate(parsed.startDate),
      endDate: normalizeDate(parsed.endDate),
    });

    revalidatePath(redirectBase);
    redirect(buildRedirectUrl("success", "课程创建成功"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect(buildRedirectUrl("error", error.errors.at(0)?.message ?? "提交参数不合法"));
    }
    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }
    redirect(buildRedirectUrl("error", "创建课程时发生未知错误"));
  }
}

export async function updateCourseAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = updateCourseSchema.parse({
      id: formData.get("id"),
      title: formData.get("title"),
      description: formData.get("description"),
      coverImage: formData.get("coverImage"),
      status: formData.get("status"),
      categoryId: formData.get("categoryId"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
    });

    if (parsed.categoryId) {
      const category = await CategoryService.findById(parsed.categoryId);
      if (!category) {
        redirect(buildRedirectUrl("error", "所选分类不存在，请刷新后重试"));
      }
    }

    if (parsed.startDate && parsed.endDate) {
      if (parsed.startDate.getTime() > parsed.endDate.getTime()) {
        redirect(
          buildRedirectUrl("error", "开始日期不能晚于结束日期")
        );
      }
    }

    await CourseService.update(parsed.id, {
      title: parsed.title,
      description: parsed.description || null,
      coverImage: parsed.coverImage || null,
      status: parsed.status,
      categoryId: parsed.categoryId || null,
      startDate: normalizeDate(parsed.startDate),
      endDate: normalizeDate(parsed.endDate),
    });

    revalidatePath(redirectBase);
    redirect(buildRedirectUrl("success", "课程信息已更新"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect(buildRedirectUrl("error", error.errors.at(0)?.message ?? "提交参数不合法"));
    }
    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }
    redirect(buildRedirectUrl("error", "更新课程时发生未知错误"));
  }
}

export async function deleteCourseAction(formData: FormData) {
  await requireAdminSession();

  try {
    const parsed = deleteCourseSchema.parse({
      id: formData.get("id"),
    });

    await CourseService.delete(parsed.id);

    revalidatePath(redirectBase);
    redirect(buildRedirectUrl("success", "课程已删除"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect(buildRedirectUrl("error", error.errors.at(0)?.message ?? "提交参数不合法"));
    }
    if (error instanceof Error) {
      redirect(buildRedirectUrl("error", error.message));
    }
    redirect(buildRedirectUrl("error", "删除课程时发生未知错误"));
  }
}

