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
import {
  ArticleService,
  CategoryService,
} from "@/lib/db/repositories/db-service";
import type { Category } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import {
  createArticleAction,
  deleteArticleAction,
  updateArticleAction,
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

function getCategoryTitle(categories: Category[], id: string) {
  const category = categories.find((item) => item.id === id);
  return category ? category.title : "未知分类";
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const status = (resolvedSearchParams?.status as string | undefined) ?? "";
  const message = (resolvedSearchParams?.message as string | undefined) ?? "";

  const [categories, articles] = await Promise.all([
    CategoryService.findAll(),
    ArticleService.findAll(),
  ]);

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl">文章管理</h1>
          <p className="text-muted-foreground text-sm">
            维护哲学学习模块的文章及其结构内容，可快速创建、更新与下架。
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
          <CardTitle>新增文章</CardTitle>
          <CardDescription>
            创建新的文章内容，支持填写原文、译文、历史背景等字段信息。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={createArticleAction}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                maxLength={200}
                minLength={1}
                name="title"
                placeholder="请输入文章标题"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                maxLength={200}
                minLength={1}
                name="slug"
                pattern="[a-z0-9-]+"
                placeholder="例如 university-way"
                required
              />
              <p className="text-muted-foreground text-xs">
                建议使用英文小写及短横线，便于 SEO 和固定链接。
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">所属分类</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                id="categoryId"
                name="categoryId"
                required
              >
                <option value="">请选择分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">排序</Label>
              <Input
                defaultValue={0}
                id="order"
                min={0}
                name="order"
                type="number"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="coverImage">封面地址</Label>
              <Input
                id="coverImage"
                name="coverImage"
                placeholder="https://example.com/cover.png"
                type="url"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="excerpt">摘要</Label>
              <Textarea
                id="excerpt"
                maxLength={1000}
                name="excerpt"
                placeholder="用于列表页面的导读摘要"
                rows={3}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="original">原文</Label>
              <Textarea
                id="original"
                name="original"
                placeholder="可粘贴古文原文内容"
                rows={4}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="historical">历史背景</Label>
              <Textarea
                id="historical"
                name="historical"
                placeholder="补充相关的历史背景与典故"
                rows={4}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="translation">译文</Label>
              <Textarea
                id="translation"
                name="translation"
                placeholder="可填写白话译文或扩展解读"
                rows={4}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">创建文章</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>文章列表</CardTitle>
          <CardDescription>
            所有文章按排序显示，可展开后直接编辑内容字段。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="w-60 border-b p-3 font-medium">标题</th>
                  <th className="w-56 border-b p-3 font-medium">Slug</th>
                  <th className="w-48 border-b p-3 font-medium">分类</th>
                  <th className="w-20 border-b p-3 font-medium">排序</th>
                  <th className="w-44 border-b p-3 font-medium">更新时间</th>
                  <th className="border-b p-3 font-medium">摘要</th>
                  <th className="w-[420px] border-b p-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {articles.length === 0 ? (
                  <tr>
                    <td
                      className="p-4 text-center text-muted-foreground"
                      colSpan={7}
                    >
                      暂无文章数据，先在上方创建一篇文章。
                    </td>
                  </tr>
                ) : (
                  articles.map((article) => (
                    <tr className="border-b last:border-b-0" key={article.id}>
                      <td className="p-3 align-top font-medium">
                        {article.title}
                      </td>
                      <td className="p-3 align-top">
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {article.slug}
                        </code>
                      </td>
                      <td className="p-3 align-top">
                        {getCategoryTitle(categories, article.categoryId)}
                      </td>
                      <td className="p-3 align-top">{article.order}</td>
                      <td className="p-3 align-top">
                        {formatDate(article.updatedAt)}
                      </td>
                      <td className="p-3 align-top">
                        <p className="line-clamp-4 text-muted-foreground text-xs leading-relaxed">
                          {article.excerpt ?? "—"}
                        </p>
                      </td>
                      <td className="p-3 align-top">
                        <details
                          className="rounded border bg-muted/40 p-3"
                          role="group"
                        >
                          <summary className="cursor-pointer font-medium">
                            编辑
                          </summary>
                          <form
                            action={updateArticleAction}
                            className="mt-3 grid gap-3 md:grid-cols-2"
                          >
                            <input name="id" type="hidden" value={article.id} />
                            <div className="space-y-2">
                              <Label htmlFor={`title-${article.id}`}>
                                标题
                              </Label>
                              <Input
                                defaultValue={article.title}
                                id={`title-${article.id}`}
                                maxLength={200}
                                name="title"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`slug-${article.id}`}>Slug</Label>
                              <Input
                                defaultValue={article.slug}
                                id={`slug-${article.id}`}
                                maxLength={200}
                                name="slug"
                                pattern="[a-z0-9-]+"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`category-${article.id}`}>
                                分类
                              </Label>
                              <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={article.categoryId}
                                id={`category-${article.id}`}
                                name="categoryId"
                                required
                              >
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`order-${article.id}`}>
                                排序
                              </Label>
                              <Input
                                defaultValue={article.order}
                                id={`order-${article.id}`}
                                min={0}
                                name="order"
                                type="number"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`cover-${article.id}`}>
                                封面地址
                              </Label>
                              <Input
                                defaultValue={article.coverImage ?? ""}
                                id={`cover-${article.id}`}
                                name="coverImage"
                                type="url"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`excerpt-${article.id}`}>
                                摘要
                              </Label>
                              <Textarea
                                defaultValue={article.excerpt ?? ""}
                                id={`excerpt-${article.id}`}
                                maxLength={1000}
                                name="excerpt"
                                rows={3}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`original-${article.id}`}>
                                原文
                              </Label>
                              <Textarea
                                defaultValue={article.original ?? ""}
                                id={`original-${article.id}`}
                                name="original"
                                rows={3}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`historical-${article.id}`}>
                                历史背景
                              </Label>
                              <Textarea
                                defaultValue={article.historical ?? ""}
                                id={`historical-${article.id}`}
                                name="historical"
                                rows={3}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`translation-${article.id}`}>
                                译文
                              </Label>
                              <Textarea
                                defaultValue={article.translation ?? ""}
                                id={`translation-${article.id}`}
                                name="translation"
                                rows={3}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Button type="submit">保存修改</Button>
                            </div>
                          </form>
                        </details>
                        <form
                          action={deleteArticleAction}
                          className="mt-3 inline-block"
                        >
                          <input name="id" type="hidden" value={article.id} />
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
