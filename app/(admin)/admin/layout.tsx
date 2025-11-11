import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { requireAdminSession } from "@/lib/auth/permissions";
import { AdminSidebar } from "./components/admin-sidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await requireAdminSession();

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-muted/10 text-sm">
        <AdminSidebar email={session.user.email ?? "admin"} />
        <SidebarInset>
          <header className="flex items-center justify-between border-b bg-background px-4 py-3">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden" />
              <div>
                <span className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
                  管理后台
                </span>
                <h2 className="font-semibold text-lg">Philosophy CMS</h2>
              </div>
            </div>
            <form action="/api/auth/signout" method="post">
              <Button type="submit" variant="outline">
                退出登录
              </Button>
            </form>
          </header>
          <main className="min-h-[calc(100vh-64px)] bg-background">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
