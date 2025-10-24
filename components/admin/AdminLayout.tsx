"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "@/lib/supabaseAuth";
import { 
  Bell, 
  LogOut
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  userEmail: string;
  userRole: string;
}

export default function AdminLayout({ children, userEmail, userRole }: AdminLayoutProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b h-16 flex items-center justify-between px-4 md:px-6">
        {/* Left side - Title */}
        <div className="flex items-center space-x-3">
          <h1 className="text-lg md:text-xl font-bold">Maintenance Admin</h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          <div className="flex items-center space-x-2 md:space-x-3">
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

          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
