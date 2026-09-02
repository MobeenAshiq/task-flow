import { NextRequest } from 'next/server';

export interface UserSession {
  user: {
    id: string;
    email?: string;
  };
  accessToken?: string;
}

export async function getCurrentSession(_req?: NextRequest): Promise<UserSession | null> {
  // Supabase SSR session retrieval helper
  return null;
}
