/*
  # Comprehensive EdTech Quiz Platform Schema

  1. New Tables
    - `quizzes` - Core quiz data with AI generation support
    - `questions` - Individual quiz questions with multiple types
    - `quiz_attempts` - User quiz completion records
    - `user_stats` - Gamification data (XP, levels, streaks)
    - `user_achievements` - Achievement tracking
    - `achievements` - Available achievements
    - `learning_paths` - User learning goals and progress
    - `battle_rooms` - Real-time quiz battles
    - `daily_challenges` - Daily mystery challenges
    - `knowledge_nodes` - Knowledge graph for concept linking
    - `user_explanations` - Community explanations
    - `explanation_votes` - Voting on explanations
    - `suggestions` - User feedback and suggestions
    - `admin_settings` - Admin configuration
    - `ai_usage_logs` - AI API usage tracking
    - `user_preferences` - User settings and preferences

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Admin-only policies for sensitive data
*/

-- Core quiz tables
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  questions jsonb NOT NULL DEFAULT '[]',
  questions_count integer DEFAULT 0,
  estimated_time integer DEFAULT 300,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  tags text[] DEFAULT '{}',
  is_public boolean DEFAULT true,
  is_ai_generated boolean DEFAULT false,
  source_content text,
  source_url text,
  rating numeric(3,2) DEFAULT 0,
  attempts integer DEFAULT 0,
  avg_score numeric(5,2) DEFAULT 0,
  metadata jsonb DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer', 'drag_drop', 'fill_blank', 'code')),
  question text NOT NULL,
  options jsonb,
  correct_answer text NOT NULL,
  explanation text,
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic text,
  time_limit integer DEFAULT 30,
  hints text[] DEFAULT '{}',
  media jsonb,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- User progress and gamification
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  avatar text,
  bio text,
  created_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  is_admin boolean DEFAULT false,
  preferences jsonb DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  total_xp integer DEFAULT 0,
  current_level integer DEFAULT 1,
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  total_quizzes integer DEFAULT 0,
  total_correct integer DEFAULT 0,
  total_questions integer DEFAULT 0,
  total_time_spent integer DEFAULT 0,
  achievements text[] DEFAULT '{}',
  last_quiz_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL,
  time_taken integer NOT NULL,
  answers jsonb NOT NULL,
  completed_at timestamptz DEFAULT now(),
  mistakes jsonb DEFAULT '[]',
  strengths jsonb DEFAULT '[]',
  feedback_rating integer CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  notes text
);

-- Achievements system
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  type text NOT NULL CHECK (type IN ('quiz', 'streak', 'score', 'time', 'special')),
  condition jsonb NOT NULL,
  xp_reward integer DEFAULT 0,
  badge_color text DEFAULT 'blue',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  progress numeric(5,2) DEFAULT 100,
  UNIQUE(user_id, achievement_id)
);

-- Learning paths
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  goal text NOT NULL,
  target_date date NOT NULL,
  topics text[] NOT NULL,
  recommended_quizzes text[] DEFAULT '{}',
  progress numeric(5,2) DEFAULT 0,
  is_ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Battle system
CREATE TABLE IF NOT EXISTS battle_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id uuid REFERENCES users(id) ON DELETE CASCADE,
  player2_id uuid REFERENCES users(id) ON DELETE CASCADE,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  player1_score integer DEFAULT 0,
  player2_score integer DEFAULT 0,
  current_question integer DEFAULT 0,
  winner_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Daily challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  bonus_xp integer DEFAULT 50,
  participants integer DEFAULT 0,
  avg_score numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_challenge_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL,
  time_taken integer NOT NULL,
  bonus_earned integer DEFAULT 0,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Knowledge graph
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text UNIQUE NOT NULL,
  description text,
  difficulty integer DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 10),
  prerequisites text[] DEFAULT '{}',
  related_topics text[] DEFAULT '{}',
  quizzes text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  mastery_level numeric(5,2) DEFAULT 0,
  last_practiced timestamptz,
  practice_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, topic)
);

-- Community explanations
CREATE TABLE IF NOT EXISTS user_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  explanation text NOT NULL,
  is_approved boolean DEFAULT false,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS explanation_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  explanation_id uuid REFERENCES user_explanations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(explanation_id, user_id)
);

