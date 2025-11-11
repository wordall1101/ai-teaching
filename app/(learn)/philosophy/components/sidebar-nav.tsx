// app/philosophy/components/sidebar-nav.tsx
"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  id: string;
  title: string;
  href?: string;
  children?: NavItem[];
};

type SidebarNavProps = {
  items: NavItem[];
};

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 找到与当前路径匹配的节点路径（用于自动展开父级）
  const activePathIds = useMemo(() => {
    const path: string[] = [];

    const findActivePath = (
      nodes: NavItem[],
      currentPath: string[]
    ): boolean => {
      for (const node of nodes) {
        const newPath = [...currentPath, node.id];

        // 检查当前节点是否匹配
        if (
          node.href &&
          (pathname === node.href || pathname.startsWith(`${node.href}/`))
        ) {
          path.push(...newPath);
          return true;
        }

        // 递归检查子节点
        if (
          node.children &&
          node.children.length > 0 &&
          findActivePath(node.children, newPath)
        ) {
          path.push(...newPath);
          return true;
        }
      }
      return false;
    };

    findActivePath(items, []);
    return Array.from(new Set(path)); // 去重
  }, [items, pathname]);

  // 根据活动项自动展开父级目录
  useEffect(() => {
    // 修复类型错误：明确指定 Set 的泛型类型为 string
    const newExpanded = new Set<string>();

    // 始终展开一级节点
    items.forEach((item) => {
      newExpanded.add(item.id);
    });

    // 展开活动路径中的所有节点
    activePathIds.forEach((id) => {
      newExpanded.add(id);
    });

    setExpandedItems(newExpanded);
  }, [activePathIds, items]);

  const toggleExpand = (id: string, level: number) => {
    // 一级节点不允许折叠
    if (level === 1) return;

    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href?: string) => {
    if (!href) {
      return false;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isExpanded = (item: NavItem, level: number) => {
    // 一级始终展开
    if (level === 1) return true;
    // 其他层级根据 expandedItems 状态决定
    return expandedItems.has(item.id);
  };

  const renderNavItem = (item: NavItem, level = 1) => {
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.href);
    const expanded = isExpanded(item, level);

    // 一级节点特殊处理
    if (level === 1) {
      return (
        <div className="mb-4" key={item.id}>
          <h2 className="mb-2 whitespace-nowrap text-[12px] text-muted-foreground tracking-wider">
            {item.title}
          </h2>
          {hasChildren && (
            <div className="space-y-1">
              {item.children?.map((child) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // 二级及以下节点
    const getPaddingClass = () => {
      if (level === 2) return "pl-0"; // 二级与一级对齐
      if (level >= 3) return "pl-4"; // 三级及以后使用 pl-4
      return "";
    };

    return (
      <div className={`${getPaddingClass()} mb-1`} key={item.id}>
        {hasChildren ? (
          <>
            <button
              className={`flex w-full items-center justify-between rounded-md p-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground ${
                active ? "bg-accent text-accent-foreground" : ""
              }`}
              onClick={() => toggleExpand(item.id, level)}
            >
              <div className="flex items-center">
                <span className="text-sm">{item.title}</span>
              </div>
              <ChevronRight
                className={`h-3 w-3 transition-transform ${
                  expanded ? "rotate-90" : ""
                }`}
              />
            </button>
            <div className={`${expanded ? "block" : "hidden"} mt-1`}>
              {item.children?.map((child) => renderNavItem(child, level + 1))}
            </div>
          </>
        ) : (
          <Link
            className={`block rounded-md p-2 text-sm transition-colors ${
              active
                ? "bg-accent font-medium text-accent-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
            href={item.href!}
          >
            <div className="flex items-center">
              <span>{item.title}</span>
            </div>
          </Link>
        )}
      </div>
    );
  };

  return (
    <nav className="philosophy-sidebar-nav">
      <div className="space-y-4">
        {items.map((item) => renderNavItem(item))}
      </div>
    </nav>
  );
}
