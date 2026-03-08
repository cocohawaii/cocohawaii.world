'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Member {
  id: string;
  authId: string;
  email: string;
  fullName: string;
  role: string;
  memberName: string;
  memberEmail: string;
  memberTag: string;
  isPr?: boolean;
  starBids?: number;
  starBidsConsumed?: number;
  phone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
}

interface AuthContextType {
  member: Member | null;
  isLoading: boolean;
  hasSession: boolean;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  member: null,
  isLoading: true,
  hasSession: false,
  refetch: async () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const refetch = async (retryOn401 = false) => {
    try {
      let res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMember(data.member);
      } else if (res.status === 401 && retryOn401) {
        // Cookies might not be available yet - retry up to 3 times
        for (let i = 0; i < 3; i++) {
          await new Promise((r) => setTimeout(r, 500));
          res = await fetch('/api/auth/me', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setMember(data.member);
            break;
          }
        }
        if (!res.ok) {
          setMember(null);
          const supabase = createClient();
          await supabase.auth.signOut();
        }
      } else {
        setMember(null);
        if (res.status === 401) {
          const supabase = createClient();
          await supabase.auth.signOut();
        }
      }
    } catch {
      setMember(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetch(true); // Allow retry on 401 for post-signup redirect timing
  }, []);

  // Track session from browser client + refetch when auth state changes
  useEffect(() => {
    const supabase = createClient();
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
    };
    checkSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        setHasSession(true);
        refetch();
      }
      if (event === 'SIGNED_OUT') {
        setHasSession(false);
        setMember(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <AuthContext.Provider value={{ member, isLoading, hasSession, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}
