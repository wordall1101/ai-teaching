// app/philosophy/[id]/page.tsx
import Link from "next/link";
import { Streamdown } from "streamdown";
import {
  ArticleService,
  CategoryService,
  NoteService,
  TocItemService,
} from "@/lib/db/repositories/db-service";
import { buildCategoryTree } from "@/lib/utils";
import { SidebarNav } from "../components/sidebar-nav";
import { TableOfContents } from "../components/table-of-contents";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // 左侧导航
  let navItems: any[] = [];
  try {
    const categories = await CategoryService.findAll();
    navItems = buildCategoryTree(categories);
  } catch {
    navItems = [];
  }

  // 文章详情
  const article = await ArticleService.findById(id);
  if (!article) {
    return (
      <>
        <aside className="philosophy-sidebar-left">
          <SidebarNav items={navItems} />
        </aside>
        <main className="philosophy-content">
          <div className="philosophy-detail">
            <h1>文章未找到</h1>
            <p>抱歉，您访问的文章不存在。</p>
          </div>
        </main>
        <aside className="philosophy-sidebar-right">
          <TableOfContents items={[]} />
        </aside>
      </>
    );
  }

  // 目录（右侧）
  const tocItems = await TocItemService.findByEntity("article", article.id);
  const toc = [
    { id: "title", title: article.title, level: 1 },
    ...tocItems.map((t) => ({
      id: t.anchorId,
      title: t.title,
      level: t.level,
    })),
    { id: "notes", title: "学生心得", level: 2 },
  ];

  // 相关笔记
  const notes = await NoteService.findByArticleId(article.id);

  return (
    <div className="philosophy-container">
      <aside className="philosophy-sidebar-left">
        <SidebarNav items={navItems} />
      </aside>

      <main className="philosophy-content">
        <div className="philosophy-detail">
          <h1 id="title">{article.title}</h1>

          {article.original ? (
            <section className="philosophy-section" id="original">
              <h2>原文</h2>
              <Streamdown>{article.original || ""}</Streamdown>
            </section>
          ) : null}

          {article.historical ? (
            <section className="philosophy-section" id="historical">
              <h2>历史背景</h2>
              <Streamdown>{article.historical || ""}</Streamdown>
            </section>
          ) : null}

          {article.translation ? (
            <section className="philosophy-section" id="translation">
              <h2>译文</h2>
              <Streamdown>{article.translation || ""}</Streamdown>
            </section>
          ) : null}

          <section className="philosophy-section" id="notes">
            <h2>学生心得</h2>
            <div className="note-list">
              {notes.length === 0 ? (
                <div className="note-card">
                  <h3>暂无心得</h3>
                </div>
              ) : (
                notes.map((note) => (
                  <Link
                    className="note-card"
                    href={`/philosophy/notes/${note.id}`}
                    key={note.id}
                  >
                    <h3>{note.title}</h3>
                    <span className="note-author">
                      {new Date(note.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <aside className="philosophy-sidebar-right">
        <TableOfContents items={toc} />
      </aside>
    </div>
  );
}
