"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function NavSearch() {
  return (
    <div className="nav-search">
      <Search className="nav-search-icon" size={16} />
      <Input className="nav-search-input" placeholder="搜索..." type="search" />
    </div>
  );
}
