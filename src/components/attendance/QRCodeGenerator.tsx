
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, RefreshCw, Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  sessionId?: string;
  courseId: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ sessionId, courseId }) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      // Generate QR code data
      const qrData = {
        sessionId,
        courseId,
        timestamp: Date.now(),
        type: 'attendance'
      };
      
      const qrString = JSON.stringify(qrData);
      // In a real implementation, you would use a QR code library here
      setQrCode(qrString);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateQRCode();
  }, [sessionId, courseId]);

  const handleDownload = () => {
    // Implementation for downloading QR code
    console.log('Downloading QR code...');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Attendance QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center p-8 bg-white border-2 border-dashed border-gray-300 rounded-lg">
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          ) : (
            <div className="text-center">
              <QrCode className="h-24 w-24 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">QR Code Generated</p>
              <p className="text-xs text-gray-500 mt-1 break-all">{qrCode}</p>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={generateQRCode} 
            variant="outline" 
            className="flex-1"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          <Button 
            onClick={handleDownload}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;
