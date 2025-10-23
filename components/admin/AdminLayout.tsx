"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Settings, 
  Bell, 
  LogOut,
  Menu,
  X
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  userEmail: string;
  userRole: string;
}

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Tasks",
    href: "/admin/tasks",
    icon: ClipboardList,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Assets",
    href: "/admin/assets",
    icon: Settings,
  },
];

export default function AdminLayout({ children, userEmail, userRole }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="lg:hidden">
          <h1 className="text-xl font-bold">Maintenance Admin</h1>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{userEmail.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{userEmail}</p>
              <Badge variant="secondary" className="text-xs">
                {userRole}
              </Badge>
            </div>
          </div>

          <Button variant="ghost" size="sm">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-16 bottom-0 left-0 z-50 w-64 bg-white shadow-lg border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b lg:border-b-0">
          <h1 className="text-xl font-bold hidden lg:block">Maintenance Admin</h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 lg:mt-0 overflow-y-auto">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors",
                  isActive && "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <main className="pt-16 lg:pl-64">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
