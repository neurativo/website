import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { SubscriptionPlan, UserSubscription, UsageStats } from '../types/subscription';

interface SubscriptionContextType {
  currentPlan: SubscriptionPlan | null;
  userSubscription: UserSubscription | null;
  usageStats: UsageStats | null;
  loading: boolean;
  canCreateQuiz: () => boolean;
  canUseAI: () => boolean;
  getRemainingQuizzes: () => number;
  getRemainingAI: () => number;
  refreshUsage: () => Promise<void>;
  upgradePlan: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Default plans
const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'monthly',
    description: 'Perfect for getting started',
    features: [
      '5 quizzes per day',
      'Basic AI quiz generation',
      'Standard support',
      'Basic analytics'
    ],
    limits: {
      quizzesPerDay: 5,
      quizzesPerMonth: 50,
      aiGenerations: 10,
      customQuizzes: 3,
      prioritySupport: false,
      advancedAnalytics: false,
      exportData: false
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    currency: 'USD',
    interval: 'monthly',
    description: 'For serious learners',
    popular: true,
    features: [
      'Unlimited quizzes per day',
      'Advanced AI features',
      'Priority support',
      'Advanced analytics',
      'Export data',
      'Custom quiz creation'
    ],
    limits: {
      quizzesPerDay: -1, // unlimited
      quizzesPerMonth: -1, // unlimited
      aiGenerations: 100,
      customQuizzes: 50,
      prioritySupport: true,
      advancedAnalytics: true,
      exportData: true
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29.99,
    currency: 'USD',
    interval: 'monthly',
    description: 'For teams and organizations',
    features: [
      'Everything in Pro',
      'Team management',
      'API access',
      'White-label options',
      'Dedicated support',
      'Custom integrations'
    ],
    limits: {
      quizzesPerDay: -1,
      quizzesPerMonth: -1,
      aiGenerations: -1,
      customQuizzes: -1,
      prioritySupport: true,
      advancedAnalytics: true,
      exportData: true
    }
  }
];

const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    } else {
      setCurrentPlan(DEFAULT_PLANS[0]); // Free plan for non-users
      setLoading(false);
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    if (!user) return;

    try {
      // Fetch user subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      // Fetch usage stats
      const { data: usage } = await supabase
        .from('usage_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subscription) {
        setUserSubscription(subscription);
        const plan = DEFAULT_PLANS.find(p => p.id === subscription.plan_id) || DEFAULT_PLANS[0];
        setCurrentPlan(plan);
      } else {
        setCurrentPlan(DEFAULT_PLANS[0]); // Free plan
      }

      if (usage) {
        setUsageStats(usage);
      } else {
        // Initialize usage stats
        const newUsage: UsageStats = {
          quizzes_today: 0,
          quizzes_this_month: 0,
          ai_generations_used: 0,
          custom_quizzes_created: 0,
          last_reset_date: new Date().toISOString()
        };
        setUsageStats(newUsage);
        
        await supabase.from('usage_stats').insert({
          user_id: user.id,
          ...newUsage
        });
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setCurrentPlan(DEFAULT_PLANS[0]);
    } finally {
      setLoading(false);
    }
  };

  const canCreateQuiz = (): boolean => {
    if (!currentPlan || !usageStats) return false;
    
    if (currentPlan.limits.quizzesPerDay === -1) return true; // unlimited
    
    return usageStats.quizzes_today < currentPlan.limits.quizzesPerDay;
  };

  const canUseAI = (): boolean => {
    if (!currentPlan || !usageStats) return false;
    
    if (currentPlan.limits.aiGenerations === -1) return true; // unlimited
    
    return usageStats.ai_generations_used < currentPlan.limits.aiGenerations;
  };

  const getRemainingQuizzes = (): number => {
    if (!currentPlan || !usageStats) return 0;
    
    if (currentPlan.limits.quizzesPerDay === -1) return -1; // unlimited
    
    return Math.max(0, currentPlan.limits.quizzesPerDay - usageStats.quizzes_today);
  };

  const getRemainingAI = (): number => {
    if (!currentPlan || !usageStats) return 0;
    
    if (currentPlan.limits.aiGenerations === -1) return -1; // unlimited
    
    return Math.max(0, currentPlan.limits.aiGenerations - usageStats.ai_generations_used);
  };

  const refreshUsage = async () => {
    await fetchSubscriptionData();
  };

  const upgradePlan = async (planId: string) => {
    // This would integrate with a payment processor like Stripe
    // For now, we'll just update the subscription in the database
    if (!user) return;

    try {
      const plan = DEFAULT_PLANS.find(p => p.id === planId);
      if (!plan) throw new Error('Invalid plan');

      const subscriptionData = {
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        cancel_at_period_end: false
      };

      const { error } = await supabase
        .from('user_subscriptions')
        .upsert(subscriptionData);

      if (error) throw error;

      await fetchSubscriptionData();
    } catch (error) {
      console.error('Error upgrading plan:', error);
      throw error;
    }
  };

  const cancelSubscription = async () => {
    if (!user || !userSubscription) return;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          cancel_at_period_end: true,
          status: 'canceled'
        })
        .eq('id', userSubscription.id);

      if (error) throw error;

      await fetchSubscriptionData();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      currentPlan,
      userSubscription,
      usageStats,
      loading,
      canCreateQuiz,
      canUseAI,
      getRemainingQuizzes,
      getRemainingAI,
      refreshUsage,
      upgradePlan,
      cancelSubscription
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export { useSubscription, SubscriptionProvider }; 