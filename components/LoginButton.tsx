"use client";

import { signInWithGoogle } from "@/lib/supabaseAuth";

export default function LoginButton() {
  return (
    <button
      onClick={() => signInWithGoogle()}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Login with Google
    </button>
  );
}
