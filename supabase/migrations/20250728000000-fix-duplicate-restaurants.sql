-- Fix duplicate restaurants by keeping only the most recent one for each user/name combination
-- This migration should be run after the main schema migration

-- First, let's identify and remove duplicate restaurants
-- Keep the most recent restaurant for each user/name combination
WITH duplicates AS (
  SELECT 
    user_id,
    name,
    COUNT(*) as count,
    MAX(created_at) as max_created_at
  FROM public.restaurants
  GROUP BY user_id, name
  HAVING COUNT(*) > 1
),
to_delete AS (
  SELECT r.id
  FROM public.restaurants r
  JOIN duplicates d ON r.user_id = d.user_id AND r.name = d.name
  WHERE r.created_at < d.max_created_at
)
DELETE FROM public.restaurants 
WHERE id IN (SELECT id FROM to_delete);

-- Add unique constraint to prevent future duplicates
-- Note: This will fail if there are still duplicates, so we need to clean them first
ALTER TABLE public.restaurants 
ADD CONSTRAINT restaurants_user_id_name_unique UNIQUE(user_id, name);

-- Create an index for better performance on restaurant lookups
CREATE INDEX idx_restaurants_user_id ON public.restaurants(user_id);
CREATE INDEX idx_restaurants_user_id_name ON public.restaurants(user_id, name); 