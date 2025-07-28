
-- First, let's ensure we have all the necessary tables and relationships for the core features
-- Add missing columns and tables for proper functionality

-- Add missing columns to user_profiles for better profile management
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}';

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_college_id ON user_profiles(college_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course_id ON attendance(course_id);

-- Create missing tables for notifications system
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    sender_id UUID,
    college_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'general',
    priority TEXT DEFAULT 'normal',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid());

-- Create system settings table for college customization
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type TEXT NOT NULL DEFAULT 'json',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(college_id, setting_key)
);

-- Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for system_settings
CREATE POLICY "Admins can manage system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar
            JOIN user_profiles up ON ar.user_id = up.id
            WHERE up.id = auth.uid() 
            AND ar.college_id = system_settings.college_id
            AND ar.is_active = true
        )
    );

-- Create grade_submissions table for proper grading system
CREATE TABLE IF NOT EXISTS grade_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    assignment_id UUID NOT NULL,
    course_id UUID NOT NULL,
    grade_value DECIMAL(5,2),
    grade_letter TEXT,
    graded_by UUID,
    graded_at TIMESTAMP WITH TIME ZONE,
    feedback TEXT,
    is_final BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(student_id, assignment_id)
);

-- Enable RLS on grade_submissions
ALTER TABLE grade_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for grade_submissions
CREATE POLICY "Students can view their own grades" ON grade_submissions
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Faculty can manage grades for their courses" ON grade_submissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses c
            WHERE c.id = grade_submissions.course_id 
            AND c.instructor_id = auth.uid()
        )
    );

-- Create fee_transactions table for financial management
CREATE TABLE IF NOT EXISTS fee_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    college_id UUID NOT NULL,
    fee_type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    transaction_status TEXT DEFAULT 'pending',
    payment_method TEXT,
    transaction_id TEXT,
    due_date DATE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS on fee_transactions
ALTER TABLE fee_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for fee_transactions
CREATE POLICY "Students can view their own fee transactions" ON fee_transactions
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Parents can view their children's fee transactions" ON fee_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parent_student_links psl
            WHERE psl.student_id = fee_transactions.student_id 
            AND psl.parent_id = auth.uid()
        )
    );

-- Create updated_at triggers for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_grade_submissions_updated_at BEFORE UPDATE ON grade_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fee_transactions_updated_at BEFORE UPDATE ON fee_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
