// app/philosophy/layout.tsx
import Link from "next/link";
import { NavSearch } from "./components/nav-search";

export const metadata = {
  title: "哲学经典学习",
  description: "探索正心、诚意、格物的哲学智慧",
};

export default function PhilosophyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="philosophy-layout">
      {/* 哲学页面专属导航 - 固定顶部 */}
      <nav className="philosophy-nav">
        <div className="nav-container">
          {/* Logo */}
          <Link className="nav-logo" href="/philosophy">
            哲学
          </Link>

          {/* 导航链接 */}
          <div className="nav-links">
            <Link className="nav-link active" href="/philosophy">
              哲学
            </Link>
            <Link className="nav-link" href="/philosophy/books">
              书籍
            </Link>
            <Link className="nav-link" href="/philosophy/experiments">
              实验
            </Link>
          </div>

          {/* 搜索框 */}
          <NavSearch />
        </div>
      </nav>

      {children}
    </div>
  );
}
