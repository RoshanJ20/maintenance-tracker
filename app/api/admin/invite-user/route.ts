import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, name, role } = await request.json();

    console.log('Invite user request:', { email, name, role });

    // Validate input
    if (!email || !name || !role) {
      console.error('Validation failed: missing fields');
      return NextResponse.json(
        { error: 'Email, name, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'maintainer'].includes(role)) {
      console.error('Validation failed: invalid role:', role);
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or maintainer' },
        { status: 400 }
      );
    }

    // TODO: Verify the requesting user is an admin
    // For now, we'll trust the request (add auth check in production)

    console.log('Calling supabaseAdmin.auth.admin.inviteUserByEmail...');
    
    // Step 1: Invite user via Supabase Auth (sends email automatically!)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          name,
          role
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    );

    if (authError) {
      console.error('Auth invite error:', authError);
      console.error('Auth error details:', JSON.stringify(authError, null, 2));
      return NextResponse.json(
        { error: authError.message || 'Failed to invite user' },
        { status: 400 }
      );
    }

    console.log('Auth invitation successful, user ID:', authData.user.id);

    // Step 2: Insert user metadata into users table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      // If DB insert fails, we should ideally delete the auth user
      // but for now, just return the error
      return NextResponse.json(
        { error: `User invited but failed to save metadata: ${dbError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        name,
        role
      },
      message: `Invitation sent to ${email}`
    });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
