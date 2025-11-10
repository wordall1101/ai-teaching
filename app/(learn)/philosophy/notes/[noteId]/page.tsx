// app/philosophy/notes/[noteId]/page.tsx
import Link from "next/link";
import { Streamdown } from "streamdown";
import {
  ArticleService,
  NoteService,
  TocItemService,
} from "@/lib/db/repositories/db-service";
import { TableOfContents } from "../../components/table-of-contents";

type NoteDetailPageProps = {
  params: {
    noteId: string;
  };
};

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const note = await NoteService.findById(params.noteId);
  if (!note) {
    return (
      <div className="note-detail-container">
        <main className="note-detail">
          <h1>笔记未找到</h1>
          <p>抱歉，您访问的笔记不存在。</p>
        </main>
        <aside className="philosophy-sidebar-right">
          <TableOfContents items={[]} />
        </aside>
      </div>
    );
  }

  const article = await ArticleService.findById(note.articleId);
  const tocItems = await TocItemService.findByEntity("note", note.id);
  const toc = [
    { id: "title", title: note.title, level: 1 },
    ...tocItems.map((t) => ({
      id: t.anchorId,
      title: t.title,
      level: t.level,
    })),
    { id: "content", title: "心得内容", level: 2 },
  ];

  return (
    <div className="note-detail-container">
      {/* 主要内容区域 */}
      <main className="note-detail">
        <h1 id="title">{note.title}</h1>

        <div className="meta">
          <span>
            发布时间：{new Date(note.createdAt).toLocaleDateString("zh-CN")}
          </span>
          {article ? (
            <Link href={`/philosophy/${article.id}`}>
              关联原文：{article.title}
            </Link>
          ) : null}
        </div>

        <section className="philosophy-section" id="content">
          <h2>心得内容</h2>
          <div className="content">
            <Streamdown>{note.content || ""}</Streamdown>
          </div>
        </section>
      </main>

      {/* 右侧目录 */}
      <aside className="philosophy-sidebar-right">
        <TableOfContents items={toc} />
      </aside>
    </div>
  );
}
