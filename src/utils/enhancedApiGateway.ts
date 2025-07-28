
import { apiGateway } from './apiGateway';
import { supabase } from '@/integrations/supabase/client';

export class EnhancedApiGateway {
  private static instance: EnhancedApiGateway;

  private constructor() {}

  public static getInstance(): EnhancedApiGateway {
    if (!EnhancedApiGateway.instance) {
      EnhancedApiGateway.instance = new EnhancedApiGateway();
    }
    return EnhancedApiGateway.instance;
  }

  // Enhanced query methods with proper joins
  async getStudentGrades(studentId: string) {
    const { data, error } = await supabase
      .from('grade_submissions')
      .select(`
        *,
        assignments (
          title,
          max_marks,
          course_id,
          courses (
            course_name,
            course_code,
            user_profiles (
              first_name,
              last_name
            )
          )
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async getStudentAttendance(studentId: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        courses (
          course_name,
          course_code,
          instructor_id,
          user_profiles (
            first_name,
            last_name
          )
        )
      `)
      .eq('student_id', studentId)
      .order('class_date', { ascending: false });

    return { data, error };
  }

  async getFacultyCoursesWithEnrollments(facultyId: string) {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        enrollments (
          id,
          student_id,
          status,
          user_profiles (
            first_name,
            last_name,
            email,
            user_code
          )
        )
      `)
      .eq('instructor_id', facultyId)
      .eq('is_active', true);

    return { data, error };
  }

  async getStudentFees(studentId: string) {
    const { data, error } = await supabase
      .from('fee_transactions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async getParentChildrenData(parentId: string) {
    const { data, error } = await supabase
      .from('parent_student_links')
      .select(`
        *,
        user_profiles!parent_student_links_student_id_fkey (
          id,
          first_name,
          last_name,
          email,
          user_code
        )
      `)
      .eq('parent_id', parentId);

    return { data, error };
  }

  async getCollegeStatistics(collegeId: string) {
    const [
      studentsResult,
      facultyResult,
      coursesResult,
      eventsResult
    ] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id')
        .eq('college_id', collegeId)
        .eq('user_type', 'student'),
      
      supabase
        .from('user_profiles')
        .select('id')
        .eq('college_id', collegeId)
        .eq('user_type', 'faculty'),
      
      supabase
        .from('courses')
        .select('id')
        .eq('college_id', collegeId)
        .eq('is_active', true),
      
      supabase
        .from('events')
        .select('id')
        .eq('college_id', collegeId)
        .eq('is_active', true)
    ]);

    return {
      students: studentsResult.data?.length || 0,
      faculty: facultyResult.data?.length || 0,
      courses: coursesResult.data?.length || 0,
      events: eventsResult.data?.length || 0
    };
  }

  async getNotificationsWithSender(recipientId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        user_profiles!notifications_sender_id_fkey (
          first_name,
          last_name,
          user_type
        )
      `)
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async createNotificationForUsers(notification: {
    title: string;
    content: string;
    college_id: string;
    sender_id?: string;
    notification_type?: string;
    priority?: string;
    action_url?: string;
    metadata?: any;
  }, userIds: string[]) {
    const notifications = userIds.map(userId => ({
      ...notification,
      recipient_id: userId
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications);

    return { data, error };
  }

  async getAssignmentSubmissions(assignmentId: string) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(`
        *,
        user_profiles!assignment_submissions_student_id_fkey (
          first_name,
          last_name,
          user_code
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    return { data, error };
  }

  async getMarketplaceItems(collegeId: string) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select(`
        *,
        user_profiles!marketplace_items_seller_id_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .eq('college_id', collegeId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Real-time subscription helpers
  subscribeToNotifications(userId: string, callback: (notification: any) => void) {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    return channel;
  }

  subscribeToAttendance(courseId: string, callback: (attendance: any) => void) {
    const channel = supabase
      .channel('attendance')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
          filter: `course_id=eq.${courseId}`
        },
        callback
      )
      .subscribe();

    return channel;
  }

  subscribeToGrades(studentId: string, callback: (grade: any) => void) {
    const channel = supabase
      .channel('grades')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grade_submissions',
          filter: `student_id=eq.${studentId}`
        },
        callback
      )
      .subscribe();

    return channel;
  }
}

export const enhancedApiGateway = EnhancedApiGateway.getInstance();
