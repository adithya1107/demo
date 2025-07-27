
import { supabase } from '@/integrations/supabase/client';
import { auditLogger } from './auditLogger';

export interface DatabaseSecurityConfig {
  maxQueryTimeout: number;
  maxResultSize: number;
  enableParameterValidation: boolean;
  enableQueryLogging: boolean;
}

export class DatabaseSecurityValidator {
  private static instance: DatabaseSecurityValidator;
  private config: DatabaseSecurityConfig;

  private constructor() {
    this.config = {
      maxQueryTimeout: 30000, // 30 seconds
      maxResultSize: 1000,
      enableParameterValidation: true,
      enableQueryLogging: true,
    };
  }

  public static getInstance(): DatabaseSecurityValidator {
    if (!DatabaseSecurityValidator.instance) {
      DatabaseSecurityValidator.instance = new DatabaseSecurityValidator();
    }
    return DatabaseSecurityValidator.instance;
  }

  public async validateAndExecuteQuery<T>(
    queryBuilder: any,
    queryType: 'select' | 'insert' | 'update' | 'delete',
    context: string
  ): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      // Log query attempt
      if (this.config.enableQueryLogging) {
        await auditLogger.logUserAction(
          `db_query_${queryType}`,
          `Database query executed in ${context}`,
          'database'
        );
      }

      // Execute query with timeout
      const queryPromise = queryBuilder;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), this.config.maxQueryTimeout);
      });

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        await auditLogger.logSecurityEvent(
          'database_query_error',
          `Query failed in ${context}: ${error.message}`,
          'medium'
        );
        throw error;
      }

      // Validate result size
      if (Array.isArray(data) && data.length > this.config.maxResultSize) {
        await auditLogger.logSecurityEvent(
          'large_result_set',
          `Query returned ${data.length} rows in ${context}`,
          'low'
        );
        
        // Truncate results if too large
        return data.slice(0, this.config.maxResultSize) as T;
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Log slow queries
      if (executionTime > 5000) {
        await auditLogger.logSecurityEvent(
          'slow_query',
          `Query took ${executionTime}ms in ${context}`,
          'low'
        );
      }

      return data as T;
    } catch (error) {
      await auditLogger.logSecurityEvent(
        'database_security_violation',
        `Database security issue in ${context}: ${error}`,
        'high'
      );
      throw error;
    }
  }

  public sanitizeUserInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potential SQL injection patterns
      return input
        .replace(/[';\\]/g, '') // Remove semicolons and backslashes
        .replace(/--/g, '') // Remove SQL comments
        .replace(/\/\*/g, '') // Remove block comments
        .replace(/\*\//g, '')
        .replace(/\bUNION\b/gi, '')
        .replace(/\bSELECT\b/gi, '')
        .replace(/\bINSERT\b/gi, '')
        .replace(/\bUPDATE\b/gi, '')
        .replace(/\bDELETE\b/gi, '')
        .replace(/\bDROP\b/gi, '')
        .replace(/\bEXEC\b/gi, '')
        .replace(/\bCREATE\b/gi, '')
        .replace(/\bALTER\b/gi, '')
        .trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeUserInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeUserInput(key)] = this.sanitizeUserInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  public validateColumnAccess(
    tableName: string,
    columns: string[],
    userRole: string
  ): boolean {
    const restrictedColumns: Record<string, Record<string, string[]>> = {
      user_profiles: {
        student: ['password', 'is_active', 'admin_roles'],
        faculty: ['password', 'admin_roles'],
        parent: ['password', 'admin_roles'],
        alumni: ['password', 'admin_roles'],
      },
      audit_logs: {
        student: ['*'],
        faculty: ['*'],
        parent: ['*'],
        alumni: ['*'],
      },
    };

    const tableRestrictions = restrictedColumns[tableName];
    if (!tableRestrictions) return true;

    const roleRestrictions = tableRestrictions[userRole];
    if (!roleRestrictions) return true;

    if (roleRestrictions.includes('*')) return false;

    return !columns.some(col => roleRestrictions.includes(col));
  }
}

export const dbSecurityValidator = DatabaseSecurityValidator.getInstance();
