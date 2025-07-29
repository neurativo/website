import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Crown, Users, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { SubscriptionPlan } from '../types/subscription';
import { Link } from 'react-router-dom';

const Pricing = () => {
  const { user } = useAuth();
  const { currentPlan, upgradePlan } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: 'USD',
      interval: 'monthly',
      description: 'Perfect for getting started with AI-powered learning',
      features: [
        '5 quizzes per day',
        'Basic AI quiz generation',
        'Standard support',
        'Basic analytics',
        'Access to quiz library',
        'Mobile responsive'
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
      price: billingInterval === 'monthly' ? 9.99 : 99.99,
      currency: 'USD',
      interval: billingInterval,
      description: 'For serious learners who want unlimited access',
      popular: true,
      features: [
        'Unlimited quizzes per day',
        'Advanced AI features',
        'Priority support',
        'Advanced analytics',
        'Export data',
        'Custom quiz creation',
        'Progress tracking',
        'Performance insights'
      ],
      limits: {
        quizzesPerDay: -1,
        quizzesPerMonth: -1,
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
      price: billingInterval === 'monthly' ? 29.99 : 299.99,
      currency: 'USD',
      interval: billingInterval,
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Team management',
        'API access',
        'White-label options',
        'Dedicated support',
        'Custom integrations',
        'Advanced reporting',
        'SSO integration'
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

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      // Redirect to login
      return;
    }

    setLoading(planId);
    try {
      await upgradePlan(planId);
    } catch (error) {
      console.error('Error upgrading plan:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Plan
            </span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Start free and upgrade as you grow. All plans include our core AI-powered learning features.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${billingInterval === 'monthly' ? 'text-white' : 'text-white/60'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${billingInterval === 'yearly' ? 'text-white' : 'text-white/60'}`}>
              Yearly
              <span className="ml-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border ${
                plan.popular 
                  ? 'border-purple-500/50 shadow-lg shadow-purple-500/20' 
                  : 'border-white/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  {plan.id === 'free' && <Sparkles className="w-8 h-8 text-blue-400 mr-3" />}
                  {plan.id === 'pro' && <Zap className="w-8 h-8 text-purple-400 mr-3" />}
                  {plan.id === 'enterprise' && <Crown className="w-8 h-8 text-yellow-400 mr-3" />}
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                </div>
                <p className="text-white/70 mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-white/60 ml-2">
                      /{billingInterval === 'monthly' ? 'month' : 'year'}
                    </span>
                  )}
                </div>

                {currentPlan?.id === plan.id ? (
                  <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading === plan.id}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    {loading === plan.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        {plan.price === 0 ? 'Get Started' : 'Upgrade Now'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-semibold mb-4">What's included:</h4>
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-white/80 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="text-white font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-white/70">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="text-left">
              <h3 className="text-white font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-white/70">Yes! Start with our free plan and upgrade when you need more features.</p>
            </div>
            <div className="text-left">
              <h3 className="text-white font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-white/70">We accept all major credit cards, PayPal, and Apple Pay.</p>
            </div>
            <div className="text-left">
              <h3 className="text-white font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-white/70">Absolutely! Cancel your subscription anytime with no cancellation fees.</p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to start learning smarter?
          </h2>
          <p className="text-white/70 mb-8">
            Join thousands of learners who are already using AI to master new subjects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/create">
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200">
                Start Creating Quizzes
              </button>
            </Link>
            <Link to="/library">
              <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-semibold border border-white/20 transition-all duration-200">
                Browse Quiz Library
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Pricing; 