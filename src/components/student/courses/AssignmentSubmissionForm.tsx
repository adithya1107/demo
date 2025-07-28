
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiGateway } from '@/utils/apiGateway';
import { useUserProfile } from '@/hooks/useUserProfile';

interface AssignmentSubmissionFormProps {
  assignment: {
    id: string;
    title: string;
    description: string;
    max_marks: number;
    due_date: string;
  };
  onSubmit: () => void;
}

const AssignmentSubmissionForm: React.FC<AssignmentSubmissionFormProps> = ({ 
  assignment, 
  onSubmit 
}) => {
  const [submissionText, setSubmissionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useUserProfile();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your submission text',
        variant: 'destructive'
      });
      return;
    }

    if (!profile?.id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiGateway.insert('assignment_submissions', {
        assignment_id: assignment.id,
        student_id: profile.id,
        submission_text: submissionText,
        submitted_at: new Date().toISOString()
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Assignment submitted successfully!',
        });
        setSubmissionText('');
        onSubmit();
      } else {
        throw new Error(response.error || 'Failed to submit assignment');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit assignment. Please try again.',
        variant: 'destructive'
      });
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
