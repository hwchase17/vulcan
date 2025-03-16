import { createSupabaseClient } from "@/lib/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { LangGraphLogoSVG } from "../icons/langgraph";

export function Login() {
  try {
    const { session, loading } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
      // If user is already logged in, redirect to home
      if (!loading && session?.access_token) {
        navigate('/', { replace: true });
      }
    }, [session, loading, navigate]);

    const handleLogin = async (provider: 'google') => {
      try {
        const supabase = createSupabaseClient();
        
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            skipBrowserRedirect: false,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
          },
        });

        if (error) {
          console.error('[Login] Login error:', error.message);
        }
      } catch (error) {
        console.error('[Login] Error creating Supabase client or signing in:', error);
      }
    };

    // Show loading state while checking session
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
            <p className="text-gray-600">Please wait while we verify your session.</p>
          </div>
        </div>
      );
    }

    // Don't show login page if already logged in
    if (session?.access_token) {
      return null;
    }

    return (
      <div className="flex flex-col gap-6 items-center justify-center min-h-screen max-w-md mx-auto px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <LangGraphLogoSVG className="h-12 w-12" />
            <h1 className="text-4xl font-bold">Vulcan</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Your intelligent AI assistant powered by LangGraph and Arcade. Vulcan helps you automate tasks through natural conversation with access to a wide range of tools.
          </p>
        </div>
        
        <button 
          onClick={() => handleLogin('google')} 
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>An error occurred while loading the login page.</p>
          <p className="mt-2 text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
} 