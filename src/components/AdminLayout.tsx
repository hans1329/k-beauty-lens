import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import Navigation from "@/components/Navigation";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <SidebarProvider>
        <div className="flex w-full min-h-[calc(100vh-64px)]">
          <AdminSidebar />
          
          <div className="flex-1 flex flex-col">
            <header className="h-14 border-b flex items-center px-6 sticky top-0 bg-background z-10">
              <SidebarTrigger />
            </header>
            
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
