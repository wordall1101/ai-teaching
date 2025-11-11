import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  CategoryService,
  CourseService,
} from "@/lib/db/repositories/db-service";
import type { Category, Course } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import {
  createCourseAction,
  deleteCourseAction,
  updateCourseAction,
} from "./actions";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const statusLabels: Record<Course["status"], string> = {
  upcoming: "即将开始",
  ongoing: "进行中",
  completed: "已结束",
};

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "—";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDateInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const [categories, courses] = await Promise.all([
    CategoryService.findAll(),
    CourseService.findAll(),
  ]);

  const status = (searchParams?.status as string | undefined) ?? "";
  const message = (searchParams?.message as string | undefined) ?? "";

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl">课程管理</h1>
          <p className="text-muted-foreground text-sm">
            管理课程介绍、进度状态与时间，支持关联分类及更新封面。
          </p>
        </div>
        <Link
          className="text-muted-foreground text-sm hover:text-foreground underline underline-offset-4"
          href="/philosophy"
        >
          查看前台展示
        </Link>
      </div>

      {status && message ? (
        <div
          aria-live={status === "success" ? "polite" : "assertive"}
          className={cn(
            "rounded-md border p-4 text-sm",
            status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          )}
          role={status === "success" ? "status" : "alert"}
        >
          {decodeURIComponent(message)}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>新增课程</CardTitle>
          <CardDescription>
            创建新的课程安排，可设置时间范围与课程状态。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCourseAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">课程标题</Label>
              <Input
                id="title"
                maxLength={200}
                minLength={1}
                name="title"
                placeholder="请输入课程名称"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">课程状态</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="status"
                name="status"
                required
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">关联分类</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="categoryId"
                name="categoryId"
              >
                <option value="">可选</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage">封面地址</Label>
              <Input
                id="coverImage"
                name="coverImage"
                placeholder="https://example.com/course.jpg"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">开始日期</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">结束日期</Label>
              <Input id="endDate" name="endDate" type="date" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">课程简介</Label>
              <Textarea
                id="description"
                maxLength={2000}
                name="description"
                placeholder="描述课程目标、适合人群、课程大纲等信息"
                rows={4}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">创建课程</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>课程列表</CardTitle>
          <CardDescription>
            维护课程的基本信息与状态，可直接在表格中展开编辑。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="w-64 border-b p-3 font-medium">课程</th>
                  <th className="w-32 border-b p-3 font-medium">状态</th>
                  <th className="w-48 border-b p-3 font-medium">分类</th>
                  <th className="w-40 border-b p-3 font-medium">时间范围</th>
                  <th className="w-44 border-b p-3 font-medium">更新时间</th>
                  <th className="border-b p-3 font-medium">课程描述</th>
                  <th className="w-[360px] border-b p-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={7}>
                      暂无课程数据。
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr className="border-b last:border-b-0" key={course.id}>
                      <td className="align-top p-3 font-medium">{course.title}</td>
                      <td className="align-top p-3">
                        {statusLabels[course.status] ?? course.status}
                      </td>
                      <td className="align-top p-3">
                        {course.categoryId
                          ? categories.find((item) => item.id === course.categoryId)?.title ??
                            "已删除"
                          : "未关联"}
                      </td>
                      <td className="align-top p-3">
                        <div className="space-y-1">
                          <p>开始：{formatDateTime(course.startDate)}</p>
                          <p>结束：{formatDateTime(course.endDate)}</p>
                        </div>
                      </td>
                      <td className="align-top p-3">{formatDateTime(course.updatedAt)}</td>
                      <td className="align-top p-3">
                        <p className="line-clamp-4 text-muted-foreground text-xs leading-relaxed">
                          {course.description ?? "—"}
                        </p>
                      </td>
                      <td className="align-top p-3">
                        <details className="rounded border bg-muted/40 p-3" role="group">
                          <summary className="cursor-pointer font-medium">
                            编辑
                          </summary>
                          <form
                            action={updateCourseAction}
                            className="mt-3 grid gap-3 md:grid-cols-2"
                          >
                            <input name="id" type="hidden" value={course.id} />
                            <div className="space-y-2">
                              <Label htmlFor={`title-${course.id}`}>课程标题</Label>
                              <Input
                                defaultValue={course.title}
                                id={`title-${course.id}`}
                                maxLength={200}
                                name="title"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`status-${course.id}`}>课程状态</Label>
                              <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={course.status}
                                id={`status-${course.id}`}
                                name="status"
                                required
                              >
                                {Object.entries(statusLabels).map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`category-${course.id}`}>分类</Label>
                              <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={course.categoryId ?? ""}
                                id={`category-${course.id}`}
                                name="categoryId"
                              >
                                <option value="">未关联</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`cover-${course.id}`}>封面地址</Label>
                              <Input
                                defaultValue={course.coverImage ?? ""}
                                id={`cover-${course.id}`}
                                name="coverImage"
                                type="url"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`start-${course.id}`}>开始日期</Label>
                              <Input
                                defaultValue={formatDateInput(course.startDate)}
                                id={`start-${course.id}`}
                                name="startDate"
                                type="date"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`end-${course.id}`}>结束日期</Label>
                              <Input
                                defaultValue={formatDateInput(course.endDate)}
                                id={`end-${course.id}`}
                                name="endDate"
                                type="date"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`description-${course.id}`}>课程简介</Label>
                              <Textarea
                                defaultValue={course.description ?? ""}
                                id={`description-${course.id}`}
                                maxLength={2000}
                                name="description"
                                rows={4}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Button type="submit">保存修改</Button>
                            </div>
                          </form>
                        </details>
                        <form action={deleteCourseAction} className="mt-3 inline-block">
                          <input name="id" type="hidden" value={course.id} />
                          <Button type="submit" variant="destructive">
                            删除
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

