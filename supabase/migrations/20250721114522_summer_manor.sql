/*
  # Fix RLS Policies for Quiz Creation and AI Config Access

  1. Security Updates
    - Add INSERT policy for authenticated users to create quizzes
    - Add SELECT policy for authenticated users to read AI config from admin_settings
    - Ensure users can only create quizzes with their own user ID

  2. Changes Made
    - Allow authenticated users to insert into quizzes table
    - Allow authenticated users to read ai_config from admin_settings
*/

-- Add INSERT policy for quizzes table
CREATE POLICY "Authenticated users can create quizzes"
  ON quizzes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Add SELECT policy for admin_settings to allow reading AI config
CREATE POLICY "Authenticated users can read AI config"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (key = 'ai_config');