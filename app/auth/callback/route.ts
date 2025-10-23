import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    // Create a Supabase client with the request context
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (session && !error) {
      // Fetch user role to determine redirect
      const { data: roleData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();
      
      if (roleData) {
        // Redirect based on role
        if (roleData.role === "admin" || roleData.role === "supervisor") {
          return NextResponse.redirect(new URL('/admin', request.url));
        } else {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }
  }

  // Default redirect to home
  return NextResponse.redirect(new URL('/', request.url));
}
