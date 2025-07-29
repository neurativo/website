/*
  # Fix Anonymous Quiz Creation RLS Policy

  1. Security Updates
    - Drop existing conflicting policies
    - Create proper policies for anonymous quiz creation
    - Allow anonymous users to insert quizzes
    - Maintain security for authenticated users

  2. Changes Made
    - Allow anonymous (anon) role to insert quizzes
    - Allow public to view public quizzes
    - Keep authenticated user policies intact
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Anyone can view public quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can view their own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated users can create quizzes" ON quizzes;
DROP POLICY IF EXISTS "Anonymous users can create quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can update their own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can delete their own quizzes" ON quizzes;

-- Create comprehensive policies for quizzes table
CREATE POLICY "Public can view public quizzes"
  ON quizzes FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Authenticated users can view their own quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by OR is_public = true);

-- Allow anonymous users to create quizzes
CREATE POLICY "Anonymous users can create public quizzes"
  ON quizzes FOR INSERT
  TO anon
  WITH CHECK (is_public = true);

-- Allow authenticated users to create quizzes
CREATE POLICY "Authenticated users can create quizzes"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Allow users to update their own quizzes
CREATE POLICY "Users can update their own quizzes"
  ON quizzes FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Allow users to delete their own quizzes
CREATE POLICY "Users can delete their own quizzes"
  ON quizzes FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Ensure the created_by column allows null values for anonymous users
ALTER TABLE quizzes ALTER COLUMN created_by DROP NOT NULL;