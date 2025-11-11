"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Layers,
  ListTree,
  NotebookPen,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/admin/categories",
    label: "分类管理",
    icon: Layers,
    description: "维护三级导航结构",
  },
  {
    href: "/admin/articles",
    label: "文章管理",
    icon: FileText,
    description: "统一管理文章内容与排序",
  },
  {
    href: "/admin/courses",
    label: "课程管理",
    icon: GraduationCap,
    description: "管理课程信息与状态",
  },
  {
    href: "/admin/toc-items",
    label: "目录管理",
    icon: ListTree,
    description: "维护文章与笔记的目录结构",
  },
  {
    href: "/admin/notes",
    label: "笔记管理",
    icon: NotebookPen,
    description: "审核与维护学习笔记",
  },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r bg-background" collapsible="icon">
      <SidebarHeader className="flex items-center gap-2 px-3 py-4">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5" />
          <span className="font-semibold">Ultracite Admin</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>内容管理</SidebarGroupLabel>
          <SidebarMenu>
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href}>
                  <Link className="flex items-center gap-2" href={item.href}>
                    <item.icon className="size-4" />
                    <div className="flex flex-col">
                      <span>{item.label}</span>
                      <span className="text-muted-foreground text-xs">
                        {item.description}
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
      </SidebarContent>
      <SidebarFooter className="px-3 pb-4">
        <div className="w-full rounded-md border bg-muted px-3 py-2 text-xs leading-tight">
          <p className="font-semibold uppercase tracking-wide text-muted-foreground">
            当前管理员
          </p>
          <p className={cn("truncate text-foreground")}>{email}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

