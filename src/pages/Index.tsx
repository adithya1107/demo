import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import MultiStepLogin from '@/components/MultiStepLogin';
import SessionTimeout from '@/components/SessionTimeout';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const { session, loading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Session timeout for authenticated users */}
      {isAuthenticated && session && (
        <SessionTimeout 
          sessionId={session.access_token}
          onLogout={() => {
            // SessionTimeout will handle the logout through useAuth
            console.log('Session timeout triggered');
          }}
        />
      )}
      
      {/* Industrial Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-20">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5 text-foreground" /> : <Moon className="h-5 w-5 text-foreground" />}
        </Button>
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md mx-auto">
          <MultiStepLogin />
        </div>
      </div>
    </div>
  );
};

export default Index;