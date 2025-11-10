// app/philosophy/category/[id]/page.tsx

import Image from "next/image";
import Link from "next/link";
import {
  ArticleService,
  CategoryService,
  TocItemService,
} from "@/lib/db/repositories/db-service";
import { type Article, type Category, Note } from "@/lib/db/schema";
import { buildCategoryTree } from "@/lib/utils";
import { SidebarNav } from "../../components/sidebar-nav";
import { TableOfContents } from "../../components/table-of-contents";

interface CategoryPageProps {
  params: {
    id: string;
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  // 获取当前分类信息
  let currentCategory: Category = {} as Category;
  try {
    const directCategory = await CategoryService.findById(params.id);
    if (directCategory) {
      currentCategory = directCategory;
    }
  } catch (error) {
    console.error("Failed to load category:", error);
    return (
      <div className="philosophy-container">
        <main className="philosophy-content">
          <div className="error-state">
            <h1>分类未找到</h1>
            <p>抱歉，您访问的分类不存在。</p>
            <Link className="back-link" href="/philosophy">
              返回哲学首页
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // 获取分类树用于导航
  let navItems = [];
  try {
    const categories = await CategoryService.findAll();
    navItems = buildCategoryTree(categories);
  } catch (error) {
    console.error("Failed to load categories:", error);
    navItems = [];
  }

  // 获取当前分类及其子分类的所有文章
  let articles: Article[] = [];
  try {
    // 首先获取当前分类的所有直接文章
    const directArticles = await ArticleService.findByCategoryId(params.id);
    articles = [...directArticles];

    // // 获取当前分类的所有子分类
    // const childCategories = await CategoryService.findByParentId(params.id);

    // // 获取每个子分类的文章
    // for (const childCategory of childCategories) {
    //   const childArticles = await ArticleService.findByCategoryId(childCategory.id);
    //   articles = [...articles, ...childArticles];
    // }

    // 按 order 字段排序
    // articles.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Failed to load articles:", error);
    articles = [];
  }

  // 获取当前分类的子分类（用于展示分类结构）
  // let childCategories: Category[] = [];
  // try {
  //   childCategories = await CategoryService.findByParentId(params.id);
  //   childCategories.sort((a, b) => a.order - b.order);
  // } catch (error) {
  //   console.error('Failed to load child categories:', error);
  //   childCategories = [];
  // }

  // 目录数据
  const tocItems = [
    { id: "category-info", title: currentCategory.title, level: 1 },
    { id: "subcategories", title: "子分类", level: 2 },
    { id: "articles", title: "文章列表", level: 2 },
  ];

  return (
    <div className="philosophy-container">
      {/* 左侧导航菜单 */}
      <aside className="philosophy-sidebar-left">
        <SidebarNav items={navItems} />
      </aside>

      {/* 中间内容区域 */}
      <main className="philosophy-content">
        <div className="category-page">
          <h1 id="category-info">{currentCategory.title}</h1>

          {currentCategory.description && (
            <div className="category-description">
              <p>{currentCategory.description}</p>
            </div>
          )}

          {/* 文章列表 */}
          <section className="philosophy-section" id="articles">
            <h2>文章列表</h2>
            <div className="article-list">
              {articles.length > 0 ? (
                articles.map((article) => (
                  <ArticleCard article={article} key={article.id} />
                ))
              ) : (
                <div className="empty-state">
                  <p>该分类下暂无文章</p>
                  <Link className="back-link" href="/philosophy">
                    浏览其他分类
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* 右侧目录 */}
      <aside className="philosophy-sidebar-right">
        <TableOfContents items={tocItems} />
      </aside>
    </div>
  );
}

// 文章卡片组件
function ArticleCard({ article }: { article: any }) {
  return (
    <Link className="article-card" href={`/philosophy/${article.id}`}>
      {article.coverImage ? (
        <div className="article-card-cover">
          <Image
            alt={article.title}
            height={450}
            src={article.coverImage}
            style={{ width: "100%", height: "auto" }}
            width={800}
          />
        </div>
      ) : null}
      <div className="article-card-content">
        <h3>{article.title}</h3>
        {article.excerpt && (
          <p className="article-card-excerpt">{article.excerpt}</p>
        )}
        <div className="article-card-meta">
          <span className="article-order">第 {article.order + 1} 章</span>
          {article.createdAt && (
            <span className="article-date">
              {new Date(article.createdAt).toLocaleDateString("zh-CN")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
