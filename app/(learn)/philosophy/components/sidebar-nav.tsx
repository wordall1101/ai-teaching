// app/philosophy/components/sidebar-nav.tsx
"use client";

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
    const dfs = (nodes: NavItem[], stack: string[]) => {
      for (const node of nodes) {
        const nextStack = [...stack, node.id];
        if (
          node.href &&
          (pathname === node.href || pathname.startsWith(`${node.href}/`))
        ) {
          path.push(...nextStack);
          return true;
        }
        if (
          node.children &&
          node.children.length > 0 &&
          dfs(node.children, nextStack)
        ) {
          return true;
        }
      }
      return false;
    };
    dfs(items, []);
    return path;
  }, [items, pathname]);

  // 根据活动项自动展开父级目录
  useEffect(() => {
    if (activePathIds.length > 0) {
      const newExpanded = new Set(expandedItems);

      // 始终展开一级节点
      items.forEach((item) => {
        newExpanded.add(item.id);
      });

      // 展开活动路径中的所有节点
      activePathIds.forEach((id) => {
        newExpanded.add(id);
      });

      setExpandedItems(newExpanded);
    }
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

  const shouldAutoExpand = (item: NavItem, level: number, active: boolean) => {
    // 一级始终展开
    if (level === 1) return true;
    // 二级默认展开（保持现有逻辑）
    if (level === 2) return expandedItems.has(item.id);
    // 三级及以后只在选中时展开
    return active && expandedItems.has(item.id);
  };

  const renderNavItem = (item: NavItem, level = 1) => {
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.href);
    const isExpanded = shouldAutoExpand(item, level, active);

    return (
      <div className={`nav-item nav-item-level-${level}`} key={item.id}>
        <div className="nav-item-header">
          {hasChildren ? (
            <button
              aria-expanded={isExpanded}
              aria-label={`Toggle ${item.title}`}
              className={`nav-item-toggle ${isExpanded ? "expanded" : ""} ${
                level === 1 ? "level-1" : ""
              }`}
              disabled={level === 1}
              onClick={() => toggleExpand(item.id, level)}
              type="button" // 禁用一级节点的折叠功能
            >
              {level === 1 ? (
                <h2 className="whitespace-nowrap text-[12px] text-muted-foreground tracking-wider">
                  {item.title}
                </h2>
              ) : (
                <>
                  <span className="nav-item-title">{item.title}</span>
                  <span aria-hidden="true" className="nav-item-icon">
                    ▶
                  </span>
                </>
              )}
            </button>
          ) : item.href ? (
            level === 1 ? (
              <h2 className="whitespace-nowrap text-[12px] text-muted-foreground tracking-wider">
                <Link
                  className={`nav-item-link ${active ? "active" : ""}`}
                  href={item.href}
                >
                  {item.title}
                </Link>
              </h2>
            ) : (
              <Link
                className={`nav-item-link ${active ? "active" : ""}`}
                href={item.href}
              >
                {item.title}
              </Link>
            )
          ) : level === 1 ? (
            <h2 className="whitespace-nowrap text-[12px] text-muted-foreground tracking-wider">
              {item.title}
            </h2>
          ) : (
            <span className="nav-item-title">{item.title}</span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="nav-item-children">
            {item.children?.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="philosophy-sidebar-nav">
      <div className="nav-menu">{items.map((item) => renderNavItem(item))}</div>
    </nav>
  );
}
