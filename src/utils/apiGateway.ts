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

type TableName = keyof Database['public']['Tables'];

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
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (this.config.retries - retries + 1))
        );
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

  private buildSelectQuery(
    table: TableName,
    query: QueryOptions
  ): any {
    // Force `any` on query builder to avoid excessive deep-typing
    let queryBuilder: any = supabase.from(table).select(query.select || '*');

    if (query.filters) {
      Object.entries(query.filters).forEach(([key, value]) => {
        queryBuilder = queryBuilder.eq(key, value);
      });
    }

    if (query.order) {
      queryBuilder = queryBuilder.order(query.order.column, {
        ascending: query.order.ascending ?? true,
      });
    }

    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder = queryBuilder.range(
        query.offset,
        query.offset + (query.limit || 10) - 1
      );
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
      if (useCache && this.config.enableCaching && this.cache.has(cacheKey)) {
        const cachedEntry = this.cache.get(cacheKey)!;
        if (this.isValidCacheEntry(cachedEntry)) {
          return {
            data: cachedEntry.data as T[],
            error: null,
            success: true,
            timestamp: new Date().toISOString(),
          };
        }
      }

      if (this.requestQueue.has(cacheKey)) {
        return this.requestQueue.get(cacheKey)! as Promise<APIResponse<T[]>>;
      }

      const requestPromise = this.executeWithRetry<APIResponse<T[]>>(async () => {
        // Build and execute query
        const builder: any = this.buildSelectQuery(table, query);
        const result = await dbSecurityValidator.validateAndExecuteQuery(
          builder as Promise<any>,
          'select',
          `${table}_select`
        );
        return {
          data: result as T[],
          error: null,
          success: true,
          timestamp: new Date().toISOString(),
        };
      });

      this.requestQueue.set(cacheKey, requestPromise);
      const result = await requestPromise;
      this.requestQueue.delete(cacheKey);

      const duration = performance.now() - startTime;
      await this.logAPICall('SELECT', table, duration, true);

      if (useCache && this.config.enableCaching && result.data) {
        this.cache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
          ttl: this.config.cacheTimeout,
        });
      }

      return result;
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

      const result = await this.executeWithRetry<any>(async () => {
        let builder: any = supabase.from(table).insert(sanitizedData);
        if (options.returning) {
          builder = builder.select(options.returning);
        }
        const response = await dbSecurityValidator.validateAndExecuteQuery(
          builder as Promise<any>,
          'insert',
          `${table}_insert`
        );
        return response;
      });

      const duration = performance.now() - startTime;
      await this.logAPICall('INSERT', table, duration, true);

      this.clearCacheByTable(table);
      return {
        data: result as T,
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

      const result = await this.executeWithRetry<any>(async () => {
        let builder: any = supabase.from(table).update(sanitizedData);
        Object.entries(filters).forEach(([key, value]) => {
          builder = builder.eq(key, value);
        });
        if (options.returning) {
          builder = builder.select(options.returning);
        }
        const response = await dbSecurityValidator.validateAndExecuteQuery(
          builder as Promise<any>,
          'update',
          `${table}_update`
        );
        return response;
      });

      const duration = performance.now() - startTime;
      await this.logAPICall('UPDATE', table, duration, true);

      this.clearCacheByTable(table);
      return {
        data: result as T,
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
      const result = await this.executeWithRetry<any>(async () => {
        let builder: any = supabase.from(table).delete();
        Object.entries(filters).forEach(([key, value]) => {
          builder = builder.eq(key, value);
        });
        const response = await dbSecurityValidator.validateAndExecuteQuery(
          builder as Promise<any>,
          'delete',
          `${table}_delete`
        );
        return response;
      });

      const duration = performance.now() - startTime;
      await this.logAPICall('DELETE', table, duration, true);

      this.clearCacheByTable(table);
      return {
        data: result as T,
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
    Array.from(this.cache.keys())
      .filter((key) => key.startsWith(table))
      .forEach((key) => this.cache.delete(key));
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
