
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Activity, Eye, RefreshCw } from 'lucide-react';
import { securityMonitor, SecurityThreat } from '@/utils/securityMonitor';
import { auditLogger } from '@/utils/auditLogger';

const SecurityDashboard = () => {
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const recentThreats = securityMonitor.getRecentThreats(24);
      setThreats(recentThreats);
      
      await auditLogger.logUserAction(
        'security_dashboard_viewed',
        'Security dashboard accessed',
        'security'
      );
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
  };

  const getThreatStats = () => {
    const stats = {
      total: threats.length,
      critical: threats.filter(t => t.severity === 'critical').length,
      high: threats.filter(t => t.severity === 'high').length,
      medium: threats.filter(t => t.severity === 'medium').length,
      low: threats.filter(t => t.severity === 'low').length,
    };
    return stats;
  };

  const getThreatsByType = () => {
    const types = ['brute_force', 'injection', 'xss', 'csrf', 'privilege_escalation', 'suspicious_activity'];
    return types.map(type => ({
      type,
      count: threats.filter(t => t.type === type).length,
      threats: threats.filter(t => t.type === type),
    }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'brute_force': return '🔓';
      case 'injection': return '💉';
      case 'xss': return '📜';
      case 'csrf': return '🔗';
      case 'privilege_escalation': return '⬆️';
      case 'suspicious_activity': return '👀';
      default: return '⚠️';
    }
  };

  const stats = getThreatStats();
  const threatsByType = getThreatsByType();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Dashboard
          </h2>
          <p className="text-muted-foreground">Monitor and analyze security threats</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
            <p className="text-xs text-muted-foreground">Needs prompt review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
            <p className="text-xs text-muted-foreground">Monitor closely</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Low</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
            <p className="text-xs text-muted-foreground">Informational</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {stats.critical > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical Security Alert:</strong> {stats.critical} critical threat{stats.critical > 1 ? 's' : ''} detected in the last 24 hours. 
            Immediate action required.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="threats" className="w-full">
        <TabsList>
          <TabsTrigger value="threats">Recent Threats</TabsTrigger>
          <TabsTrigger value="types">Threat Types</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Threats</CardTitle>
              <CardDescription>
                Latest security incidents and threats detected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {threats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No security threats detected in the last 24 hours
                </p>
              ) : (
                <div className="space-y-3">
                  {threats.slice(0, 10).map((threat) => (
                    <div
                      key={threat.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{getTypeIcon(threat.type)}</span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSeverityColor(threat.severity)}>
                              {threat.severity}
                            </Badge>
                            <span className="text-sm font-medium capitalize">
                              {threat.type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {threat.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {threat.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {threatsByType.map((typeData) => (
              <Card key={typeData.type}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span>{getTypeIcon(typeData.type)}</span>
                    {typeData.type.replace('_', ' ').toUpperCase()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{typeData.count}</div>
                  {typeData.threats.length > 0 && (
                    <div className="space-y-1">
                      {typeData.threats.slice(0, 3).map((threat) => (
                        <div key={threat.id} className="text-xs">
                          <Badge className={getSeverityColor(threat.severity)} variant="outline">
                            {threat.severity}
                          </Badge>
                          <span className="ml-2 text-muted-foreground">
                            {threat.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Analytics</CardTitle>
              <CardDescription>
                Threat trends and patterns analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Advanced analytics features coming soon
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;
