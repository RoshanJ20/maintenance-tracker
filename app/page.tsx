"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { signOut } from "@/lib/supabaseAuth";
import AuthForm from "@/components/AuthForm";

export default function HomePage() {
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
      
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch user role
        const { data: roleData } = await supabase
          .from("users")
          .select("role")
          .eq("id", currentUser.id)
          .single();
        
        if (roleData) {
          setUserRole(roleData.role);
          
          // Redirect based on role
          if (roleData.role === "admin" || roleData.role === "supervisor") {
            router.push("/admin");
            return;
          } else {
            // Regular users go to user dashboard
            router.push("/dashboard");
            return;
          }
        }
      } else {
        setUser(null);
        setUserRole(null);
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Maintenance Tracker</h1>
          <AuthForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <p className="mb-2">
            <strong>Email:</strong> {user.email}
          </p>
          <p className="mb-2">
            <strong>Role:</strong> {userRole || "No role assigned"}
          </p>
          <p className="mb-4">
            <strong>Email Confirmed:</strong> {user.email_confirmed_at ? "Yes" : "No"}
          </p>
          
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
        
        {userRole && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <a 
              href="/assets" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Manage Assets
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
