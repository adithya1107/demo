
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { BookOpen, Play, CheckCircle, Clock, FileText, Quiz } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LearningModule {
  id: string;
  course_id: string;
  module_name: string;
  description: string;
  sequence_order: number;
  module_type: string;
  content_url: string;
  duration_minutes: number;
  is_published: boolean;
  courses: {
    course_name: string;
    course_code: string;
  };
}

interface StudentProgress {
  id: string;
  module_id: string;
  completion_percentage: number;
  time_spent_minutes: number;
  is_completed: boolean;
  last_accessed_at: string;
}

interface Quiz {
  id: string;
  module_id: string;
  quiz_name: string;
  description: string;
  time_limit_minutes: number;
  attempts_allowed: number;
  pass_percentage: number;
  is_active: boolean;
}

const LearningManagementSystem: React.FC = () => {
  const { profile } = useUserProfile();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchLearningModules();
      fetchStudentProgress();
      fetchQuizzes();
    }
  }, [profile?.id]);

  const fetchLearningModules = async () => {
    try {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', profile?.id);

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = enrollments.map(e => e.course_id);

      const { data, error } = await supabase
        .from('learning_modules')
        .select(`
          *,
          courses (
            course_name,
            course_code
          )
        `)
        .in('course_id', courseIds)
        .eq('is_published', true)
        .order('sequence_order');

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching learning modules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch learning modules',
        variant: 'destructive'
      });
    }
  };

  const fetchStudentProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', profile?.id);

      if (error) throw error;
      setProgress(data || []);
    } catch (error) {
      console.error('Error fetching student progress:', error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleProgress = (moduleId: string): StudentProgress | null => {
    return progress.find(p => p.module_id === moduleId) || null;
  };

  const getModuleQuiz = (moduleId: string): Quiz | null => {
    return quizzes.find(q => q.module_id === moduleId) || null;
  };

  const startModule = async (module: LearningModule) => {
    try {
      const existingProgress = getModuleProgress(module.id);
      
      if (!existingProgress) {
        const { error } = await supabase
          .from('student_progress')
          .insert({
            student_id: profile?.id,
            module_id: module.id,
            completion_percentage: 0,
            time_spent_minutes: 0,
            last_accessed_at: new Date().toISOString()
          });

        if (error) throw error;
        await fetchStudentProgress();
      } else {
        const { error } = await supabase
          .from('student_progress')
          .update({
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
      }

      setSelectedModule(module);
      toast({
        title: 'Module Started',
        description: `Started learning ${module.module_name}`,
      });
    } catch (error) {
      console.error('Error starting module:', error);
      toast({
        title: 'Error',
        description: 'Failed to start module',
        variant: 'destructive'
      });
    }
  };

  const completeModule = async (moduleId: string) => {
    try {
      const existingProgress = getModuleProgress(moduleId);
      
      if (existingProgress) {
        const { error } = await supabase
          .from('student_progress')
          .update({
            completion_percentage: 100,
            is_completed: true,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
        await fetchStudentProgress();
        
        toast({
          title: 'Module Completed',
          description: 'Congratulations! You have completed this module.',
        });
      }
    } catch (error) {
      console.error('Error completing module:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark module as complete',
        variant: 'destructive'
      });
    }
  };

  const getModuleIcon = (moduleType: string) => {
    switch (moduleType) {
      case 'quiz':
        return <Quiz className="h-5 w-5" />;
      case 'assignment':
        return <FileText className="h-5 w-5" />;
      case 'discussion':
        return <BookOpen className="h-5 w-5" />;
      default:
        return <Play className="h-5 w-5" />;
    }
  };

  const getModuleTypeColor = (moduleType: string) => {
    switch (moduleType) {
      case 'quiz':
        return 'bg-purple-100 text-purple-800';
      case 'assignment':
        return 'bg-blue-100 text-blue-800';
      case 'discussion':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading learning modules...</div>;
  }

  // Group modules by course
  const modulesByCourse = modules.reduce((acc, module) => {
    const courseKey = `${module.courses.course_code} - ${module.courses.course_name}`;
    if (!acc[courseKey]) {
      acc[courseKey] = [];
    }
    acc[courseKey].push(module);
    return acc;
  }, {} as Record<string, LearningModule[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Learning Management System</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Total Modules: {modules.length}
          </div>
          <div className="text-sm text-muted-foreground">
            Completed: {progress.filter(p => p.is_completed).length}
          </div>
        </div>
      </div>

      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="modules">All Modules</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-6">
          {Object.keys(modulesByCourse).length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">No learning modules available</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(modulesByCourse).map(([courseName, courseModules]) => (
              <Card key={courseName}>
                <CardHeader>
                  <CardTitle className="text-lg">{courseName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseModules.map((module) => {
                      const moduleProgress = getModuleProgress(module.id);
                      const moduleQuiz = getModuleQuiz(module.id);
                      
                      return (
                        <div key={module.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {getModuleIcon(module.module_type)}
                              <div>
                                <h4 className="font-medium">{module.module_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {module.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getModuleTypeColor(module.module_type)}>
                                {module.module_type}
                              </Badge>
                              {moduleProgress?.is_completed && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                          </div>
                          
                          {moduleProgress && (
                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{moduleProgress.completion_percentage}%</span>
                              </div>
                              <Progress value={moduleProgress.completion_percentage} />
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{module.duration_minutes} min</span>
                              </div>
                              {moduleProgress && (
                                <div>
                                  Time spent: {moduleProgress.time_spent_minutes} min
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {moduleQuiz && (
                                <Button variant="outline" size="sm">
                                  Take Quiz
                                </Button>
                              )}
                              {moduleProgress?.is_completed ? (
                                <Button variant="outline" size="sm" disabled>
                                  Completed
                                </Button>
                              ) : (
                                <Button size="sm" onClick={() => startModule(module)}>
                                  {moduleProgress ? 'Continue' : 'Start'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {progress.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No progress recorded yet. Start learning!
                </p>
              ) : (
                <div className="space-y-4">
                  {progress.map((prog) => {
                    const module = modules.find(m => m.id === prog.module_id);
                    if (!module) return null;
                    
                    return (
                      <div key={prog.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{module.module_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {module.courses.course_name}
                            </p>
                          </div>
                          {prog.is_completed && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{prog.completion_percentage}%</span>
                          </div>
                          <Progress value={prog.completion_percentage} />
                          
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Time spent: {prog.time_spent_minutes} minutes</span>
                            <span>
                              Last accessed: {new Date(prog.last_accessed_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {!prog.is_completed && (
                          <div className="mt-3 flex justify-end">
                            <Button size="sm" onClick={() => completeModule(prog.module_id)}>
                              Mark as Complete
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              {quizzes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No quizzes available yet
                </p>
              ) : (
                <div className="space-y-4">
                  {quizzes.map((quiz) => {
                    const module = modules.find(m => m.id === quiz.module_id);
                    if (!module) return null;
                    
                    return (
                      <div key={quiz.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{quiz.quiz_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {quiz.description}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Module: {module.module_name}
                            </p>
                          </div>
                          <Badge variant="outline">
                            <Quiz className="h-4 w-4 mr-1" />
                            Quiz
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{quiz.time_limit_minutes} min</span>
                            </div>
                            <span>Attempts: {quiz.attempts_allowed}</span>
                            <span>Pass: {quiz.pass_percentage}%</span>
                          </div>
                          
                          <Button size="sm">
                            Take Quiz
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearningManagementSystem;
