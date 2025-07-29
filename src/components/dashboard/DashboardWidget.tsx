
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardWidgetProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}

const DashboardWidget = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  trendDirection = 'neutral' 
}: DashboardWidgetProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {trend && (
              <div className="flex items-center mt-1">
                {trendDirection === 'up' && <TrendingUp className="w-3 h-3 text-green-600 mr-1" />}
                {trendDirection === 'down' && <TrendingDown className="w-3 h-3 text-red-600 mr-1" />}
                <p className="text-xs text-muted-foreground">{trend}</p>
              </div>
            )}
          </div>
          <div className="ml-4">
            <Icon className={`h-8 w-8 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardWidget;
