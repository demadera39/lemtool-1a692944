import { supabase } from '@/integrations/supabase/client';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'free' | 'premium';
  analyses_used: number;
  analyses_limit: number;
  subscription_status?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_start?: string;
  subscription_end?: string;
}

export const getUserRole = async (userId: string): Promise<UserRole | null> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }

  return data;
};

export const canCreateAnalysis = async (userId: string): Promise<boolean> => {
  const role = await getUserRole(userId);
  if (!role) return false;

  // Premium users have unlimited analyses
  if (role.role === 'premium') return true;

  // Free users are limited
  return role.analyses_used < role.analyses_limit;
};

export const incrementAnalysisCount = async (userId: string): Promise<void> => {
  const { error } = await supabase.rpc('increment_analysis_count', {
    _user_id: userId
  });

  if (error) {
    console.error('Error incrementing analysis count:', error);
  }
};

export const getRemainingAnalyses = async (userId: string): Promise<number> => {
  const role = await getUserRole(userId);
  if (!role) return 0;

  if (role.role === 'premium') return -1; // Unlimited

  return Math.max(0, role.analyses_limit - role.analyses_used);
};
