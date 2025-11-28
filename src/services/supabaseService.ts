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
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export async function getProjects(userId: string, includeArchived: boolean = false): Promise<Project[]> {
  const query = supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (!includeArchived) {
    query.eq('archived', false);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return (data || []).map(p => ({
    ...p,
    report: p.report as any as AnalysisReport,
    markers: p.markers as any as Marker[]
  }));
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
