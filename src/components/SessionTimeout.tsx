
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertTriangle } from 'lucide-react';
import { sessionManager } from '@/utils/sessionSecurity';

interface SessionTimeoutProps {
  sessionId?: string;
  onExtend?: () => void;
  onLogout?: () => void;
}

const SessionTimeout: React.FC<SessionTimeoutProps> = ({ 
  sessionId, 
  onExtend, 
  onLogout 
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const checkSession = () => {
      const timeUntilExpiry = sessionManager.getTimeUntilExpiry(sessionId);
      const shouldWarn = sessionManager.shouldShowWarning(sessionId);
      
      setTimeLeft(timeUntilExpiry);
      setShowWarning(shouldWarn);

      if (timeUntilExpiry <= 0) {
        setIsActive(false);
        handleLogout();
      }
    };

    const interval = setInterval(checkSession, 1000);
    checkSession(); // Initial check

    return () => clearInterval(interval);
  }, [sessionId]);

  const handleExtend = () => {
    if (sessionId && sessionManager.extendSession(sessionId)) {
      setShowWarning(false);
      setIsActive(true);
      onExtend?.();
    }
  };

  const handleLogout = () => {
    if (sessionId) {
      sessionManager.invalidateSession(sessionId);
    }
    setShowWarning(false);
    setIsActive(false);
    onLogout?.();
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressValue = () => {
    const warningTime = 5 * 60 * 1000; // 5 minutes
    return ((warningTime - timeLeft) / warningTime) * 100;
  };

  if (!showWarning || !isActive) return null;

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span>Session Expiring Soon</span>
          </DialogTitle>
          <DialogDescription>
            Your session will expire in {formatTime(timeLeft)}. 
            Would you like to extend your session?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Time remaining: {formatTime(timeLeft)}
            </span>
          </div>

          <Progress value={getProgressValue()} className="w-full" />

          <div className="flex space-x-2">
            <Button 
              onClick={handleExtend} 
              className="flex-1"
              variant="default"
            >
              Extend Session
            </Button>
            <Button 
              onClick={handleLogout} 
              className="flex-1"
              variant="outline"
            >
              Logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionTimeout;
