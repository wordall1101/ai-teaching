import type {
  CoreAssistantMessage,
  CoreToolMessage,
  UIMessage,
  UIMessagePart,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { formatISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import type { DBMessage, Document,Category } from '@/lib/db/schema';
import { ChatSDKError, type ErrorCode } from './errors';
import type { ChatMessage, ChatTools, CustomUIDataTypes } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: UIMessage[]) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Document[],
  index: number,
) {
  if (!documents) { return new Date(); }
  if (index > documents.length) { return new Date(); }

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: ResponseMessage[];
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) { return null; }

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
    parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}

export function getTextFromMessage(message: ChatMessage | UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string}).text)
    .join('');
}

// 将扁平分类数据转换为树形结构
export function buildCategoryTree(categories: Category[]): any[] {
  const categoryMap = new Map();
  const tree: any[] = [];

  // 首先将所有分类存入 map
  categories.forEach(category => {
    categoryMap.set(category.id, {
      ...category,
      children: [],
      href: `/philosophy/category/${category.id}`
    });
  });

  // 构建树形结构
  categories.forEach(category => {
    const node = categoryMap.get(category.id);
    if (category.parentId && categoryMap.has(category.parentId)) {
      const parent = categoryMap.get(category.parentId);
      parent.children.push(node);
    } else {
      tree.push(node);
    }
  });

  return tree.sort((a, b) => a.order - b.order);
}

// 转换课程状态显示文本
export function getCourseStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    upcoming: '即将开始',
    ongoing: '进行中',
    completed: '已结束'
  };
  return statusMap[status] || status;
}

// 转换课程状态样式类名
export function getCourseStatusClass(status: string): string {
  const classMap: { [key: string]: string } = {
    upcoming: '',
    ongoing: 'active',
    completed: 'completed'
  };
  return classMap[status] || '';
}

// 获取分类的完整路径（面包屑）
export function getCategoryPath(categories: Category[], categoryId: string): Category[] {
  const path: Category[] = [];
  let currentCategory = categories.find(cat => cat.id === categoryId);
  
  while (currentCategory) {
    path.unshift(currentCategory);
    currentCategory = currentCategory.parentId 
      ? categories.find(cat => cat.id === currentCategory.parentId)
      : null;
  }
  
  return path;
}

// 获取分类下的所有子分类ID（包括自身）
export function getAllSubcategoryIds(categories: Category[], parentId: string): string[] {
  const ids: string[] = [parentId];
  const children = categories.filter(cat => cat.parentId === parentId);
  
  for (const child of children) {
    ids.push(...getAllSubcategoryIds(categories, child.id));
  }
  
  return ids;
}