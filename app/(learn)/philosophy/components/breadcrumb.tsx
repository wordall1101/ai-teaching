// app/philosophy/components/breadcrumb.tsx
'use client';
import Link from 'next/link';

interface BreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb" aria-label="面包屑导航">
      {items.map((item, index) => (
        <span key={index} className="breadcrumb-item">
          {item.href ? (
            <>
              <Link href={item.href}>{item.label}</Link>
              {index < items.length - 1 && <span className="breadcrumb-separator">/</span>}
            </>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}