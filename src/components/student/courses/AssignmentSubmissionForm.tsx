
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface AssignmentSubmissionFormProps {
  assignment: {
    id: string;
    title: string;
    description: string;
    max_marks: number;
    due_date: string;
  };
  onSubmit: (assignmentId: string, text: string, fileUrl?: string) => Promise<void>;
}

const AssignmentSubmissionForm: React.FC<AssignmentSubmissionFormProps> = ({ 
  assignment, 
  onSubmit 
}) => {
  const [submissionText, setSubmissionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(assignment.id, submissionText);
      setSubmissionText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 border-t pt-3">
      <Textarea
        placeholder="Enter your submission..."
        value={submissionText}
        onChange={(e) => setSubmissionText(e.target.value)}
        rows={3}
      />
      <Button 
        onClick={handleSubmit}
        disabled={!submissionText.trim() || isSubmitting}
        size="sm"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
      </Button>
    </div>
  );
};

export default AssignmentSubmissionForm;
