/*
  # Allow Anonymous Quiz Creation

  1. Security Updates
    - Allow anonymous users to create quizzes
    - Remove authentication requirement for quiz creation
    - Keep existing policies for authenticated users

  2. Changes Made
    - Add INSERT policy for anonymous users
    - Modify created_by to allow null values
*/

-- Allow anonymous users to create quizzes
CREATE POLICY "Anonymous users can create quizzes"
  ON quizzes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to view public quizzes (already exists but ensuring it's there)
DROP POLICY IF EXISTS "Anyone can view public quizzes" ON quizzes;
CREATE POLICY "Anyone can view public quizzes"
  ON quizzes FOR SELECT
  TO public
  USING (is_public = true);

-- Modify the created_by column to allow null values for anonymous users
ALTER TABLE quizzes ALTER COLUMN created_by DROP NOT NULL;