
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Brain,
  Lightbulb,
  Award
} from 'lucide-react';

interface PersonalizedInsightsProps {
  userType: string;
  insights: any[];
  profile: any;
}

const PersonalizedInsights = ({ userType, insights, profile }: PersonalizedInsightsProps) => {
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  useEffect(() => {
    generatePersonalizedInsights();
  }, [userType, profile]);

  const generatePersonalizedInsights = () => {
    // AI-powered insights based on user type and behavior
    const insightsByType = {
      student: [
        {
          type: 'performance',
          title: 'Study Pattern Analysis',
          description: 'Your peak performance hours are between 9-11 AM. Consider scheduling important study sessions during this time.',
          icon: Brain,
          color: 'bg-blue-50 text-blue-600',
          priority: 'medium',
          actionable: true,
          action: 'Optimize your study schedule'
        },
        {
          type: 'attendance',
          title: 'Attendance Trend',
          description: 'Your attendance has improved by 15% this month. Keep up the good work!',
          icon: TrendingUp,
          color: 'bg-green-50 text-green-600',
          priority: 'low',
          actionable: false
        },
        {
          type: 'academic',
          title: 'Subject Recommendation',
          description: 'Based on your performance, you might excel in Advanced Data Structures next semester.',
          icon: Lightbulb,
          color: 'bg-purple-50 text-purple-600',
          priority: 'high',
          actionable: true,
          action: 'Explore course prerequisites'
        }
      ],
      faculty: [
        {
          type: 'teaching',
          title: 'Class Engagement',
          description: 'Students are most engaged during your interactive sessions. Consider adding more group activities.',
          icon: Target,
          color: 'bg-blue-50 text-blue-600',
          priority: 'medium',
          actionable: true,
          action: 'Plan interactive sessions'
        },
        {
          type: 'grading',
          title: 'Grading Efficiency',
          description: 'You complete grading 30% faster than average. Your feedback quality is highly rated.',
          icon: Award,
          color: 'bg-green-50 text-green-600',
          priority: 'low',
          actionable: false
        },
        {
          type: 'workload',
          title: 'Workload Alert',
          description: 'You have 23 pending assignments to grade. Consider setting a grading schedule.',
          icon: AlertTriangle,
          color: 'bg-yellow-50 text-yellow-600',
          priority: 'high',
          actionable: true,
          action: 'Review grading queue'
        }
      ],
      admin: [
        {
          type: 'system',
          title: 'System Performance',
          description: 'User engagement is up 25% this month. The new features are being well-received.',
          icon: TrendingUp,
          color: 'bg-green-50 text-green-600',
          priority: 'low',
          actionable: false
        },
        {
          type: 'analytics',
          title: 'Usage Pattern',
          description: 'Peak usage occurs between 10 AM - 2 PM. Consider scheduling maintenance outside these hours.',
          icon: Brain,
          color: 'bg-blue-50 text-blue-600',
          priority: 'medium',
          actionable: true,
          action: 'Schedule maintenance'
        },
        {
          type: 'security',
          title: 'Security Alert',
          description: 'No security incidents this month. All systems are operating normally.',
          icon: CheckCircle,
          color: 'bg-green-50 text-green-600',
          priority: 'low',
          actionable: false
        }
      ],
      parent: [
        {
          type: 'child_performance',
          title: 'Academic Progress',
          description: 'Your child\'s grades have improved by 12% this semester. Mathematics shows the most improvement.',
          icon: TrendingUp,
          color: 'bg-green-50 text-green-600',
          priority: 'low',
          actionable: false
        },
        {
          type: 'attendance',
          title: 'Attendance Insight',
          description: 'Consistent attendance is contributing to better academic performance.',
          icon: CheckCircle,
          color: 'bg-blue-50 text-blue-600',
          priority: 'low',
          actionable: false
        }
      ]
    };

    setAiInsights(insightsByType[userType as keyof typeof insightsByType] || []);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>AI-Powered Insights</span>
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your activity and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${insight.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{insight.title}</h4>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(insight.priority)}>
                      {insight.priority}
                    </Badge>
                  </div>
                  
                  {insight.actionable && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-gray-500">Suggested Action:</span>
                      <span className="text-sm font-medium text-blue-600">
                        {insight.action}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Your progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userType === 'student' && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Performance</span>
                    <span className="text-sm text-gray-600">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Attendance Rate</span>
                    <span className="text-sm text-gray-600">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </>
            )}
            
            {userType === 'faculty' && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Student Satisfaction</span>
                    <span className="text-sm text-gray-600">4.7/5</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Grading Efficiency</span>
                    <span className="text-sm text-gray-600">90%</span>
                  </div>
                  <Progress value={90} className="h-2" />
                </div>
              </>
            )}
            
            {userType === 'admin' && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Uptime</span>
                    <span className="text-sm text-gray-600">99.9%</span>
                  </div>
                  <Progress value={99.9} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">User Satisfaction</span>
                    <span className="text-sm text-gray-600">88%</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalizedInsights;
