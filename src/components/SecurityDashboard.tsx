
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Activity, Clock } from 'lucide-react';
import { securityMonitor, SecurityThreat } from '@/utils/securityMonitor';

const SecurityDashboard = () => {
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [metrics, setMetrics] = useState({
    totalThreats: 0,
    blockedThreats: 0,
    criticalThreats: 0,
    lastThreatTime: undefined as Date | undefined
  });

  const refreshData = () => {
    const recentThreats = securityMonitor.getRecentThreats(20);
    const currentMetrics = securityMonitor.getMetrics();
    
    setThreats(recentThreats);
    setMetrics(currentMetrics);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'brute_force': return <Shield className="h-4 w-4" />;
      case 'xss_attempt': return <AlertTriangle className="h-4 w-4" />;
      case 'sql_injection': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
        <Button onClick={refreshData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalThreats}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.blockedThreats}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.criticalThreats}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Threat</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {metrics.lastThreatTime 
                ? metrics.lastThreatTime.toLocaleTimeString()
                : 'None'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Threats */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Threats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {threats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-16 w-16 mx-auto mb-4" />
                <p>No security threats detected</p>
              </div>
            ) : (
              threats.map((threat) => (
                <div key={threat.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getTypeIcon(threat.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(threat.severity)}>
                        {threat.severity}
                      </Badge>
                      <span className="font-medium">{threat.type.replace('_', ' ')}</span>
                      {threat.blocked && (
                        <Badge variant="outline" className="text-green-600">
                          Blocked
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {threat.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                      <span>{threat.timestamp.toLocaleString()}</span>
                      {threat.ipAddress && <span>IP: {threat.ipAddress}</span>}
                      {threat.userId && <span>User: {threat.userId}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