-- Feedback and suggestions
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  type text DEFAULT 'feature' CHECK (type IN ('feature', 'bug', 'improvement', 'other')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  votes integer DEFAULT 0,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin and system tables
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  provider text NOT NULL,
  model text,
  input_tokens integer,
  output_tokens integer,
  cost numeric(10,6),
  latency integer,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanation_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public read access to quizzes and questions
CREATE POLICY "Public quizzes are viewable by everyone"
  ON quizzes FOR SELECT
  TO public
  USING (is_public = true);

CREATE POLICY "Questions are viewable by everyone"
  ON questions FOR SELECT
  TO public
  USING (true);

-- Users can read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR ALL
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view own stats"
  ON user_stats FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz attempts"
  ON quiz_attempts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own learning paths"
  ON learning_paths FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own knowledge"
  ON user_knowledge FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own explanations"
  ON user_explanations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own votes"
  ON explanation_votes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own suggestions"
  ON suggestions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Battle rooms - players can view their battles
CREATE POLICY "Players can view their battles"
  ON battle_rooms FOR ALL
  TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Daily challenges - public read, authenticated write
CREATE POLICY "Daily challenges are viewable by everyone"
  ON daily_challenges FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can view own challenge attempts"
  ON daily_challenge_attempts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Knowledge nodes - public read
CREATE POLICY "Knowledge nodes are viewable by everyone"
  ON knowledge_nodes FOR SELECT
  TO public
  USING (true);

-- Achievements - public read
CREATE POLICY "Achievements are viewable by everyone"
  ON achievements FOR SELECT
  TO public
  USING (is_active = true);

-- Admin policies
CREATE POLICY "Admin full access"
  ON admin_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admin can view AI usage logs"
  ON ai_usage_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quizzes_category ON quizzes(category);
CREATE INDEX IF NOT EXISTS idx_quizzes_difficulty ON quizzes(difficulty);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at);
CREATE INDEX IF NOT EXISTS idx_quizzes_rating ON quizzes(rating);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_at ON quiz_attempts(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_rooms_player1_id ON battle_rooms(player1_id);
CREATE INDEX IF NOT EXISTS idx_battle_rooms_player2_id ON battle_rooms(player2_id);
CREATE INDEX IF NOT EXISTS idx_battle_rooms_status ON battle_rooms(status);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_topic ON knowledge_nodes(topic);
CREATE INDEX IF NOT EXISTS idx_user_knowledge_user_id ON user_knowledge(user_id);
CREATE INDEX IF NOT EXISTS idx_user_knowledge_topic ON user_knowledge(topic);

-- Insert default achievements
INSERT INTO achievements (title, description, icon, type, condition, xp_reward, badge_color) VALUES
  ('First Quiz', 'Complete your first quiz', '🎯', 'quiz', '{"type": "quiz_count", "value": 1}', 50, 'blue'),
  ('Quiz Master', 'Complete 10 quizzes', '🏆', 'quiz', '{"type": "quiz_count", "value": 10}', 200, 'gold'),
  ('Perfect Score', 'Get 100% on a quiz', '⭐', 'score', '{"type": "perfect_score", "value": 1}', 100, 'yellow'),
  ('Speed Demon', 'Complete a quiz in under 60 seconds', '⚡', 'time', '{"type": "time_limit", "value": 60}', 150, 'red'),
  ('Streak Master', 'Maintain a 7-day streak', '🔥', 'streak', '{"type": "streak", "value": 7}', 300, 'orange'),
  ('Knowledge Seeker', 'Complete quizzes in 5 different categories', '📚', 'special', '{"type": "category_diversity", "value": 5}', 250, 'purple'),
  ('Battle Champion', 'Win 5 quiz battles', '⚔️', 'special', '{"type": "battle_wins", "value": 5}', 400, 'red'),
  ('AI Collaborator', 'Use AI explanations 10 times', '🤖', 'special', '{"type": "ai_usage", "value": 10}', 100, 'blue'),
  ('Community Helper', 'Write 5 explanations for other users', '💡', 'special', '{"type": "explanations_written", "value": 5}', 200, 'green'),
  ('Daily Challenger', 'Complete 10 daily challenges', '📅', 'special', '{"type": "daily_challenges", "value": 10}', 350, 'purple');

-- Insert default admin settings
INSERT INTO admin_settings (key, value, description) VALUES
  ('ai_config', '{"openai_key": "", "claude_key": "", "gemini_key": "", "active_provider": "openai", "default_model": "gpt-3.5-turbo", "max_tokens": 2000, "temperature": 0.7}', 'AI service configuration'),
  ('app_config', '{"app_name": "QuizAI", "app_description": "AI-Powered Learning Platform", "max_quiz_questions": 50, "default_time_limit": 30, "enable_battles": true, "enable_daily_challenges": true}', 'Application configuration'),
  ('gamification_config', '{"xp_per_correct": 10, "xp_per_quiz": 25, "xp_bonus_perfect": 50, "xp_bonus_speed": 25, "level_multiplier": 100}', 'Gamification settings'),
  ('feature_flags', '{"enable_ar": false, "enable_voice_input": false, "enable_code_playground": false, "enable_team_mode": false, "enable_api_access": false}', 'Feature toggle flags');

-- Insert sample knowledge nodes
INSERT INTO knowledge_nodes (topic, description, difficulty, prerequisites, related_topics) VALUES
  ('JavaScript Basics', 'Fundamental concepts of JavaScript programming', 2, '{}', '{"Variables", "Functions", "Objects"}'),
  ('React Fundamentals', 'Core concepts of React library', 4, '{"JavaScript Basics"}', '{"Components", "State", "Props"}'),
  ('Python Basics', 'Introduction to Python programming', 2, '{}', '{"Variables", "Functions", "Data Types"}'),
  ('Web Development', 'HTML, CSS, and JavaScript for web development', 3, '{}', '{"HTML", "CSS", "JavaScript"}'),
  ('Database Design', 'Principles of database structure and design', 5, '{}', '{"SQL", "Normalization", "Relationships"}'),
  ('API Development', 'Building and consuming APIs', 6, '{"JavaScript Basics", "Web Development"}', '{"REST", "GraphQL", "Authentication"}'),
  ('Machine Learning', 'Introduction to ML concepts and algorithms', 7, '{"Python Basics"}', '{"Data Science", "Neural Networks", "Statistics"}'),
  ('Data Structures', 'Common data structures and their uses', 5, '{"Programming Basics"}', '{"Arrays", "Trees", "Graphs"}'),
  ('Algorithms', 'Algorithm design and analysis', 6, '{"Data Structures"}', '{"Sorting", "Searching", "Complexity"}'),
  ('Cloud Computing', 'Cloud services and deployment', 6, '{"Web Development"}', '{"AWS", "Docker", "Microservices"}')