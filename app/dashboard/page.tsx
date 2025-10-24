"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { signOut } from "@/lib/supabaseAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Package, LogOut } from "lucide-react";

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ 
    id: string; 
    email?: string; 
    email_confirmed_at?: string;
  } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;
      
      if (!currentUser) {
        router.push("/");
        return;
      }

      setUser(currentUser);
      
      // Fetch user role
      const { data: roleData } = await supabase
        .from("users")
        .select("role")
        .eq("id", currentUser.id)
        .single();
      
      if (roleData) {
        setUserRole(roleData.role);
        
        // Redirect admins to admin dashboard
        if (roleData.role === "admin" || roleData.role === "supervisor") {
          router.push("/admin");
          return;
        }
      }
      
      setLoading(false);
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Maintenance Tracker</h1>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user?.email}</p>
                  {userRole && (
                    <Badge variant="secondary" className="text-xs">
                      {userRole}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Sign out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-gray-500 mt-2">Welcome back, {user?.email?.split('@')[0]}!</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* My Tasks Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/tasks')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="h-5 w-5 mr-2 text-blue-600" />
                My Tasks
              </CardTitle>
              <CardDescription>
                View and manage your assigned tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-xs text-gray-500 mt-1">Active tasks</p>
            </CardContent>
          </Card>

          {/* Assets Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/assets')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2 text-green-600" />
                Assets
              </CardTitle>
              <CardDescription>
                View maintenance assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">-</div>
              <p className="text-xs text-gray-500 mt-1">Available assets</p>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
              <CardDescription>
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <Badge variant="outline" className="text-xs">
                  {userRole || "No role assigned"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <Badge variant={user?.email_confirmed_at ? "default" : "secondary"} className="text-xs">
                  {user?.email_confirmed_at ? "Verified" : "Pending verification"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
