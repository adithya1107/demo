
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import { SessionManager } from '@/utils/sessionSecurity';
import { useNavigate } from 'react-router-dom';

const SessionTimeout: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const navigate = useNavigate();

  useEffect(() => {
    const sessionManager = SessionManager.getInstance();
    
    const handleWarning = () => {
      setShowWarning(true);
      setCountdown(300);
    };

    const handleTimeout = () => {
      setShowWarning(false);
      navigate('/', { replace: true });
    };

    sessionManager.startSession(handleWarning, handleTimeout);

    return () => {
      sessionManager.endSession();
    };
  }, [navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (showWarning && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      // Session expired
      setShowWarning(false);
      navigate('/', { replace: true });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showWarning, countdown, navigate]);

  const handleExtendSession = () => {
    const sessionManager = SessionManager.getInstance();
    sessionManager.extendSession();
    setShowWarning(false);
    setCountdown(300);
  };

  const handleSignOut = () => {
    const sessionManager = SessionManager.getInstance();
    sessionManager.endSession();
    setShowWarning(false);
    navigate('/', { replace: true });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Session Expiring Soon
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-lg font-semibold">
            <Clock className="h-5 w-5 text-red-500" />
            <span className="text-red-500">{formatTime(countdown)}</span>
          </div>
          
          <p className="text-muted-foreground">
            Your session will expire soon due to inactivity. Would you like to extend your session?
          </p>
          
          <div className="flex gap-2 justify-center">
            <Button onClick={handleExtendSession} className="flex-1">
              Extend Session
            </Button>
            <Button onClick={handleSignOut} variant="outline" className="flex-1">
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionTimeout;
