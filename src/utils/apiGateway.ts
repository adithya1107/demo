
import { supabase } from '@/integrations/supabase/client';
import { dbSecurityValidator } from './databaseSecurity';
import { auditLogger } from './auditLogger';
import type { Database } from '@/integrations/supabase/types';

export interface APIResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
  timestamp: string;
}

export interface APIConfig {
  timeout: number;
  retries: number;
  enableLogging: boolean;
  enableCaching: boolean;
  cacheTimeout: number;
}

// Type for valid table names
type TableName = keyof Database['public']['Tables'];

// Query options interface
export interface QueryOptions {
  select?: string;
  filters?: Record<string, any>;
  order?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
}

// Cache entry interface
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export class APIGateway {
  private static instance: APIGateway;
  private config: APIConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private requestQueue: Map<string, Promise<any>> = new Map();

  private constructor() {
    this.config = {
      timeout: 30000,
      retries: 3,
      enableLogging: true,
      enableCaching: true,
      cacheTimeout: 300000, // 5 minutes
    };
  }

  public static getInstance(): APIGateway {
    if (!APIGateway.instance) {
      APIGateway.instance = new APIGateway();
    }
    return APIGateway.instance;
  }

  private generateCacheKey(table: string, query: QueryOptions): string {
    return `${table}_${JSON.stringify(query)}`;
  }

  private isValidCacheEntry(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.config.retries
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (this.config.retries - retries + 1)));
        return this.executeWithRetry(operation, retries - 1);
      }
      throw error;
    }
  }

  private async logAPICall(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    if (this.config.enableLogging) {
      await auditLogger.logUserAction(
        'api_call',
        `${operation} on ${table} - ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`,
        'api_gateway',
        undefined,
        undefined,
        { operation, table, duration, success, error }
      );
    }
  }

  private buildSelectQuery(table: TableName, query: QueryOptions): any {
    let queryBuilder = supabase.from(table).select(query.select || '*');

    // Apply filters
    if (query.filters) {
      Object.entries(query.filters).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value);
      });
    }

    // Apply ordering
    if (query.order) {
      queryBuilder = queryBuilder.order(query.order.column, { 
        ascending: query.order.ascending ?? true 
      });
    }

    // Apply pagination
    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 10) - 1);
    }

    return queryBuilder;
  }

  public async select<T = any>(
    table: TableName,
    query: QueryOptions = {},
    useCache: boolean = true
  ): Promise<APIResponse<T[]>> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(table, query);

    try {
      // Check cache first
      if (useCache && this.config.enableCaching && this.cache.has(cacheKey)) {
        const cachedEntry = this.cache.get(cacheKey)!;
        if (this.isValidCacheEntry(cachedEntry)) {
          return {
            data: cachedEntry.data,
            error: null,
            success: true,
            timestamp: new Date().toISOString(),
          };
        }
      }

      // Check if same request is already in progress
      if (this.requestQueue.has(cacheKey)) {
        const result = await this.requestQueue.get(cacheKey);
        return result;
      }

      // Create new request
      const requestPromise = this.executeWithRetry(async () => {
        const queryBuilder = this.buildSelectQuery(table, query);
        return await dbSecurityValidator.validateAndExecuteQuery(
          queryBuilder,
          'select',
          `${table}_select`
        );
      });

      // Store in request queue
      this.requestQueue.set(cacheKey, requestPromise);

      const result = await requestPromise;
      
      // Remove from queue
      this.requestQueue.delete(cacheKey);

      const duration = performance.now() - startTime;

      if (!result) {
        await this.logAPICall('SELECT', table, duration, false, 'No data returned');
        return {
          data: null,
          error: 'No data returned',
          success: false,
          timestamp: new Date().toISOString(),
        };
      }

      // Cache successful result
      if (useCache && this.config.enableCaching) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl: this.config.cacheTimeout,
        });
      }

      await this.logAPICall('SELECT', table, duration, true);

      return {
        data: result,
        error: null,
        success: true,
        timestamp: new Date().toISOString(),
      };

    } catch (error: any) {
      this.requestQueue.delete(cacheKey);
      const duration = performance.now() - startTime;
      await this.logAPICall('SELECT', table, duration, false, error.message);
      
      return {
        data: null,
        error: error.message,
        success: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async insert<T = any>(
    table: TableName,
    data: any,
    options: { returning?: string } = {}
  ): Promise<APIResponse<T>> {
    const startTime = performance.now();

    try {
      const sanitizedData = dbSecurityValidator.sanitizeUserInput(data);
      
      const result = await this.executeWithRetry(async () => {
        let queryBuilder = supabase.from(table).insert(sanitizedData);
        
        if (options.returning) {
          queryBuilder = queryBuilder.select(options.returning);
        }
        
        return await dbSecurityValidator.validateAndExecuteQuery(
          queryBuilder,
          'insert',
          `${table}_insert`
        );
      });

      const duration = performance.now() - startTime;

      if (!result) {
        await this.logAPICall('INSERT', table, duration, false, 'Insert failed');
        return {
          data: null,
          error: 'Insert failed',
          success: false,
          timestamp: new Date().toISOString(),
        };
      }

      // Clear related cache entries
      this.clearCacheByTable(table);

      await this.logAPICall('INSERT', table, duration, true);

      return {
        data: result,
        error: null,
        success: true,
        timestamp: new Date().toISOString(),
      };

    } catch (error: any) {
      const duration = performance.now() - startTime;
      await this.logAPICall('INSERT', table, duration, false, error.message);
      
      return {
        data: null,
        error: error.message,
        success: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async update<T = any>(
    table: TableName,
    data: any,
    filters: Record<string, any>,
    options: { returning?: string } = {}
  ): Promise<APIResponse<T>> {
    const startTime = performance.now();

    try {
      const sanitizedData = dbSecurityValidator.sanitizeUserInput(data);
      
      const result = await this.executeWithRetry(async () => {
        let queryBuilder = supabase.from(table).update(sanitizedData);

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value);
        });
        
        if (options.returning) {
          queryBuilder = queryBuilder.select(options.returning);
        }
        
        return await dbSecurityValidator.validateAndExecuteQuery(
          queryBuilder,
          'update',
          `${table}_update`
        );
      });

      const duration = performance.now() - startTime;

      if (!result) {
        await this.logAPICall('UPDATE', table, duration, false, 'Update failed');
        return {
          data: null,
          error: 'Update failed',
          success: false,
          timestamp: new Date().toISOString(),
        };
      }

      // Clear related cache entries
      this.clearCacheByTable(table);

      await this.logAPICall('UPDATE', table, duration, true);

      return {
        data: result,
        error: null,
        success: true,
        timestamp: new Date().toISOString(),
      };

    } catch (error: any) {
      const duration = performance.now() - startTime;
      await this.logAPICall('UPDATE', table, duration, false, error.message);
      
      return {
        data: null,
        error: error.message,
        success: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  public async delete<T = any>(
    table: TableName,
    filters: Record<string, any>
  ): Promise<APIResponse<T>> {
    const startTime = performance.now();

    try {
      const result = await this.executeWithRetry(async () => {
        let queryBuilder = supabase.from(table).delete();

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value);
        });

        return await dbSecurityValidator.validateAndExecuteQuery(
          queryBuilder,
          'delete',
          `${table}_delete`
        );
      });

      const duration = performance.now() - startTime;

      if (!result) {
        await this.logAPICall('DELETE', table, duration, false, 'Delete failed');
        return {
          data: null,
          error: 'Delete failed',
          success: false,
          timestamp: new Date().toISOString(),
        };
      }

      // Clear related cache entries
      this.clearCacheByTable(table);

      await this.logAPICall('DELETE', table, duration, true);

      return {
        data: result,
        error: null,
        success: true,
        timestamp: new Date().toISOString(),
      };

    } catch (error: any) {
      const duration = performance.now() - startTime;
      await this.logAPICall('DELETE', table, duration, false, error.message);
      
      return {
        data: null,
        error: error.message,
        success: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private clearCacheByTable(table: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(table));
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public updateConfig(newConfig: Partial<APIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getStats(): {
    cacheSize: number;
    queueSize: number;
    config: APIConfig;
  } {
    return {
      cacheSize: this.cache.size,
      queueSize: this.requestQueue.size,
      config: this.config,
    };
  }
}

export const apiGateway = APIGateway.getInstance();
