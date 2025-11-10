// app/philosophy/components/sidebar-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface NavItem {
  id: string;
  title: string;
  href?: string;
  children?: NavItem[];
}

interface SidebarNavProps {
  items: NavItem[];
}

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
      setExpandedItems(new Set(activePathIds));
    }
  }, [activePathIds]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavItem = (item: NavItem, level = 1) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const active = isActive(item.href);

    return (
      <div className={`nav-item nav-item-level-${level}`} key={item.id}>
        <div className="nav-item-header">
          {hasChildren ? (
            <button
              aria-expanded={isExpanded}
              aria-label={`Toggle ${item.title}`}
              className={`nav-item-toggle ${isExpanded ? "expanded" : ""}`}
              onClick={() => toggleExpand(item.id)}
              type="button"
            >
              <span className="nav-item-title">{item.title}</span>
              <span aria-hidden="true" className="nav-item-icon">
                ▶
              </span>
            </button>
          ) : item.href ? (
            <Link
              className={`nav-item-link ${active ? "active" : ""}`}
              href={item.href}
            >
              {item.title}
            </Link>
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
