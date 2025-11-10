import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  type Article,
  article,
  type Category,
  type Course,
  category,
  course,
  type Note,
  note,
  type TocItem,
  tocItem,
} from "../schema";
import { db } from "./index";

// Category 相关操作
export const CategoryService = {
  // 创建分类
  async create(data: Category): Promise<Category> {
    const [result] = await db.insert(category).values(data).returning();
    return result;
  },

  // 获取所有分类
  async findAll(): Promise<Category[]> {
    return await db
      .select()
      .from(category)
      .orderBy(asc(category.level), asc(category.order));
  },

  // 获取顶级分类
  async findTopLevel(): Promise<Category[]> {
    return await db
      .select()
      .from(category)
      .where(eq(category.level, 0))
      .orderBy(asc(category.order));
  },

  // 根据父级ID获取子分类
  async findByParentId(parentId: string): Promise<Category[]> {
    return await db
      .select()
      .from(category)
      .where(eq(category.parentId, parentId))
      .orderBy(asc(category.order));
  },

  // 根据ID获取分类
  async findById(id: string): Promise<Category | undefined> {
    const [result] = await db
      .select()
      .from(category)
      .where(eq(category.id, id));
    return result;
  },

  // 更新分类
  async update(id: string, data: Partial<Category>): Promise<Category> {
    const [result] = await db
      .update(category)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(category.id, id))
      .returning();
    return result;
  },

  // 删除分类
  async delete(id: string): Promise<void> {
    await db.delete(category).where(eq(category.id, id));
  },

  // 获取完整的分类树
  async getCategoryTree(): Promise<Category[]> {
    const allCategories = await this.findAll();

    const buildTree = (
      categories: Category[],
      parentId: string | null = null
    ): Category[] => {
      return categories
        .filter((cat) => cat.parentId === parentId)
        .map((cat) => ({
          ...cat,
          children: buildTree(categories, cat.id),
        }));
    };

    return buildTree(allCategories);
  },
};

// Article 相关操作
export const ArticleService = {
  // 创建文章
  async create(data: Article): Promise<Article> {
    const [result] = await db.insert(article).values(data).returning();
    return result;
  },

  // 获取所有文章
  async findAll(): Promise<Article[]> {
    return await db.select().from(article).orderBy(asc(article.order));
  },

  // 根据分类ID获取文章
  async findByCategoryId(categoryId: string): Promise<Article[]> {
    return await db
      .select()
      .from(article)
      .where(eq(article.categoryId, categoryId))
      .orderBy(asc(article.order));
  },

  // 根据ID获取文章
  async findById(id: string): Promise<Article | undefined> {
    const [result] = await db.select().from(article).where(eq(article.id, id));
    return result;
  },

  // 根据slug获取文章
  async findBySlug(slug: string): Promise<Article | undefined> {
    const [result] = await db
      .select()
      .from(article)
      .where(eq(article.slug, slug));
    return result;
  },

  // 更新文章
  async update(id: string, data: Partial<Article>): Promise<Article> {
    const [result] = await db
      .update(article)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(article.id, id))
      .returning();
    return result;
  },

  // 删除文章
  async delete(id: string): Promise<void> {
    await db.delete(article).where(eq(article.id, id));
  },

  // 搜索文章
  async search(query: string): Promise<Article[]> {
    return await db
      .select()
      .from(article)
      .where(
        sql`${article.title} ILIKE ${`%${query}%`} OR ${article.excerpt} ILIKE ${`%${query}%`}`
      )
      .orderBy(asc(article.order));
  },
};

// Course 相关操作
export const CourseService = {
  // 创建课程
  async create(data: Course): Promise<Course> {
    const [result] = await db.insert(course).values(data).returning();
    return result;
  },

  // 获取所有课程
  async findAll(): Promise<Course[]> {
    return await db.select().from(course).orderBy(desc(course.createdAt));
  },

  // 根据状态获取课程
  async findByStatus(
    status: "upcoming" | "ongoing" | "completed"
  ): Promise<Course[]> {
    return await db
      .select()
      .from(course)
      .where(eq(course.status, status))
      .orderBy(desc(course.createdAt));
  },

  // 根据分类ID获取课程
  async findByCategoryId(categoryId: string): Promise<Course[]> {
    return await db
      .select()
      .from(course)
      .where(eq(course.categoryId, categoryId))
      .orderBy(desc(course.createdAt));
  },

  // 根据ID获取课程
  async findById(id: string): Promise<Course | undefined> {
    const [result] = await db.select().from(course).where(eq(course.id, id));
    return result;
  },

  // 更新课程
  async update(id: string, data: Partial<Course>): Promise<Course> {
    const [result] = await db
      .update(course)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(course.id, id))
      .returning();
    return result;
  },

  // 删除课程
  async delete(id: string): Promise<void> {
    await db.delete(course).where(eq(course.id, id));
  },
};

// TocItem 相关操作
export const TocItemService = {
  // 创建目录项
  async create(data: TocItem): Promise<TocItem> {
    const [result] = await db.insert(tocItem).values(data).returning();
    return result;
  },

  // 批量创建目录项
  async createMany(items: TocItem[]): Promise<TocItem[]> {
    return await db.insert(tocItem).values(items).returning();
  },

  // 根据实体获取目录项
  async findByEntity(entityType: string, entityId: string): Promise<TocItem[]> {
    return await db
      .select()
      .from(tocItem)
      .where(
        and(eq(tocItem.entityType, entityType), eq(tocItem.entityId, entityId))
      )
      .orderBy(asc(tocItem.order));
  },

  // 更新目录项
  async update(id: string, data: Partial<TocItem>): Promise<TocItem> {
    const [result] = await db
      .update(tocItem)
      .set(data)
      .where(eq(tocItem.id, id))
      .returning();
    return result;
  },

  // 删除目录项
  async delete(id: string): Promise<void> {
    await db.delete(tocItem).where(eq(tocItem.id, id));
  },

  // 根据实体删除所有目录项
  async deleteByEntity(entityType: string, entityId: string): Promise<void> {
    await db
      .delete(tocItem)
      .where(
        and(eq(tocItem.entityType, entityType), eq(tocItem.entityId, entityId))
      );
  },
};

// Note 相关操作
export const NoteService = {
  // 创建笔记
  async create(data: Note): Promise<Note> {
    const [result] = await db.insert(note).values(data).returning();
    return result;
  },

  // 获取所有笔记
  async findAll(): Promise<Note[]> {
    return await db.select().from(note).orderBy(desc(note.createdAt));
  },

  // 根据文章ID获取笔记
  async findByArticleId(articleId: string): Promise<Note[]> {
    return await db
      .select()
      .from(note)
      .where(eq(note.articleId, articleId))
      .orderBy(desc(note.createdAt));
  },

  // 根据用户ID获取笔记
  async findByUserId(userId: string): Promise<Note[]> {
    return await db
      .select()
      .from(note)
      .where(eq(note.userId, userId))
      .orderBy(desc(note.createdAt));
  },

  // 根据ID获取笔记
  async findById(id: string): Promise<Note | undefined> {
    const [result] = await db.select().from(note).where(eq(note.id, id));
    return result;
  },

  // 更新笔记
  async update(id: string, data: Partial<Note>): Promise<Note> {
    const [result] = await db
      .update(note)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(note.id, id))
      .returning();
    return result;
  },

  // 删除笔记
  async delete(id: string): Promise<void> {
    await db.delete(note).where(eq(note.id, id));
  },
};
