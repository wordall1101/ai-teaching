// app/philosophy/components/table-of-contents.tsx
"use client";

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items?: TocItem[];
}

export function TableOfContents({ items = [] }: TableOfContentsProps) {
  if (items.length === 0) {
    return (
      <aside className="philosophy-toc">
        <div className="toc-header">
          <h3>目录</h3>
        </div>
        <div className="toc-content">
          <p className="toc-empty">暂无目录</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="philosophy-toc">
      <div className="toc-header">
        <h3>目录</h3>
      </div>
      <nav className="toc-content">
        <ul className="toc-list">
          {items.map((item) => (
            <li
              key={item.id}
              className={`toc-item toc-item-level-${item.level}`}
            >
              <a href={`#${item.id}`} className="toc-link">
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

