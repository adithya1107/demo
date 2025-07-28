
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Award, QrCode, Download, Star, Trophy, Calendar } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from '@/components/ui/use-toast';

interface BlockchainBadge {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'leadership' | 'volunteer' | 'achievement';
  issued_date: string;
  issuer: string;
  blockchain_hash: string;
  verification_url: string;
  metadata: any;
}

const BlockchainCredentials = () => {
  const { profile } = useUserProfile();
  const [badges, setBadges] = useState<BlockchainBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BlockchainBadge | null>(null);

  useEffect(() => {
    loadUserBadges();
  }, [profile]);

  const loadUserBadges = async () => {
    // Mock data for demonstration
    const mockBadges: BlockchainBadge[] = [
      {
        id: '1',
        title: 'Academic Excellence',
        description: 'Achieved top 10% in semester examinations',
        category: 'academic',
        issued_date: '2024-01-15',
        issuer: 'XYZ University',
        blockchain_hash: '0x1234567890abcdef',
        verification_url: 'https://blockchain.verify/badge/1',
        metadata: { grade: 'A+', semester: 'Fall 2023' }
      },
      {
        id: '2',
        title: 'Hackathon Winner',
        description: 'First place in inter-college hackathon',
        category: 'achievement',
        issued_date: '2024-02-20',
        issuer: 'TechFest Committee',
        blockchain_hash: '0xabcdef1234567890',
        verification_url: 'https://blockchain.verify/badge/2',
        metadata: { event: 'CodeFest 2024', position: '1st' }
      },
      {
        id: '3',
        title: 'Community Service',
        description: 'Completed 50+ hours of community service',
        category: 'volunteer',
        issued_date: '2024-03-10',
        issuer: 'Social Service Club',
        blockchain_hash: '0x567890abcdef1234',
        verification_url: 'https://blockchain.verify/badge/3',
        metadata: { hours: 52, activities: ['Teaching', 'Cleanup'] }
      }
    ];

    setBadges(mockBadges);
    setLoading(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return <Award className="h-5 w-5" />;
      case 'leadership': return <Star className="h-5 w-5" />;
      case 'volunteer': return <Trophy className="h-5 w-5" />;
      case 'achievement': return <Trophy className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'bg-blue-500';
      case 'leadership': return 'bg-purple-500';
      case 'volunteer': return 'bg-green-500';
      case 'achievement': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const generateQRCode = (badge: BlockchainBadge) => {
    // Mock QR code generation
    const qrData = {
      badgeId: badge.id,
      hash: badge.blockchain_hash,
      verificationUrl: badge.verification_url
    };
    
    return `QR:${JSON.stringify(qrData)}`;
  };

  const downloadCertificate = (badge: BlockchainBadge) => {
    toast({
      title: 'Download Started',
      description: `Downloading certificate for ${badge.title}`,
    });
    // Mock download functionality
  };

  const verifyOnBlockchain = (badge: BlockchainBadge) => {
    window.open(badge.verification_url, '_blank');
  };

  const BadgeCard = ({ badge }: { badge: BlockchainBadge }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedBadge(badge)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-full ${getCategoryColor(badge.category)} text-white`}>
              {getCategoryIcon(badge.category)}
            </div>
            <div>
              <CardTitle className="text-lg">{badge.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{badge.issuer}</p>
            </div>
          </div>
          <Badge variant="outline">{badge.category}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-3">{badge.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(badge.issued_date).toLocaleDateString()}</span>
          </span>
          <span className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>Verified</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );

  const BadgeDetailDialog = () => {
    if (!selectedBadge) return null;

    return (
      <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadge(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className={`p-2 rounded-full ${getCategoryColor(selectedBadge.category)} text-white`}>
                {getCategoryIcon(selectedBadge.category)}
              </div>
              <span>{selectedBadge.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-muted-foreground">{selectedBadge.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Issued By</h4>
                <p className="text-muted-foreground">{selectedBadge.issuer}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Issue Date</h4>
                <p className="text-muted-foreground">{new Date(selectedBadge.issued_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Blockchain Verification</h4>
              <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                {selectedBadge.blockchain_hash}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">QR Code for Verification</h4>
              <div className="bg-white p-4 border rounded text-center">
                <QrCode className="h-16 w-16 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Scan to verify credential</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button onClick={() => verifyOnBlockchain(selectedBadge)} className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Verify on Blockchain</span>
              </Button>
              <Button variant="outline" onClick={() => downloadCertificate(selectedBadge)} className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Download Certificate</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Blockchain Credentials</h1>
          <p className="text-muted-foreground">Your verified digital badges and certificates</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>Blockchain Verified</span>
          </Badge>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Badges</p>
                <p className="text-2xl font-bold">{badges.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold">{badges.filter(b => b.category === 'achievement').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Leadership</p>
                <p className="text-2xl font-bold">{badges.filter(b => b.category === 'leadership').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">{badges.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Badges</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="leadership">Leadership</TabsTrigger>
          <TabsTrigger value="volunteer">Volunteer</TabsTrigger>
          <TabsTrigger value="achievement">Achievement</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map(badge => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          )}
        </TabsContent>

        {['academic', 'leadership', 'volunteer', 'achievement'].map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.filter(badge => badge.category === category).map(badge => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <BadgeDetailDialog />
    </div>
  );
};

export default BlockchainCredentials;
