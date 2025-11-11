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
import {
  ArticleService,
  CourseService,
  NoteService,
  TocItemService,
} from "@/lib/db/repositories/db-service";
import type { Article, Course, Note, TocItem } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import {
  createTocItemAction,
  deleteTocItemAction,
  updateTocItemAction,
} from "./actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const entityTypeLabels: Record<TocItem["entityType"], string> = {
  article: "文章",
  note: "笔记",
  course: "课程",
};

const anchorHint =
  "建议使用英文与短横线组合，例如 introduction 或 section-01，用于前端锚点定位。";

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

function getEntityLabel(
  item: TocItem,
  articles: Article[],
  notes: Note[],
  courses: Course[]
) {
  if (item.entityType === "article") {
    return (
      articles.find((article) => article.id === item.entityId)?.title ??
      "文章已删除"
    );
  }

  if (item.entityType === "note") {
    return (
      notes.find((note) => note.id === item.entityId)?.title ?? "笔记已删除"
    );
  }

  if (item.entityType === "course") {
    return (
      courses.find((course) => course.id === item.entityId)?.title ??
      "课程已删除"
    );
  }

  return "未知实体";
}

export default async function TocItemsPage({ searchParams }: PageProps) {
  const [tocItems, articles, notes, courses] = await Promise.all([
    TocItemService.findAll(),
    ArticleService.findAll(),
    NoteService.findAll(),
    CourseService.findAll(),
  ]);

  const resolvedSearchParams = await searchParams;
  const status = (resolvedSearchParams?.status as string | undefined) ?? "";
  const message = (resolvedSearchParams?.message as string | undefined) ?? "";

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl">目录管理</h1>
          <p className="text-muted-foreground text-sm">
            维护文章、笔记、课程的锚点目录结构，支持多层级排序。
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
          <CardTitle>新增目录项</CardTitle>
          <CardDescription>
            创建目录节点，关联指定的文章、笔记或课程。可以在下方参考可用的实体
            ID。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={createTocItemAction}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="entityType">实体类型</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="entityType"
                name="entityType"
                required
              >
                {Object.entries(entityTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entityId">实体 ID</Label>
              <Input
                id="entityId"
                maxLength={36}
                minLength={36}
                name="entityId"
                placeholder="请粘贴文章 / 笔记 / 课程的 UUID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">目录标题</Label>
              <Input
                id="title"
                maxLength={200}
                minLength={1}
                name="title"
                placeholder="显示在目录中的标题"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anchorId">Anchor ID</Label>
              <Input
                id="anchorId"
                maxLength={200}
                minLength={1}
                name="anchorId"
                pattern="[A-Za-z0-9-_]+"
                placeholder="例如 overview 或 section-1"
                required
              />
              <p className="text-muted-foreground text-xs">{anchorHint}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">层级</Label>
              <Input
                defaultValue={1}
                id="level"
                min={1}
                name="level"
                type="number"
              />
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
            <div className="md:col-span-2">
              <Button type="submit">创建目录项</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>已存在的目录项</CardTitle>
          <CardDescription>
            按照实体类型排序。点击“编辑”可直接调整层级、排序或锚点。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="w-44 border-b p-3 font-medium">实体类型</th>
                  <th className="w-64 border-b p-3 font-medium">关联实体</th>
                  <th className="w-48 border-b p-3 font-medium">Anchor</th>
                  <th className="w-24 border-b p-3 font-medium">层级</th>
                  <th className="w-24 border-b p-3 font-medium">排序</th>
                  <th className="w-44 border-b p-3 font-medium">更新时间</th>
                  <th className="border-b p-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {tocItems.length === 0 ? (
                  <tr>
                    <td
                      className="p-4 text-center text-muted-foreground"
                      colSpan={7}
                    >
                      暂无目录数据。
                    </td>
                  </tr>
                ) : (
                  tocItems.map((item) => (
                    <tr className="border-b last:border-b-0" key={item.id}>
                      <td className="p-3 align-top">
                        <div className="font-medium">
                          {entityTypeLabels[item.entityType] ?? item.entityType}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {item.entityId}
                        </p>
                      </td>
                      <td className="p-3 align-top">
                        {getEntityLabel(item, articles, notes, courses)}
                      </td>
                      <td className="p-3 align-top">
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {item.anchorId}
                        </code>
                      </td>
                      <td className="p-3 align-top">{item.level}</td>
                      <td className="p-3 align-top">{item.order}</td>
                      <td className="p-3 align-top">
                        {formatDateTime(item.createdAt)}
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
                            action={updateTocItemAction}
                            className="mt-3 grid gap-3 md:grid-cols-2"
                          >
                            <input name="id" type="hidden" value={item.id} />
                            <div className="space-y-2">
                              <Label htmlFor={`entityType-${item.id}`}>
                                实体类型
                              </Label>
                              <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={item.entityType}
                                id={`entityType-${item.id}`}
                                name="entityType"
                                required
                              >
                                {Object.entries(entityTypeLabels).map(
                                  ([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`entityId-${item.id}`}>
                                实体 ID
                              </Label>
                              <Input
                                defaultValue={item.entityId}
                                id={`entityId-${item.id}`}
                                maxLength={36}
                                minLength={36}
                                name="entityId"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`title-${item.id}`}>
                                目录标题
                              </Label>
                              <Input
                                defaultValue={item.title}
                                id={`title-${item.id}`}
                                maxLength={200}
                                name="title"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`anchor-${item.id}`}>
                                Anchor
                              </Label>
                              <Input
                                defaultValue={item.anchorId}
                                id={`anchor-${item.id}`}
                                maxLength={200}
                                name="anchorId"
                                pattern="[A-Za-z0-9-_]+"
                                required
                              />
                              <p className="text-muted-foreground text-xs">
                                {anchorHint}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`level-${item.id}`}>层级</Label>
                              <Input
                                defaultValue={item.level}
                                id={`level-${item.id}`}
                                min={1}
                                name="level"
                                type="number"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`order-${item.id}`}>排序</Label>
                              <Input
                                defaultValue={item.order}
                                id={`order-${item.id}`}
                                min={0}
                                name="order"
                                type="number"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Button type="submit">保存修改</Button>
                            </div>
                          </form>
                        </details>
                        <form
                          action={deleteTocItemAction}
                          className="mt-3 inline-block"
                        >
                          <input name="id" type="hidden" value={item.id} />
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

      <Card>
        <CardHeader>
          <CardTitle>实体 ID 参考</CardTitle>
          <CardDescription>
            常用文章、笔记与课程的 UUID，便于快速复制粘贴到目录表单中。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <section>
            <h3 className="mb-2 font-semibold text-sm">文章</h3>
            <ul className="space-y-2 text-xs">
              {articles.map((article) => (
                <li className="rounded border bg-muted/40 p-3" key={article.id}>
                  <p className="font-medium">{article.title}</p>
                  <p className="break-all text-muted-foreground">
                    {article.id}
                  </p>
                </li>
              ))}
              {articles.length === 0 ? (
                <li className="text-muted-foreground">暂无文章数据</li>
              ) : null}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 font-semibold text-sm">笔记</h3>
            <ul className="space-y-2 text-xs">
              {notes.map((note) => (
                <li className="rounded border bg-muted/40 p-3" key={note.id}>
                  <p className="font-medium">{note.title}</p>
                  <p className="break-all text-muted-foreground">{note.id}</p>
                </li>
              ))}
              {notes.length === 0 ? (
                <li className="text-muted-foreground">暂无笔记数据</li>
              ) : null}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 font-semibold text-sm">课程</h3>
            <ul className="space-y-2 text-xs">
              {courses.map((course) => (
                <li className="rounded border bg-muted/40 p-3" key={course.id}>
                  <p className="font-medium">{course.title}</p>
                  <p className="break-all text-muted-foreground">{course.id}</p>
                </li>
              ))}
              {courses.length === 0 ? (
                <li className="text-muted-foreground">暂无课程数据</li>
              ) : null}
            </ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
