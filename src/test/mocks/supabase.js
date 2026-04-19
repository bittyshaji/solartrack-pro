/**
 * Mock Supabase Client
 * Used for testing services that interact with Supabase
 */

import { vi } from 'vitest'

/**
 * Create a mock Supabase query builder
 */
function createMockQueryBuilder() {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
  }
}

/**
 * Create a mock Supabase client
 */
export function createMockSupabaseClient() {
  return {
    from: vi.fn().mockReturnValue(createMockQueryBuilder()),
    auth: {
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({ data: null, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
      }),
    },
  }
}

export const mockSupabaseClient = createMockSupabaseClient()
