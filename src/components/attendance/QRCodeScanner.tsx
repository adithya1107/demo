
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scan, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface QRCodeScannerProps {
  onSuccess: (qrCode: string) => void;
  activeSessions: any[];
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onSuccess, activeSessions }) => {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);

  const markAttendance = async () => {
    if (!qrCode.trim()) {
      toast({
        title: 'Missing QR Code',
        description: 'Please enter or scan a QR code',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Call the parent's success handler
      await onSuccess(qrCode);
      setQrCode('');
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateQRScan = () => {
    // Use a QR code from active sessions if available
    if (activeSessions.length > 0) {
      const randomSession = activeSessions[Math.floor(Math.random() * activeSessions.length)];
      setQrCode(randomSession.qr_code);
    } else {
      // For demo purposes, use a mock QR code
      const mockQR = 'ATTEND_123456';
      setQrCode(mockQR);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Scan className="h-5 w-5" />
            <span>Scan QR Code</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="qrCode">QR Code</Label>
            <Input
              id="qrCode"
              placeholder="Enter QR code or scan using camera"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
            />
          </div>

          <div className="flex space-x-4">
            <Button onClick={markAttendance} disabled={loading || !qrCode.trim()}>
              {loading ? 'Marking...' : 'Mark Attendance'}
            </Button>
            <Button variant="outline" onClick={simulateQRScan}>
              Simulate Scan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Ask your instructor to generate a QR code for the class</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Scan the QR code or enter it manually</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Your attendance will be marked automatically</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeScanner;
