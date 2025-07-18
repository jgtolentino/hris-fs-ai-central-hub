import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  role: string;
}

export async function createContext({ req, res }: CreateExpressContextOptions) {
  // Get the session from Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  let user: User | null = null;

  if (token) {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      
      if (authUser && !error) {
        // Get additional user data from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        user = {
          id: authUser.id,
          email: authUser.email!,
          role: profile?.role || 'employee',
        };
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  }

  return {
    req,
    res,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;