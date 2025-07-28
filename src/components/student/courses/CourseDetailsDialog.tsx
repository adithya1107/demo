import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export interface AssignmentSubmissionFormProps {
  assignmentId: string;
  onSubmit: (assignmentId: string, text: string, fileUrl?: string) => Promise<void>;
}

const AssignmentSubmissionForm: React.FC<AssignmentSubmissionFormProps> = ({
  assignmentId,
  onSubmit,
}) => {
  const [text, setText] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');

  const handleSubmit = async () => {
    if (!text && !fileUrl) {
      alert('Please enter some text or provide a file URL.');
      return;
    }
    try {
      await onSubmit(assignmentId, text, fileUrl || undefined);
      setText('');
      setFileUrl('');
    } catch (error) {
      console.error('Submission failed', error);
      alert('Failed to submit assignment.');
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter your submission text"
      />
      <Input
        value={fileUrl}
        onChange={(e) => setFileUrl(e.target.value)}
        placeholder="Or enter a file URL"
      />
      <Button onClick={handleSubmit}>Submit Assignment</Button>
    </div>
  );
};

export default AssignmentSubmissionForm;
