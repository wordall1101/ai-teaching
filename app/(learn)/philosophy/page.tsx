// app/philosophy/page.tsx
import Link from "next/link";
import {
  CategoryService,
  CourseService,
  NoteService,
} from "@/lib/db/repositories/db-service";
import {
  buildCategoryTree,
  getCourseStatusClass,
  getCourseStatusText,
} from "@/lib/utils";
import { PromotionContent } from "./components/promotion-content";
import { SidebarNav } from "./components/sidebar-nav";
import "./philosophy.css";

export default async function PhilosophyPage() {
  // 导航：分类树
  let navItems: any[] = [];
  try {
    const categories = await CategoryService.findAll();
    navItems = buildCategoryTree(categories);
  } catch {
    navItems = [];
  }

  // 课程列表
  let courses: any[] = [];
  try {
    courses = await CourseService.findAll();
  } catch {
    courses = [];
  }

  // 最新笔记（取前10条）
  let latestNotes: any[] = [];
  try {
    const notes = await NoteService.findAll();
    latestNotes = notes.slice(0, 10);
  } catch {
    latestNotes = [];
  }

  const ongoingCourse = courses.find((c) => c.status === "ongoing");
  // 右侧栏不改动（不渲染目录），因此无需生成 tocItems

  return (
    <div className="philosophy-container">
      <aside className="philosophy-sidebar-left">
        <SidebarNav items={navItems} />
      </aside>

      <main className="philosophy-content">
        <div className="philosophy-page-content">
          {/* Hero */}
          <section className="apple-hero" id="hero">
            <div className="apple-hero-inner">
              <h1 className="apple-hero-title">哲学经典学习</h1>
              <p className="apple-hero-subtitle">
                探索正心、诚意、格物的思想之美。以极简与专注，回到问题的本源。
              </p>
            </div>
          </section>

          {/* 必保留：当前进行的课程 */}
          <section className="philosophy-section" id="ongoing">
            <h2>当前进行的课程</h2>
            {ongoingCourse ? (
              <Link
                className="apple-featured-course"
                href={`/philosophy/course/${ongoingCourse.id}`}
              >
                <div className="apple-featured-course-body">
                  <div className="apple-featured-course-text">
                    <div className="apple-pill apple-pill-active">
                      {getCourseStatusText(ongoingCourse.status)}
                    </div>
                    <h3 className="apple-featured-course-title">
                      {ongoingCourse.title}
                    </h3>
                    {ongoingCourse.description ? (
                      <p className="apple-featured-course-desc">
                        {ongoingCourse.description}
                      </p>
                    ) : null}
                    <div className="apple-featured-cta">继续学习 →</div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="apple-featured-course empty">
                <div className="apple-featured-course-body">
                  <div className="apple-featured-course-text">
                    <div className="apple-pill">
                      {getCourseStatusText("upcoming")}
                    </div>
                    <h3 className="apple-featured-course-title">
                      暂无正在进行的课程
                    </h3>
                    <p className="apple-featured-course-desc">
                      即将开设新课程，敬请期待。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 全部课程 */}
          <section className="philosophy-section" id="courses">
            <h2>全部课程</h2>
            <div className="apple-card-grid">
              {courses.length === 0 ? (
                <div className="apple-card empty">
                  <p>暂无课程</p>
                </div>
              ) : (
                courses.map((c) => (
                  <Link
                    aria-label={`进入课程 ${c.title}`}
                    className="apple-card"
                    href={`/philosophy/course/${c.id}`}
                    key={c.id}
                  >
                    <div className="apple-card-header">
                      <div
                        className={`apple-pill ${getCourseStatusClass(c.status)}`}
                      >
                        {getCourseStatusText(c.status)}
                      </div>
                    </div>
                    <div className="apple-card-content">
                      <h3>{c.title}</h3>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="philosophy-section" id="latest-notes">
            <h2>最新笔记</h2>
            <div className="note-list">
              {latestNotes.length === 0 ? (
                <div className="apple-list-item empty">
                  <p>暂无笔记</p>
                </div>
              ) : (
                latestNotes.map((n: any) => (
                  <Link
                    aria-label={`查看笔记 ${n.title}`}
                    className="note-card"
                    href={`/philosophy/notes/${n.id}`}
                    key={n.id}
                  >
                    <h3>{n.title}</h3>
                    <span className="note-author">
                      {new Date(n.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <aside className="philosophy-sidebar-right">
        <PromotionContent />
      </aside>
    </div>
  );
}
