// app/philosophy/components/breadcrumb.tsx
"use client";
import Link from "next/link";

type BreadcrumbProps = {
  items: Array<{
    label: string;
    href?: string;
  }>;
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="面包屑导航" className="breadcrumb">
      {items.map((item, index) => (
        <span className="breadcrumb-item" key={index}>
          {item.href ? (
            <>
              <Link href={item.href}>{item.label}</Link>
              {index < items.length - 1 && (
                <span className="breadcrumb-separator">/</span>
              )}
            </>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
