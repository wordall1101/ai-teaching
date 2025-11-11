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
  ArticleService,
  NoteService,
  UserService,
} from "@/lib/db/repositories/db-service";
import type { Article, Note } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import {
  createNoteAction,
  deleteNoteAction,
  updateNoteAction,
} from "./actions";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
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

function getArticleTitle(articles: Article[], id: string) {
  return articles.find((article) => article.id === id)?.title ?? "文章已删除";
}

export default async function NotesPage({ searchParams }: PageProps) {
  const [notes, articles, users] = await Promise.all([
    NoteService.findAll(),
    ArticleService.findAll(),
    UserService.findAll(),
  ]);

  const status = (searchParams?.status as string | undefined) ?? "";
  const message = (searchParams?.message as string | undefined) ?? "";

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl">笔记管理</h1>
          <p className="text-muted-foreground text-sm">
            审阅与维护学习笔记内容，可关联文章并调整作者归属。
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
          <CardTitle>新增笔记</CardTitle>
          <CardDescription>
            记录学习心得或补充内容，将笔记与文章、用户进行关联。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createNoteAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="articleId">关联文章</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="articleId"
                name="articleId"
                required
              >
                <option value="">请选择</option>
                {articles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">所属用户</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="userId"
                name="userId"
                required
              >
                <option value="">请选择</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email ?? user.id}（{user.role}）
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">笔记标题</Label>
              <Input
                id="title"
                maxLength={200}
                minLength={1}
                name="title"
                placeholder="请输入笔记标题"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="content">笔记内容</Label>
              <Textarea
                id="content"
                minLength={1}
                name="content"
                placeholder="支持 Markdown，可直接粘贴学习心得或引用内容"
                required
                rows={6}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">创建笔记</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>笔记列表</CardTitle>
          <CardDescription>
            查看全部笔记，支持直接修改内容或删除不需要的记录。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="w-48 border-b p-3 font-medium">标题</th>
                  <th className="w-64 border-b p-3 font-medium">关联文章</th>
                  <th className="w-48 border-b p-3 font-medium">用户</th>
                  <th className="w-44 border-b p-3 font-medium">更新时间</th>
                  <th className="border-b p-3 font-medium">笔记内容</th>
                  <th className="w-[360px] border-b p-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {notes.length === 0 ? (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground" colSpan={6}>
                      暂无笔记。
                    </td>
                  </tr>
                ) : (
                  notes.map((note) => (
                    <tr className="border-b last:border-b-0" key={note.id}>
                      <td className="align-top p-3 font-medium">{note.title}</td>
                      <td className="align-top p-3">
                        <div className="font-medium">
                          {getArticleTitle(articles, note.articleId)}
                        </div>
                        <p className="text-muted-foreground text-xs break-all">
                          {note.articleId}
                        </p>
                      </td>
                      <td className="align-top p-3">
                        <div className="font-medium">
                          {users.find((user) => user.id === note.userId)?.email ??
                            "用户已删除"}
                        </div>
                        <p className="text-muted-foreground text-xs break-all">
                          {note.userId}
                        </p>
                      </td>
                      <td className="align-top p-3">{formatDateTime(note.updatedAt)}</td>
                      <td className="align-top p-3">
                        <p className="line-clamp-6 whitespace-pre-wrap text-muted-foreground text-xs leading-relaxed">
                          {note.content ?? "—"}
                        </p>
                      </td>
                      <td className="align-top p-3">
                        <details className="rounded border bg-muted/40 p-3" role="group">
                          <summary className="cursor-pointer font-medium">
                            编辑
                          </summary>
                          <form
                            action={updateNoteAction}
                            className="mt-3 grid gap-3 md:grid-cols-2"
                          >
                            <input name="id" type="hidden" value={note.id} />
                            <div className="space-y-2">
                              <Label htmlFor={`article-${note.id}`}>关联文章</Label>
                              <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={note.articleId}
                                id={`article-${note.id}`}
                                name="articleId"
                                required
                              >
                                {articles.map((article) => (
                                  <option key={article.id} value={article.id}>
                                    {article.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`user-${note.id}`}>所属用户</Label>
                              <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={note.userId}
                                id={`user-${note.id}`}
                                name="userId"
                                required
                              >
                                {users.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.email ?? user.id}（{user.role}）
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`title-${note.id}`}>笔记标题</Label>
                              <Input
                                defaultValue={note.title}
                                id={`title-${note.id}`}
                                maxLength={200}
                                name="title"
                                required
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`content-${note.id}`}>笔记内容</Label>
                              <Textarea
                                defaultValue={note.content ?? ""}
                                id={`content-${note.id}`}
                                minLength={1}
                                name="content"
                                required
                                rows={6}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Button type="submit">保存修改</Button>
                            </div>
                          </form>
                        </details>
                        <form action={deleteNoteAction} className="mt-3 inline-block">
                          <input name="id" type="hidden" value={note.id} />
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

