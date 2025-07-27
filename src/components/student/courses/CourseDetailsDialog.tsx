
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Award } from 'lucide-react';
import AssignmentSubmissionForm from './AssignmentSubmissionForm';

interface CourseDetailsDialogProps {
  course: any;
  isOpen: boolean;
  onClose: () => void;
  lectureMaterials: any[];
  assignments: any[];
  submissions: any[];
  grades: any[];
  certificates: any[];
  onSubmitAssignment: (assignmentId: string, text: string, fileUrl?: string) => Promise<void>;
}

const CourseDetailsDialog: React.FC<CourseDetailsDialogProps> = ({
  course,
  isOpen,
  onClose,
  lectureMaterials,
  assignments,
  submissions,
  grades,
  certificates,
  onSubmitAssignment
}) => {
  const getSubmissionStatus = (assignmentId: string) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  const downloadCertificate = (certificateUrl: string) => {
    window.open(certificateUrl, '_blank');
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{course.course_name}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="materials" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-4">
            <h3 className="text-lg font-semibold">Lecture Materials</h3>
            {lectureMaterials.length === 0 ? (
              <p className="text-gray-500">No materials uploaded yet</p>
            ) : (
              <div className="space-y-3">
                {lectureMaterials.map((material: any) => (
                  <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{material.title}</h4>
                      <p className="text-sm text-gray-600">{material.description}</p>
                      <p className="text-xs text-gray-500">
                        Uploaded: {new Date(material.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => window.open(material.file_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <h3 className="text-lg font-semibold">Assignments</h3>
            {assignments.length === 0 ? (
              <p className="text-gray-500">No assignments yet</p>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment: any) => {
                  const submission = getSubmissionStatus(assignment.id);
                  const isOverdue = new Date(assignment.due_date) < new Date();
                  
                  return (
                    <Card key={assignment.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{assignment.title}</h4>
                            <p className="text-sm text-gray-600">{assignment.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              Due: {new Date(assignment.due_date).toLocaleDateString()}
                            </p>
                            <Badge variant={
                              submission ? 'default' : 
                              isOverdue ? 'destructive' : 'secondary'
                            }>
                              {submission ? 'Submitted' : 
                               isOverdue ? 'Overdue' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                        
                        {submission ? (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm text-green-800">
                              Submitted on: {new Date(submission.submitted_at).toLocaleDateString()}
                            </p>
                            {submission.marks_obtained && (
                              <p className="text-sm text-green-800">
                                Grade: {submission.marks_obtained}/{assignment.max_marks}
                              </p>
                            )}
                          </div>
                        ) : !isOverdue && (
                          <AssignmentSubmissionForm 
                            assignment={assignment}
                            onSubmit={onSubmitAssignment}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="grades" className="space-y-4">
            <h3 className="text-lg font-semibold">Grades</h3>
            {grades.length === 0 ? (
              <p className="text-gray-500">No grades recorded yet</p>
            ) : (
              <div className="space-y-3">
                {grades.map((grade: any) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium capitalize">{grade.grade_type}</h4>
                      <p className="text-sm text-gray-600">
                        Recorded: {new Date(grade.recorded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {grade.marks_obtained}/{grade.max_marks}
                      </p>
                      <p className="text-sm text-gray-600">
                        {Math.round((grade.marks_obtained / grade.max_marks) * 100)}%
                      </p>
                      {grade.grade_letter && (
                        <Badge variant="outline">{grade.grade_letter}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="certificates" className="space-y-4">
            <h3 className="text-lg font-semibold">Certificates</h3>
            {certificates.length === 0 ? (
              <p className="text-gray-500">No certificates available yet</p>
            ) : (
              <div className="space-y-3">
                {certificates.map((certificate: any) => (
                  <div key={certificate.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Award className="h-8 w-8 text-yellow-500" />
                      <div>
                        <h4 className="font-medium">
                          {certificate.certificate_type} Certificate
                        </h4>
                        <p className="text-sm text-gray-600">
                          Issued: {new Date(certificate.issued_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => downloadCertificate(certificate.certificate_url)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailsDialog;
