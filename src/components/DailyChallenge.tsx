import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Trophy, 
  Clock, 
  Zap, 
  Target,
  Crown,
  Gift,
  Calendar,
  Users,
  TrendingUp,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';

interface DailyChallenge {
  id: string;
  date: string;
  quiz_id: string;
  difficulty: string;
  bonus_xp: number;
  participants: number;
  avg_score: number;
  quiz: {
    title: string;
    description: string;
    questions: any[];
  };
}

interface DailyChallengeProps {
  onClose: () => void;
  onStartQuiz: (quizId: string) => void;
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({ onClose, onStartQuiz }) => {
  const { user } = useAuth();
  const { addXP } = useGame();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [hasParticipated, setHasParticipated] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchDailyChallenge();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDailyChallenge = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's challenge
      const { data: challengeData, error } = await supabase
        .from('daily_challenges')
        .select(`
          *,
          quizzes (
            id,
            title,
            description,
            questions
          )
        `)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (challengeData) {
        setChallenge(challengeData);
        
        // Check if user has already participated
        if (user) {
          const { data: attemptData } = await supabase
            .from('daily_challenge_attempts')
            .select('*')
            .eq('challenge_id', challengeData.id)
            .eq('user_id', user.id)
            .single();

          if (attemptData) {
            setHasParticipated(true);
            setUserScore(attemptData.score);
          }
        }

        // Fetch leaderboard
        const { data: leaderboardData } = await supabase
          .from('daily_challenge_attempts')
          .select(`
            *,
            users (username, avatar)
          `)
          .eq('challenge_id', challengeData.id)
          .order('score', { ascending: false })
          .limit(10);

        setLeaderboard(leaderboardData || []);
      } else {
        // Create today's challenge if it doesn't exist
        await createDailyChallenge();
      }
    } catch (error) {
      console.error('Error fetching daily challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDailyChallenge = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get a random quiz
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_public', true)
        .order('rating', { ascending: false })
        .limit(20);

      if (quizzes && quizzes.length > 0) {
        const randomQuiz = quizzes[Math.floor(Math.random() * quizzes.length)];
        const bonusXP = randomQuiz.difficulty === 'hard' ? 100 : 
                      randomQuiz.difficulty === 'medium' ? 75 : 50;

        const { data: newChallenge } = await supabase
          .from('daily_challenges')
          .insert({
            date: today,
            quiz_id: randomQuiz.id,
            difficulty: randomQuiz.difficulty,
            bonus_xp: bonusXP
          })
          .select(`
            *,
            quizzes (
              id,
              title,
              description,
              questions
            )
          `)
          .single();

        if (newChallenge) {
          setChallenge(newChallenge);
        }
      }
    } catch (error) {
      console.error('Error creating daily challenge:', error);
    }
  };

  const updateTimeLeft = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeDiff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  const startChallenge = () => {
    if (challenge) {
      setIsPlaying(true);
      onStartQuiz(challenge.quiz_id);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'hard': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2: return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3: return <Trophy className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 text-center text-white/70">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-white/20 text-center"
        >
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Challenge Today
          </h3>
          <p className="text-white/70 mb-6">
            Today's challenge is being prepared. Check back later!
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-4xl w-full border border-white/20 max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Daily Challenge</h2>
              <p className="text-white/70 text-sm">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Challenge Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Today's Challenge</h3>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-white/70" />
                <span className="text-sm text-white/70">Ends in: {timeLeft}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-white mb-1">{challenge.quiz.title}</h4>
                <p className="text-sm text-white/70">{challenge.quiz.description}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty}
                </div>
                <div className="flex items-center space-x-1 text-sm text-white/70">
                  <Target className="w-4 h-4" />
                  <span>{challenge.quiz.questions?.length || 0} questions</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-white/70">
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400">+{challenge.bonus_xp} Bonus XP</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{challenge.participants} participants</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {hasParticipated ? (
                <div className="text-center">
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {userScore.toFixed(1)}%
                    </div>
                    <div className="text-sm text-white/70">Your Score</div>
                  </div>
                  <div className="bg-green-500/20 text-green-400 py-2 px-4 rounded-lg border border-green-500/30">
                    Challenge Completed! Come back tomorrow for a new challenge.
                  </div>
                </div>
              ) : (
                <button
                  onClick={startChallenge}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center space-x-2"
                >
                  <Gift className="w-5 h-5" />
                  <span>Start Challenge</span>
                </button>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Today's Leaderboard
            </h3>
            
            <div className="space-y-3">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.user_id === user?.id 
                        ? 'bg-blue-500/20 border border-blue-500/30' 
                        : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {getRankIcon(index + 1)}
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {entry.users?.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span className="text-white font-medium">
                          {entry.users?.username || 'Anonymous'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{entry.score.toFixed(1)}%</div>
                      <div className="text-xs text-white/70">
                        {Math.round(entry.time_taken)}s
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/70">
                    Be the first to complete today's challenge!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {challenge.participants}
            </div>
            <div className="text-sm text-white/70">Participants</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {challenge.avg_score.toFixed(1)}%
            </div>
            <div className="text-sm text-white/70">Average Score</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              +{challenge.bonus_xp}
            </div>
            <div className="text-sm text-white/70">Bonus XP</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {challenge.quiz.questions?.length || 0}
            </div>
            <div className="text-sm text-white/70">Questions</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DailyChallenge;