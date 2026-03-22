-- Fix: instructor replies failing with "violates row-level security policy" on messages.
-- Run this in Supabase SQL Editor (safe to run multiple times).

DROP POLICY IF EXISTS "Group members can send messages" ON public.messages;
DROP POLICY IF EXISTS "Project owner can post instructor messages" ON public.messages;
DROP POLICY IF EXISTS "Group members and project owner can send messages" ON public.messages;

CREATE POLICY "Group members and project owner can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      public.is_group_member(group_id)
      OR EXISTS (
        SELECT 1
        FROM public.project_groups pg
        JOIN public.projects p ON p.id = pg.project_id
        WHERE pg.id = group_id
          AND p.created_by = auth.uid()
      )
    )
  );
