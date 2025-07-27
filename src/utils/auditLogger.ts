
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  action_type: string;
  action_description: string;
  module: string;
  target_user_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private batchSize = 10;
  private batchTimeout = 5000; // 5 seconds
  private logBatch: AuditLogEntry[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  public async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Get current user and college info
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('Audit log attempted without authenticated user');
        return;
      }

      // Get user profile to determine college
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('college_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        console.warn('User profile not found for audit logging');
        return;
      }

      // Enhance log entry with additional security context
      const enhancedEntry: AuditLogEntry = {
        ...entry,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
      };

      // Add to batch
      this.logBatch.push(enhancedEntry);

      // Process batch if it's full or start timer
      if (this.logBatch.length >= this.batchSize) {
        await this.flushBatch();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.flushBatch();
        }, this.batchTimeout);
      }
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.logBatch.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('college_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const logsToInsert = this.logBatch.map(entry => ({
        college_id: profile.college_id,
        admin_user_id: user.id,
        target_user_id: entry.target_user_id,
        action_type: entry.action_type,
        action_description: entry.action_description,
        module: entry.module,
        old_values: entry.old_values,
        new_values: entry.new_values,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
      }));

      await supabase.from('audit_logs').insert(logsToInsert);
      
      this.logBatch = [];
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }
    } catch (error) {
      console.error('Failed to flush audit batch:', error);
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      // In production, this would be handled server-side
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  public async logUserAction(
    action: string,
    description: string,
    module: string,
    targetUserId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action_type: action,
      action_description: description,
      module,
      target_user_id: targetUserId,
      old_values: oldValues,
      new_values: newValues,
    });
  }

  public async logSecurityEvent(
    event: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    await this.log({
      action_type: 'security_event',
      action_description: `[${severity.toUpperCase()}] ${event}: ${description}`,
      module: 'security',
    });
  }

  public async logLoginAttempt(
    success: boolean,
    email: string,
    reason?: string
  ): Promise<void> {
    await this.log({
      action_type: success ? 'login_success' : 'login_failure',
      action_description: `Login attempt for ${email}${reason ? `: ${reason}` : ''}`,
      module: 'authentication',
    });
  }
}

export const auditLogger = AuditLogger.getInstance();
