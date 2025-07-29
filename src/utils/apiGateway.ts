
import { supabase } from '@/integrations/supabase/client';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface SelectOptions {
  filters?: Record<string, any>;
  order?: { column: string; ascending: boolean };
  limit?: number;
  offset?: number;
}

class ApiGateway {
  private static instance: ApiGateway;

  private constructor() {}

  public static getInstance(): ApiGateway {
    if (!ApiGateway.instance) {
      ApiGateway.instance = new ApiGateway();
    }
    return ApiGateway.instance;
  }

  async select(table: string, options: SelectOptions = {}): Promise<ApiResponse> {
    try {
      let query = supabase.from(table).select('*');

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending });
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Apply offset
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error selecting from ${table}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error(`Unexpected error selecting from ${table}:`, error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async insert(table: string, data: any): Promise<ApiResponse> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error(`Error inserting into ${table}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error(`Unexpected error inserting into ${table}:`, error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async update(table: string, data: any, filters: Record<string, any>): Promise<ApiResponse> {
    try {
      let query = supabase.from(table).update(data);

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data: result, error } = await query.select().single();

      if (error) {
        console.error(`Error updating ${table}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error(`Unexpected error updating ${table}:`, error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async delete(table: string, filters: Record<string, any>): Promise<ApiResponse> {
    try {
      let query = supabase.from(table).delete();

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { error } = await query;

      if (error) {
        console.error(`Error deleting from ${table}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error(`Unexpected error deleting from ${table}:`, error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

export const apiGateway = ApiGateway.getInstance();
