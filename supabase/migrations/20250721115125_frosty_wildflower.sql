/*
  # Fix Quiz Creation RLS Policy

  1. Security Updates
    - Drop existing conflicting policies
    - Add proper INSERT policy for authenticated users to create quizzes
    - Add proper SELECT policy for users to read their own quizzes
    - Ensure proper authentication checks

  2. Changes Made
    - Allow authenticated users to insert quizzes with their user ID
    - Allow users to read quizzes they created or public quizzes
    - Fix any policy conflicts
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Public quizzes are viewable by everyone" ON quizzes;
DROP POLICY IF EXISTS "Authenticated users can create quizzes" ON quizzes;

-- Create comprehensive policies for quizzes table
CREATE POLICY "Anyone can view public quizzes"
  ON quizzes FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Users can view their own quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can create quizzes"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own quizzes"
  ON quizzes FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own quizzes"
  ON quizzes FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Ensure admin_settings policy exists for AI config
DROP POLICY IF EXISTS "Authenticated users can read AI config" ON admin_settings;

CREATE POLICY "Authenticated users can read AI config"
  ON admin_settings FOR SELECT
  TO authenticated
  USING (key = 'ai_config');