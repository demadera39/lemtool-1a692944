import { supabase } from '@/integrations/supabase/client';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'free' | 'premium' | 'admin';
  analyses_used: number;
  analyses_limit: number;
  monthly_analyses_used: number;
  monthly_analyses_limit: number;
  pack_analyses_remaining: number;
  last_monthly_reset?: string;
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
    .maybeSingle();

  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }

  // If no role exists, create default free role
  if (!data) {
    const { data: newRole, error: createError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'free',
        analyses_used: 0,
        analyses_limit: 3
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user role:', createError);
      return null;
    }

    return newRole;
  }

  return data;
};

export const canCreateAnalysis = async (userId: string): Promise<boolean> => {
  const role = await getUserRole(userId);
  if (!role) return false;

  // Both free and premium users can use monthly analyses
  if (role.monthly_analyses_used < role.monthly_analyses_limit) {
    return true;
  }

  // Anyone can use pack analyses if they have them
  return role.pack_analyses_remaining > 0;
};

export const incrementAnalysisCount = async (userId: string): Promise<void> => {
  const { error } = await supabase.rpc('increment_analysis_count', {
    _user_id: userId
  });

  if (error) {
    console.error('Error incrementing analysis count:', error);
  }
};

export const getRemainingAnalyses = async (userId: string): Promise<{ monthly: number; pack: number; monthlyLimit: number }> => {
  const role = await getUserRole(userId);
  if (!role) return { monthly: 0, pack: 0, monthlyLimit: 10 };

  // Calculate remaining monthly analyses for both free and premium users
  const monthly = Math.max(0, role.monthly_analyses_limit - role.monthly_analyses_used);
  
  return {
    monthly,
    pack: role.pack_analyses_remaining,
    monthlyLimit: role.monthly_analyses_limit
  };
};
