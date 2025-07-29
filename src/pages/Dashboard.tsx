import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Target, Clock, Brain, Award, Calendar, Zap, BookOpen, Users, Trophy, Map, Lightbulb, Star, Sword, Mic, Cuboid as Cube, MessageSquare, Settings, Plus, Play, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../lib/supabase';
import KnowledgeGraph from '../components/KnowledgeGraph';
import LearningPathPlanner from '../components/LearningPathPlanner';
import BattleSystem from '../components/BattleSystem';
import DailyChallenge from '../components/DailyChallenge';
import ExplainToEarn from '../components/ExplainToEarn';
import VoiceInput from '../components/VoiceInput';
import ARLearning from '../components/ARLearning';

interface QuizStats {
  total_quizzes: number;
  total_correct: number;
  total_questions: number;
  avg_score: number;
  best_streak: number;
  recent_performance: { date: string; score: number; }[];
  weak_areas: { topic: string; accuracy: number; }[];
  strong_areas: { topic: string; accuracy: number; }[];
  time_spent: number;
  categories: { category: string; count: number; score: number; }[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const { stats } = useGame();
  const { currentPlan, usageStats, getRemainingQuizzes, getRemainingAI } = useSubscription();
  const [quizStats, setQuizStats] = useState<QuizStats | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch detailed quiz statistics
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes (title, category, difficulty)
        `)
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false });

      if (attempts) {
        const stats = calculateStats(attempts);
        setQuizStats(stats);
        setRecentActivity(attempts.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (attempts: any[]): QuizStats => {
    const totalQuizzes = attempts.length;
    const totalCorrect = attempts.reduce((sum, attempt) => {
      return sum + attempt.answers.filter((a: any) => a.is_correct).length;
    }, 0);
    const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.answers.length, 0);
    const avgScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    
    // Calculate performance over time
    const recentPerformance = attempts.slice(0, 7).map(attempt => ({
      date: new Date(attempt.completed_at).toLocaleDateString(),
      score: attempt.score
    }));

    // Calculate weak and strong areas
    const topicStats = new Map();
    attempts.forEach(attempt => {
      const category = attempt.quizzes?.category || 'General';
      if (!topicStats.has(category)) {
        topicStats.set(category, { correct: 0, total: 0 });
      }
      const stats = topicStats.get(category);
      stats.total += attempt.answers.length;
      stats.correct += attempt.answers.filter((a: any) => a.is_correct).length;
    });

    const areas = Array.from(topicStats.entries()).map(([topic, stats]) => ({
      topic,
      accuracy: (stats.correct / stats.total) * 100
    }));

    const weakAreas = areas.filter(area => area.accuracy < 70).sort((a, b) => a.accuracy - b.accuracy);
    const strongAreas = areas.filter(area => area.accuracy >= 80).sort((a, b) => b.accuracy - a.accuracy);

    // Calculate categories
    const categories = Array.from(topicStats.entries()).map(([category, stats]) => ({
      category,
      count: attempts.filter(a => a.quizzes?.category === category).length,
      score: (stats.correct / stats.total) * 100
    }));

    return {
      total_quizzes: totalQuizzes,
      total_correct: totalCorrect,
      total_questions: totalQuestions,
      avg_score: avgScore,
      best_streak: 0,
      recent_performance: recentPerformance,
      weak_areas: weakAreas,
      strong_areas: strongAreas,
      time_spent: attempts.reduce((sum, attempt) => sum + (attempt.time_taken || 0), 0),
      categories
    };
  };

  const dashboardFeatures = [
    {
      id: 'knowledge-graph',
      title: 'Knowledge Graph',
      description: 'Visualize your learning connections',
      icon: Brain,
      color: 'from-purple-400 to-pink-600',
      component: KnowledgeGraph
    },
    {
      id: 'learning-paths',
      title: 'Learning Paths',
      description: 'Plan your study journey',
      icon: Map,
      color: 'from-blue-400 to-cyan-600',
      component: LearningPathPlanner
    },
    {
      id: 'quiz-battles',
      title: 'Quiz Battles',
      description: 'Challenge other learners',
      icon: Sword,
      color: 'from-red-400 to-pink-600',
      component: BattleSystem
    },
    {
      id: 'daily-challenge',
      title: 'Daily Challenge',
      description: 'Today\'s mystery quiz',
      icon: Star,
      color: 'from-yellow-400 to-orange-500',
      component: DailyChallenge
    },
    {
      id: 'explain-to-earn',
      title: 'Explain to Earn',
      description: 'Help others and earn XP',
      icon: Lightbulb,
      color: 'from-green-400 to-emerald-600',
      component: ExplainToEarn
    },
    {
      id: 'voice-input',
      title: 'Voice Quizzes',
      description: 'Answer with your voice',
      icon: Mic,
      color: 'from-indigo-400 to-purple-600',
      component: VoiceInput
    },
    {
      id: 'ar-learning',
      title: 'AR Learning',
      description: '3D interactive experiences',
      icon: Cube,
      color: 'from-teal-400 to-blue-600',
      component: ARLearning
    }
  ];

  const openModal = (modalId: string) => {
    setActiveModal(modalId);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const renderModal = () => {
    if (!activeModal) return null;

    const feature = dashboardFeatures.find(f => f.id === activeModal);
    if (!feature) return null;

    const Component = feature.component;

    // Handle different component props
    const getComponentProps = () => {
      switch (activeModal) {
        case 'knowledge-graph':
          return { onClose: closeModal };
        case 'learning-paths':
          return { onClose: closeModal };
        case 'quiz-battles':
          return { onClose: closeModal };
        case 'daily-challenge':
          return { onClose: closeModal, onStartQuiz: (quizId: string) => console.log('Start quiz:', quizId) };
        case 'explain-to-earn':
          return { 
            onClose: closeModal,
            questionId: 'sample-question-id',
            question: 'What is React?',
            correctAnswer: 'A JavaScript library for building user interfaces'
          };
        case 'voice-input':
          return {
            onClose: closeModal,
            onVoiceInput: (text: string) => console.log('Voice input:', text),
            question: 'What is the capital of France?'
          };
        case 'ar-learning':
          return {
            onClose: closeModal,
            concept: 'JavaScript'
          };
        default:
          return { onClose: closeModal };
      }
    };

    return <Component {...getComponentProps()} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 md:mb-8"
        >
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
            Learning Dashboard
          </h1>
          <p className="text-white/70 text-sm md:text-base">
            Your complete learning command center
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl md:text-2xl font-bold text-white">{stats.level}</p>
                <p className="text-xs md:text-sm text-white/70">Level</p>
              </div>
              <Trophy className="w-6 md:w-8 h-6 md:h-8 text-yellow-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl md:text-2xl font-bold text-white">{stats.totalQuizzes}</p>
                <p className="text-xs md:text-sm text-white/70">Quizzes</p>
              </div>
              <BookOpen className="w-6 md:w-8 h-6 md:h-8 text-blue-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl md:text-2xl font-bold text-white">{stats.averageScore.toFixed(1)}%</p>
                <p className="text-xs md:text-sm text-white/70">Avg Score</p>
              </div>
              <Target className="w-6 md:w-8 h-6 md:h-8 text-green-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl md:text-2xl font-bold text-white">{stats.streak}</p>
                <p className="text-xs md:text-sm text-white/70">Streak</p>
              </div>
              <Zap className="w-6 md:w-8 h-6 md:h-8 text-orange-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl md:text-2xl font-bold text-white">{stats.totalCorrect}/{stats.totalQuestions}</p>
                <p className="text-xs md:text-sm text-white/70">Questions Answered</p>
              </div>
              <Brain className="w-6 md:w-8 h-6 md:h-8 text-purple-400" />
            </div>
          </motion.div>
        </div>

        {/* Subscription Info */}
        {currentPlan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-6 md:mb-8"
          >
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Your Plan: {currentPlan.name}</h2>
                {currentPlan.id !== 'free' && (
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                    Active
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Daily Quizzes</h3>
                  <p className="text-2xl font-bold text-blue-400">
                    {getRemainingQuizzes() === -1 ? '∞' : getRemainingQuizzes()}
                  </p>
                  <p className="text-white/60 text-sm">
                    {currentPlan.limits.quizzesPerDay === -1 ? 'Unlimited' : `${currentPlan.limits.quizzesPerDay} per day`}
                  </p>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">AI Generations</h3>
                  <p className="text-2xl font-bold text-purple-400">
                    {getRemainingAI() === -1 ? '∞' : getRemainingAI()}
                  </p>
                  <p className="text-white/60 text-sm">
                    {currentPlan.limits.aiGenerations === -1 ? 'Unlimited' : `${currentPlan.limits.aiGenerations} per month`}
                  </p>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Custom Quizzes</h3>
                  <p className="text-2xl font-bold text-green-400">
                    {currentPlan.limits.customQuizzes === -1 ? '∞' : currentPlan.limits.customQuizzes}
                  </p>
                  <p className="text-white/60 text-sm">
                    {currentPlan.limits.customQuizzes === -1 ? 'Unlimited' : `${currentPlan.limits.customQuizzes} per month`}
                  </p>
                </div>
              </div>
              
              {currentPlan.id === 'free' && (
                <div className="mt-4 text-center">
                  <Link to="/pricing" className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Dashboard Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-6 md:mb-8"
        >
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Learning Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {dashboardFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group cursor-pointer"
                onClick={() => openModal(feature.id)}
              >
                <div className={`w-10 md:w-12 h-10 md:h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-5 md:w-6 h-5 md:h-6 text-white" />
                </div>
                <h3 className="text-sm md:text-lg font-semibold text-white mb-1 md:mb-2 group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-white/70 text-xs md:text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Performance Overview */}
        <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
          {/* Recent Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20"
          >
            <h3 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Performance Overview
            </h3>
            
            <div className="space-y-4">
              {quizStats?.recent_performance.map((perf, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-white/70 text-xs md:text-sm">{perf.date}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 md:w-32 bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                        style={{ width: `${perf.score}%` }}
                      />
                    </div>
                    <span className="text-white font-medium text-xs md:text-sm">{perf.score.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20"
          >
            <h3 className="text-lg md:text-xl font-semibold text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.map((attempt, index) => (
                <div key={index} className="flex items-center justify-between p-2 md:p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white font-medium text-sm md:text-base">{attempt.quizzes?.title}</p>
                    <p className="text-white/70 text-xs md:text-sm">{attempt.quizzes?.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      attempt.score >= 70 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {attempt.score.toFixed(1)}%
                    </p>
                    <p className="text-white/70 text-xs md:text-sm">
                      {new Date(attempt.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-white/70 text-center py-6 md:py-8 text-sm">
                  No recent activity. Start taking quizzes to see your progress!
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Render Active Modal */}
        {renderModal()}
      </div>
    </div>
  );
};

export default Dashboard;