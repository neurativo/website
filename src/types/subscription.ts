export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    quizzesPerDay: number;
    quizzesPerMonth: number;
    aiGenerations: number;
    customQuizzes: number;
    prioritySupport: boolean;
    advancedAnalytics: boolean;
    exportData: boolean;
  };
  popular?: boolean;
  description: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  quizzes_today: number;
  quizzes_this_month: number;
  ai_generations_used: number;
  custom_quizzes_created: number;
  last_reset_date: string;
} 