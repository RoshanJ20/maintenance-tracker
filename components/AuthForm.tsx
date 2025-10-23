"use client";

import { useState } from "react";
import { signUpWithEmail, signInWithEmail, resendConfirmation } from "@/lib/supabaseAuth";

type AuthMode = 'signin' | 'signup' | 'confirmation';

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await signUpWithEmail(email, password);
      setMessage("Check your email for a confirmation link!");
      setMode('confirmation');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      // User will be redirected by AuthContext
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setError("");
    setLoading(true);

    try {
      await resendConfirmation(email);
      setMessage("Confirmation email sent!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'confirmation') {
    return (
      <div className="max-w-md mx-auto p-6 border rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">Check Your Email</h2>
        <p className="text-gray-600 mb-4 text-center">
          We sent a confirmation link to <strong>{email}</strong>
        </p>
        {message && <p className="text-green-600 mb-4 text-center">{message}</p>}
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
        <button
          onClick={handleResendConfirmation}
          disabled={loading}
          className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50 mb-4"
        >
          {loading ? "Sending..." : "Resend Confirmation Email"}
        </button>
        <button
          onClick={() => setMode('signin')}
          className="w-full text-blue-600 underline"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {mode === 'signin' ? 'Sign In' : 'Create Account'}
      </h2>

      <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {mode === 'signup' && (
          <div className="mb-4">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {mode === 'signin' && (
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="rememberMe" className="text-sm text-gray-600">
              Keep me signed in
            </label>
          </div>
        )}

        {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? "Loading..." : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          className="text-blue-600 underline text-sm"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError("");
            setMessage("");
          }}
        >
          {mode === 'signin' 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Sign in"
          }
        </button>
      </div>
    </div>
  );
}
