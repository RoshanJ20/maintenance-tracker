"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  userRole: string | null;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the current session and set the user
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        return;
      }
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    fetchSession();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Fetch the user's role
    const fetchUserRole = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
      } else {
        setUserRole(data?.role ?? null);
      }
    };

    fetchUserRole();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, userRole }}>
      {children}
    </AuthContext.Provider>
  );
}