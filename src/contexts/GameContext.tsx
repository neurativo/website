import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface GameStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  totalQuizzes: number;
  totalCorrect: number;
  averageScore: number;
  achievements: string[];
  totalQuestions: number; // Added for accurate progress
}

interface GameContextType {
  stats: GameStats;
  loading: boolean;
  addXP: (amount: number) => Promise<void>;
  updateStreak: (correct: boolean) => Promise<void>;
  completeQuiz: (score: number, totalQuestions: number) => Promise<void>;
  refreshStats: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

const calculateLevel = (xp: number) => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

const calculateXPToNextLevel = (xp: number) => {
  const currentLevel = calculateLevel(xp);
  const nextLevelXP = Math.pow(currentLevel, 2) * 100;
  return nextLevelXP - xp;
};

const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<GameStats>({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    streak: 0,
    totalQuizzes: 0,
    totalCorrect: 0,
    averageScore: 0,
    achievements: [],
    totalQuestions: 0, // Added for accurate progress
  });
  const [loading, setLoading] = useState(true);

  const refreshStats = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setStats({
        level: calculateLevel(data.total_xp),
        xp: data.total_xp,
        xpToNextLevel: calculateXPToNextLevel(data.total_xp),
        streak: data.current_streak,
        totalQuizzes: data.total_quizzes,
        totalCorrect: data.total_correct,
        averageScore: data.total_quizzes > 0 ? (data.total_correct / data.total_questions) * 100 : 0,
        achievements: data.achievements || [],
        totalQuestions: data.total_questions || 0, // Added for accurate progress
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      refreshStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const addXP = async (amount: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        total_xp: stats.xp + amount,
        current_streak: stats.streak,
        total_quizzes: stats.totalQuizzes,
        total_correct: stats.totalCorrect,
        total_questions: stats.totalQuestions,
        achievements: stats.achievements,
      });

    if (!error) {
      setStats(prev => ({
        ...prev,
        xp: prev.xp + amount,
        level: calculateLevel(prev.xp + amount),
        xpToNextLevel: calculateXPToNextLevel(prev.xp + amount),
      }));
    }
  };

  const updateStreak = async (correct: boolean) => {
    if (!user) return;

    const newStreak = correct ? stats.streak + 1 : 0;
    const { error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        total_xp: stats.xp,
        current_streak: newStreak,
        total_quizzes: stats.totalQuizzes,
        total_correct: stats.totalCorrect,
        total_questions: stats.totalQuestions,
        achievements: stats.achievements,
      });

    if (!error) {
      setStats(prev => ({ ...prev, streak: newStreak }));
    }
  };

  const completeQuiz = async (score: number, totalQuestions: number) => {
    if (!user) return;

    const correctAnswers = Math.round((score / 100) * totalQuestions);
    const newTotalQuizzes = stats.totalQuizzes + 1;
    const newTotalCorrect = stats.totalCorrect + correctAnswers;
    const newTotalQuestions = stats.totalQuestions + totalQuestions;
    const newAverageScore = newTotalQuizzes > 0 ? (newTotalCorrect / newTotalQuestions) * 100 : 0;

    const { error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        total_xp: stats.xp,
        current_streak: stats.streak,
        total_quizzes: newTotalQuizzes,
        total_correct: newTotalCorrect,
        total_questions: newTotalQuestions,
        achievements: stats.achievements,
      });

    if (!error) {
      setStats(prev => ({
        ...prev,
        totalQuizzes: newTotalQuizzes,
        totalCorrect: newTotalCorrect,
        totalQuestions: newTotalQuestions,
        averageScore: newAverageScore,
      }));
    }
  };

  return (
    <GameContext.Provider value={{
      stats,
      loading,
      addXP,
      updateStreak,
      completeQuiz,
      refreshStats,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export { useGame, GameProvider };