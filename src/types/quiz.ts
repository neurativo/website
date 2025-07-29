export interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correct_answer: string | string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  time_limit?: number;
  hints?: string[];
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt?: string;
  };
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  estimated_time: number;
  created_at: string;
  created_by: string;
  tags: string[];
  is_public: boolean;
  rating: number;
  attempts: number;
  ai_generated: boolean;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  time_taken: number;
  answers: QuizAnswer[];
  completed_at: string;
  mistakes: string[];
  strengths: string[];
}

export interface QuizAnswer {
  question_id: string;
  user_answer: string | string[];
  is_correct: boolean;
  time_taken: number;
  hints_used: number;
}

export interface BattleRoom {
  id: string;
  player1_id: string;
  player2_id: string;
  quiz_id: string;
  status: 'waiting' | 'in_progress' | 'completed';
  player1_score: number;
  player2_score: number;
  current_question: number;
  created_at: string;
}

export interface LearningPath {
  id: string;
  user_id: string;
  title: string;
  description: string;
  goal: string;
  target_date: string;
  topics: string[];
  recommended_quizzes: string[];
  progress: number;
  created_at: string;
}

export interface KnowledgeNode {
  id: string;
  topic: string;
  description: string;
  difficulty: number;
  prerequisites: string[];
  related_topics: string[];
  quizzes: string[];
  mastery_level: number;
}