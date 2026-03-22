-- Lets group members resolve the project instructor's email (for question notifications).
-- Run in Supabase SQL Editor if you already have a DB and only need this function.

CREATE OR REPLACE FUNCTION public.get_project_instructor_email(p_group_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_group_member(p_group_id) THEN
    RETURN NULL;
  END IF;
  RETURN (
    SELECT pr.email
    FROM public.project_groups pg
    JOIN public.projects p ON p.id = pg.project_id
    JOIN public.profiles pr ON pr.id = p.created_by
    WHERE pg.id = p_group_id
    LIMIT 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_instructor_email(uuid) TO authenticated;
