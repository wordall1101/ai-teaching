import "server-only";

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schema'; // 修正路径，应该是相对路径

// 数据库连接
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client, { schema });

export type Database = typeof db;

// 基础 Repository 类
export abstract class BaseRepository {
  protected db: Database;

  constructor() {
    this.db = db;
  }

  // 通用的分页方法
  protected async paginate<T>(
    query: Promise<T[]>,
    countQuery: Promise<{ count: number }[]>,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const [data, countResult] = await Promise.all([query, countQuery]);
    const total = Number(countResult[0]?.count || 0);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // 通用的事务支持
  protected async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return await callback(this.db);
  }
}