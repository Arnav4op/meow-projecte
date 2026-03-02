-- Add Discord linking fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS discord_id text UNIQUE,
ADD COLUMN IF NOT EXISTS discord_username text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_discord_id ON public.profiles(discord_id);

-- Add RLS policy for users to update their own discord fields
DROP POLICY IF EXISTS "Users can update own discord linking" ON public.profiles;
CREATE POLICY "Users can update own discord linking" ON public.profiles 
FOR UPDATE USING (auth.uid() = user_id);

-- Allow read of discord fields
DROP POLICY IF EXISTS "Users can view discord linking" ON public.profiles;
CREATE POLICY "Users can view discord linking" ON public.profiles 
FOR SELECT USING (true);
