import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Award } from 'lucide-react';
import AssignmentSubmissionForm, {
  AssignmentSubmissionFormProps,
} from './AssignmentSubmissionForm';

interface CourseDetailsDialogProps {
  course: any;
  isOpen: boolean;
  onClose: () => void;
  lectureMaterials: any[];
  assignments: any[];
  submissions: any[];
  grades: any[];
  certificates: any[];
  onSubmitAssignment: (
    assignmentId: string,
    text: string,
    fileUrl?: string
  ) => Promise<void>;
}

// Ensure AssignmentSubmissionFormProps includes matching onSubmit signature:
export interface FixedAssignmentSubmissionFormProps extends Omit<AssignmentSubmissionFormProps, 'onSubmit'> {
  onSubmit: (text: string, fileUrl?: string) => Promise<void>;
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
  onSubmitAssignment,
}) => {
  const [submitting, setSubmitting] = useState<Set<string>>(new Set());

  const getSubmissionStatus = (assignmentId: string) =>
    submissions.find((s) => s.assignment_id === assignmentId);

  const downloadCertificate = (url: string) => window.open(url, '_blank');

  const makeHandler =
    (assignmentId: string) =>
    async (text: string, fileUrl?: string): Promise<void> => {
      setSubmitting((prev) => new Set(prev).add(assignmentId));
      try {
        await onSubmitAssignment(assignmentId, text, fileUrl);
      } finally {
        setSubmitting((prev) => {
          const next = new Set(prev);
          next.delete(assignmentId);
          return next;
        });
      }
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

          {/* Lecture Materials */}
          <TabsContent value="materials" className="space-y-4">
            <h3 className="text-lg font-semibold">Lecture Materials</h3>
            {lectureMaterials.length === 0 ? (
              <p className="text-gray-500">No materials uploaded yet</p>
            ) : (
              <div className="space-y-3">
                {lectureMaterials.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{m.title}</h4>
                      <p className="text-sm text-gray-600">{m.description}</p>
                      <p className="text-xs text-gray-500">
                        Uploaded: {new Date(m.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => window.open(m.file_url, '_blank')}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments" className="space-y-4">
            <h3 className="text-lg font-semibold">Assignments</h3>
            {assignments.length === 0 ? (
              <p className="text-gray-500">No assignments yet</p>
            ) : (
              <div className="space-y-4">
                {assignments.map((a) => {
                  const sub = getSubmissionStatus(a.id);
                  const overdue = new Date(a.due_date) < new Date();
                  return (
                    <Card key={a.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{a.title}</h4>
                            <p className="text-sm text-gray-600">{a.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              Due: {new Date(a.due_date).toLocaleDateString()}
                            </p>
                            <Badge
                              variant={
                                sub
                                  ? 'default'
                                  : overdue
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {sub ? 'Submitted' : overdue ? 'Overdue' : 'Pending'}
                            </Badge>
                          </div>
                        </div>

                        {sub ? (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm text-green-800">
                              Submitted on:{' '}
                              {new Date(sub.submitted_at).toLocaleDateString()}
                            </p>
                            {sub.marks_obtained != null && (
                              <p className="text-sm text-green-800">
                                Grade: {sub.marks_obtained}/{a.max_marks}
                              </p>
                            )}
                          </div>
                        ) : !overdue ? (
                          <AssignmentSubmissionForm
                            assignment={a}
                            onSubmit={makeHandler(a.id)}
                            isSubmitting={submitting.has(a.id)}
                          />
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Grades */}
          <TabsContent value="grades" className="space-y-4">
            <h3 className="text-lg font-semibold">Grades</h3>
            {grades.length === 0 ? (
              <p className="text-gray-500">No grades recorded yet</p>
            ) : (
              <div className="space-y-3">
                {grades.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium capitalize">{g.grade_type}</h4>
                      <p className="text-sm text-gray-600">
                        Recorded: {new Date(g.recorded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {g.marks_obtained}/{g.max_marks}
                      </p>
                      <p className="text-sm text-gray-600">
                        {Math.round((g.marks_obtained / g.max_marks) * 100)}%
                      </p>
                      {g.grade_letter && (
                        <Badge variant="outline">{g.grade_letter}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Certificates */}
          <TabsContent value="certificates" className="space-y-4">
            <h3 className="text-lg font-semibold">Certificates</h3>
            {certificates.length === 0 ? (
              <p className="text-gray-500">No certificates available yet</p>
            ) : (
              <div className="space-y-3">
                {certificates.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Award className="h-8 w-8 text-yellow-500" />
                      <div>
                        <h4 className="font-medium">
                          {c.certificate_type} Certificate
                        </h4>
                        <p className="text-sm text-gray-600">
                          Issued:{' '}
                          {new Date(c.issued_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => downloadCertificate(c.certificate_url)}>
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
