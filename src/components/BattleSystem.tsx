import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sword, 
  Trophy, 
  Users, 
  Clock, 
  Zap, 
  Crown,
  Shield,
  Target
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BattleRoom from './BattleRoom';

interface BattleSystemProps {
  onClose: () => void;
}

const BattleSystem: React.FC<BattleSystemProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<'lobby' | 'matching' | 'battle' | 'results'>('lobby');
  const [currentBattle, setCurrentBattle] = useState<any>(null);
  const [availableQuizzes, setAvailableQuizzes] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [matchingTime, setMatchingTime] = useState(0);
  const [battleResult, setBattleResult] = useState<'win' | 'lose' | 'draw' | null>(null);

  useEffect(() => {
    fetchAvailableQuizzes();
  }, []);

  useEffect(() => {
    if (gameState === 'matching') {
      const timer = setInterval(() => {
        setMatchingTime(prev => prev + 1);
      }, 1000);

      // Auto-match with AI opponent after 30 seconds
      const autoMatch = setTimeout(() => {
        startAIBattle();
      }, 30000);

      return () => {
        clearInterval(timer);
        clearTimeout(autoMatch);
      };
    }
  }, [gameState]);

  const fetchAvailableQuizzes = async () => {
    try {
      const { data } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_public', true)
        .order('rating', { ascending: false })
        .limit(10);
      
      setAvailableQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching battle quizzes:', error);
    }
  };

  const findMatch = async () => {
    if (!selectedQuiz || !user) return;

    setGameState('matching');
    setMatchingTime(0);

    try {
      // Look for existing battle waiting for players
      const { data: waitingBattles } = await supabase
        .from('battle_rooms')
        .select('*')
        .eq('quiz_id', selectedQuiz.id)
        .eq('status', 'waiting')
        .is('player2_id', null)
        .limit(1);

      if (waitingBattles && waitingBattles.length > 0) {
        // Join existing battle
        const battle = waitingBattles[0];
        const { data: updatedBattle } = await supabase
          .from('battle_rooms')
          .update({
            player2_id: user.id,
            status: 'in_progress'
          })
          .eq('id', battle.id)
          .select()
          .single();

        setCurrentBattle(updatedBattle);
        setGameState('battle');
      } else {
        // Create new battle room
        const { data: newBattle } = await supabase
          .from('battle_rooms')
          .insert({
            player1_id: user.id,
            quiz_id: selectedQuiz.id,
            status: 'waiting'
          })
          .select()
          .single();

        setCurrentBattle(newBattle);
        // Keep matching state, wait for opponent
      }
    } catch (error) {
      console.error('Error finding match:', error);
      setGameState('lobby');
    }
  };

  const startAIBattle = async () => {
    if (!selectedQuiz || !user) return;

    try {
      const { data: aiBattle } = await supabase
        .from('battle_rooms')
        .insert({
          player1_id: user.id,
          player2_id: 'ai-opponent',
          quiz_id: selectedQuiz.id,
          status: 'in_progress'
        })
        .select()
        .single();

      setCurrentBattle(aiBattle);
      setGameState('battle');
    } catch (error) {
      console.error('Error starting AI battle:', error);
    }
  };

  const handleBattleEnd = (result: 'win' | 'lose' | 'draw') => {
    setBattleResult(result);
    setGameState('results');
    
    // Update battle room status
    if (currentBattle) {
      supabase
        .from('battle_rooms')
        .update({ status: 'completed' })
        .eq('id', currentBattle.id);
    }
  };

  const resetBattle = () => {
    setGameState('lobby');
    setCurrentBattle(null);
    setSelectedQuiz(null);
    setBattleResult(null);
    setMatchingTime(0);
  };

  if (gameState === 'battle' && currentBattle && selectedQuiz) {
    return (
      <BattleRoom
        battle={currentBattle}
        quiz={selectedQuiz}
        onBattleEnd={handleBattleEnd}
      />
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
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
              <Sword className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Quiz Battle</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Lobby */}
        {gameState === 'lobby' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-white mb-2">
                Challenge Players Worldwide
              </h3>
              <p className="text-white/70">
                Select a quiz topic and battle other learners in real-time!
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableQuizzes.map((quiz) => (
                <motion.div
                  key={quiz.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedQuiz(quiz)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedQuiz?.id === quiz.id
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : 'bg-white/10 border-white/20 hover:bg-white/20'
                  }`}
                >
                  <h4 className="font-semibold text-white mb-2">{quiz.title}</h4>
                  <p className="text-white/70 text-sm mb-3">{quiz.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      quiz.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      quiz.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {quiz.difficulty}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-white/70">{quiz.rating}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={findMatch}
                disabled={!selectedQuiz}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
              >
                <Sword className="w-5 h-5" />
                <span>Find Battle</span>
              </button>
            </div>
          </div>
        )}

        {/* Matching */}
        {gameState === 'matching' && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Finding Opponent...
              </h3>
              <p className="text-white/70">
                Matching you with players of similar skill level
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-5 h-5 text-white/70" />
              <span className="text-white/70">
                {Math.floor(matchingTime / 60)}:{(matchingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="space-y-2">
              <div className="animate-pulse text-blue-400">●</div>
              <div className="animate-pulse text-purple-400" style={{ animationDelay: '0.5s' }}>●</div>
              <div className="animate-pulse text-pink-400" style={{ animationDelay: '1s' }}>●</div>
            </div>

            <div className="flex space-x-4 justify-center">
              <button
                onClick={startAIBattle}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-2 rounded-lg font-semibold"
              >
                Battle AI
              </button>
              <button
                onClick={resetBattle}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-semibold border border-white/20"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {gameState === 'results' && (
          <div className="text-center space-y-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
              battleResult === 'win' ? 'bg-gradient-to-br from-green-400 to-emerald-600' :
              battleResult === 'lose' ? 'bg-gradient-to-br from-red-400 to-pink-600' :
              'bg-gradient-to-br from-yellow-400 to-orange-600'
            }`}>
              {battleResult === 'win' ? (
                <Crown className="w-10 h-10 text-white" />
              ) : battleResult === 'lose' ? (
                <Shield className="w-10 h-10 text-white" />
              ) : (
                <Target className="w-10 h-10 text-white" />
              )}
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {battleResult === 'win' ? 'Victory!' : 
                 battleResult === 'lose' ? 'Defeat!' : 'Draw!'}
              </h3>
              <p className="text-white/70">
                {battleResult === 'win' ? 'Great job! You outperformed your opponent.' :
                 battleResult === 'lose' ? 'Good effort! Challenge them again to improve.' :
                 'Evenly matched! Try another battle.'}
              </p>
            </div>

            <div className="flex space-x-4 justify-center">
              <button
                onClick={resetBattle}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
                Battle Again
              </button>
              <button
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-semibold border border-white/20"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BattleSystem;