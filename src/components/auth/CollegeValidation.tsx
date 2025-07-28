
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { sanitizeInput } from '@/utils/security';

interface CollegeValidationProps {
  onValidated: (collegeData: any) => void;
}

export const CollegeValidation: React.FC<CollegeValidationProps> = ({ onValidated }) => {
  const [collegeCode, setCollegeCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateCollege = async () => {
    if (!collegeCode.trim()) {
      toast({
        title: 'Error',
        description: 'College code is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const sanitizedCode = sanitizeInput(collegeCode.trim().toUpperCase());
      
      const { data, error } = await supabase.rpc('validate_college_code', {
        college_code: sanitizedCode
      });

      if (error) throw error;

      if (data && data.length > 0 && data[0].is_valid) {
        onValidated(data[0]);
      } else {
        toast({
          title: 'Invalid College Code',
          description: 'Please enter a valid college code',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('College validation error:', error);
      toast({
        title: 'Validation Error',
        description: 'Failed to validate college code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateCollege();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Enter College Code</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="collegeCode" className="block text-sm font-medium mb-2">
              College Code
            </label>
            <Input
              id="collegeCode"
              type="text"
              value={collegeCode}
              onChange={(e) => setCollegeCode(e.target.value)}
              placeholder="Enter your college code"
              className="uppercase"
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading || !collegeCode.trim()} className="w-full">
            {loading ? 'Validating...' : 'Validate College'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
