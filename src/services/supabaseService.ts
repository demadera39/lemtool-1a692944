import { supabase } from '@/integrations/supabase/client';
import { User, Project, TestSession, Marker, AnalysisReport } from '../types';

export { supabase };

export const ensureProfile = async (userId: string, email: string, name?: string) => {
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (!existing) {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        name: name || email.split('@')[0]
      });
    if (error && error.code !== '23505') throw error; // Ignore duplicate key errors
  }
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  const { data, error} = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: {
        full_name: name,
      },
    },
  });
  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    // Ignore session_not_found errors - user is already signed out
    if (error && error.message !== 'Auth session missing!') {
      throw error;
    }
  } catch (error: any) {
    // Gracefully handle session expiry errors
    if (error?.message?.includes('session') || error?.message?.includes('Auth session missing')) {
      console.log('Session already expired, signing out locally');
      return;
    }
    throw error;
  }
};

export async function getProjects(
  userId: string, 
  includeArchived: boolean = false,
  limit: number = 4,
  offset: number = 0
): Promise<{ projects: Project[]; hasMore: boolean }> {
  // Only select minimal fields needed for list view - avoid loading large JSON
  let query = supabase
    .from('projects')
    .select('id, created_at, user_id, url, archived, screenshot, report')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit); // Fetch one extra to check if there's more
  
  if (!includeArchived) {
    query = query.eq('archived', false);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  const projects = (data || []).slice(0, limit).map(p => ({
    ...p,
    report: p.report as any as AnalysisReport,
    markers: [] as Marker[]
  }));
  
  return {
    projects,
    hasMore: (data || []).length > limit
  };
}

// Get full project with markers (for detail view)
export async function getProjectFull(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  
  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }
  return {
    ...data,
    report: data.report as any as AnalysisReport,
    markers: data.markers as any as Marker[]
  };
}

export const createProject = async (
  userId: string,
  url: string,
  report: AnalysisReport,
  markers: Marker[]
): Promise<Project> => {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      url,
      report: report as any,
      markers: markers as any,
      screenshot: report.screenshot
    })
    .select()
    .single();
  
  if (error) throw error;
  return {
    ...data,
    report: data.report as any as AnalysisReport,
    markers: data.markers as any as Marker[]
  };
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  
  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }
  return {
    ...data,
    report: data.report as any as AnalysisReport,
    markers: data.markers as any as Marker[]
  };
};

export const getProjectSessions = async (projectId: string): Promise<TestSession[]> => {
  const { data, error } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(s => ({
    ...s,
    markers: s.markers as any as Marker[]
  }));
};

// Get session counts for multiple projects in one query
export const getProjectSessionCounts = async (projectIds: string[]): Promise<Record<string, number>> => {
  if (projectIds.length === 0) return {};
  
  const { data, error } = await supabase
    .from('test_sessions')
    .select('project_id')
    .in('project_id', projectIds);
  
  if (error) {
    console.error('Error fetching session counts:', error);
    return {};
  }
  
  // Count sessions per project
  const counts: Record<string, number> = {};
  (data || []).forEach(s => {
    counts[s.project_id] = (counts[s.project_id] || 0) + 1;
  });
  return counts;
};

export const submitTestSession = async (
  projectId: string,
  participantName: string,
  markers: Marker[]
): Promise<TestSession> => {
  const { data, error } = await supabase
    .from('test_sessions')
    .insert({
      project_id: projectId,
      participant_name: participantName,
      markers: markers as any
    })
    .select()
    .single();
  
  if (error) throw error;
  return {
    ...data,
    markers: data.markers as any as Marker[]
  };
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
  
  if (error) throw error;
};

export const archiveProject = async (projectId: string, archived: boolean = true): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .update({ archived })
    .eq('id', projectId);
  
  if (error) throw error;
};
