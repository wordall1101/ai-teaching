"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function NavSearch() {
  return (
    <div className="nav-search">
      <Search className="nav-search-icon" size={16} />
      <Input
        type="search"
        placeholder="搜索..."
        className="nav-search-input"
      />
    </div>
  );
}

