import { Streamdown } from "streamdown";
import {
  CategoryService,
  CourseService,
  TocItemService,
} from "@/lib/db/repositories/db-service";
import { buildCategoryTree } from "@/lib/utils";
import { SidebarNav } from "../../components/sidebar-nav";
import { TableOfContents } from "../../components/table-of-contents";

type CourseDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  // 左侧导航
  let navItems: any[] = [];
  try {
    const categories = await CategoryService.findAll();
    navItems = buildCategoryTree(categories);
  } catch {
    navItems = [];
  }

  const course = await CourseService.findById(params.id);
  if (!course) {
    return (
      <>
        <aside className="philosophy-sidebar-left">
          <SidebarNav items={navItems} />
        </aside>
        <main className="philosophy-content">
          <div className="philosophy-detail">
            <h1>课程未找到</h1>
            <p>抱歉，您访问的课程不存在。</p>
          </div>
        </main>
        <aside className="philosophy-sidebar-right">
          <TableOfContents items={[]} />
        </aside>
      </>
    );
  }

  const tocItems = await TocItemService.findByEntity("course", course.id);
  const toc = [
    { id: "title", title: course.title, level: 1 },
    ...tocItems.map((t) => ({
      id: t.anchorId,
      title: t.title,
      level: t.level,
    })),
  ];

  return (
    <div className="philosophy-container">
      <aside className="philosophy-sidebar-left">
        <SidebarNav items={navItems} />
      </aside>
      <main className="philosophy-content">
        <div className="philosophy-detail">
          <h1 id="title">{course.title}</h1>
          {course.description ? (
            <section className="philosophy-section" id="description">
              <h2>课程简介</h2>
              <Streamdown>{course.description || ""}</Streamdown>
            </section>
          ) : null}
        </div>
      </main>
      <aside className="philosophy-sidebar-right">
        <TableOfContents items={toc} />
      </aside>
    </div>
  );
}
