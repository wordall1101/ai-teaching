import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CategoryService } from "@/lib/db/repositories/db-service";
import type { Category } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "./actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: Date | string | null | undefined) {
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

function getParentTitle(
  categories: Category[],
  parentId: string | null | undefined
) {
  if (!parentId) {
    return "顶级分类";
  }
  const parent = categories.find((item) => item.id === parentId);
  return parent ? parent.title : "已删除";
}

function buildIndentedLabel(category: Category) {
  const prefix = "— ".repeat(category.level ?? 0);
  return `${prefix}${category.title}`;
}

export default async function CategoriesPage({ searchParams }: PageProps) {
  const categories = await CategoryService.findAll();
  const resolvedSearchParams = await searchParams;
  const status = (resolvedSearchParams?.status as string | undefined) ?? "";
  const message = (resolvedSearchParams?.message as string | undefined) ?? "";

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl">分类管理</h1>
          <p className="text-muted-foreground text-sm">
            管理学习导航的三级分类结构，支持创建、排序和维护层级关系。
          </p>
        </div>
        <Link
          className="text-muted-foreground text-sm underline underline-offset-4 hover:text-foreground"
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
          <CardTitle>新增分类</CardTitle>
          <CardDescription>
            支持创建顶级分类或在现有层级中添加新的节点。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={createCategoryAction}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="title">名称</Label>
              <Input
                id="title"
                maxLength={100}
                minLength={1}
                name="title"
                placeholder="请输入分类名称"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentId">父级分类</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue=""
                id="parentId"
                name="parentId"
              >
                <option value="">顶级分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {buildIndentedLabel(category)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">排序权重</Label>
              <Input
                defaultValue={0}
                id="order"
                min={0}
                name="order"
                type="number"
              />
              <p className="text-muted-foreground text-xs">
                数值越小越靠前；同级分类默认按创建时间排序。
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">分类描述</Label>
              <Textarea
                id="description"
                maxLength={500}
                name="description"
                placeholder="用于后台说明或前台额外信息，可选填写"
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">创建分类</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>分类列表</CardTitle>
          <CardDescription>
            所有分类按层级显示，可在下方直接更新名称、描述和排序。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="w-64 border-b p-3 font-medium">分类名称</th>
                  <th className="w-28 border-b p-3 font-medium">层级</th>
                  <th className="w-56 border-b p-3 font-medium">父级分类</th>
                  <th className="w-24 border-b p-3 font-medium">排序</th>
                  <th className="border-b p-3 font-medium">路径</th>
                  <th className="w-48 border-b p-3 font-medium">更新时间</th>
                  <th className="w-80 border-b p-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td
                      className="p-4 text-center text-muted-foreground"
                      colSpan={7}
                    >
                      暂无分类数据，先创建一个顶级分类吧。
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr className="border-b last:border-b-0" key={category.id}>
                      <td className="p-3 align-top">
                        <div className="font-medium leading-snug">
                          {category.title}
                        </div>
                        {category.description ? (
                          <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
                            {category.description}
                          </p>
                        ) : null}
                      </td>
                      <td className="p-3 align-top">{category.level ?? 0}</td>
                      <td className="p-3 align-top">
                        {getParentTitle(categories, category.parentId ?? null)}
                      </td>
                      <td className="p-3 align-top">{category.order}</td>
                      <td className="p-3 align-top">
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {category.path ?? "—"}
                        </code>
                      </td>
                      <td className="p-3 align-top">
                        {formatDate(category.updatedAt)}
                      </td>
                      <td className="p-3 align-top">
                        <details
                          className="rounded border bg-muted/50 p-3"
                          role="group"
                        >
                          <summary className="cursor-pointer font-medium">
                            编辑
                          </summary>
                          <form
                            action={updateCategoryAction}
                            className="mt-3 space-y-3"
                          >
                            <input
                              name="id"
                              type="hidden"
                              value={category.id}
                            />
                            <div className="space-y-2">
                              <Label htmlFor={`title-${category.id}`}>
                                名称
                              </Label>
                              <Input
                                defaultValue={category.title}
                                id={`title-${category.id}`}
                                maxLength={100}
                                name="title"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`description-${category.id}`}>
                                描述
                              </Label>
                              <Textarea
                                defaultValue={category.description ?? ""}
                                id={`description-${category.id}`}
                                maxLength={500}
                                name="description"
                                rows={3}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`order-${category.id}`}>
                                排序
                              </Label>
                              <Input
                                defaultValue={category.order}
                                id={`order-${category.id}`}
                                min={0}
                                name="order"
                                type="number"
                              />
                            </div>
                            <p className="text-muted-foreground text-xs">
                              如需调整层级，请删除后重新创建。
                            </p>
                            <Button type="submit">保存修改</Button>
                          </form>
                        </details>
                        <form action={deleteCategoryAction} className="mt-3">
                          <input name="id" type="hidden" value={category.id} />
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
