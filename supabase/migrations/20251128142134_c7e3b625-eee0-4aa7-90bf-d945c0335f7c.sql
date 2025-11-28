-- Add archived column to projects table
ALTER TABLE public.projects
ADD COLUMN archived boolean DEFAULT false NOT NULL;

-- Add index for better query performance
CREATE INDEX idx_projects_archived ON public.projects(archived);

-- Update RLS policies to filter out archived projects by default
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);