-- Pre-approve admin user and set as admin
-- Run this to set up admin@aflv.ru as a pre-approved admin

-- First, let's check if the user exists in auth.users
SELECT id, email FROM auth.users WHERE email = 'admin@aflv.ru';

-- Once you have the user_id, run:
-- UPDATE profiles SET is_approved = true WHERE user_id = 'USER_ID_FROM_ABOVE';

-- Or if the profile doesn't exist yet, this will create it:
-- INSERT INTO profiles (user_id, name, callsign, is_approved, rank, money)
-- VALUES ('USER_ID', 'Administrator', 'AFLV001', true, 'Admin', 100000);

-- Add admin role:
-- INSERT INTO user_roles (user_id, role) VALUES ('USER_ID', 'admin')
-- ON CONFLICT DO NOTHING;
