import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  ThumbsUp, 
  ThumbsDown, 
  Edit3, 
  Send,
  Trophy,
  Star,
  MessageSquare,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';

interface UserExplanation {
  id: string;
  question_id: string;
  user_id: string;
  explanation: string;
  is_approved: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  user: {
    username: string;
    avatar?: string;
  };
  user_vote?: 'up' | 'down';
}

interface ExplainToEarnProps {
  questionId: string;
  question: string;
  correctAnswer: string;
  onClose: () => void;
}

const ExplainToEarn: React.FC<ExplainToEarnProps> = ({ 
  questionId, 
  question, 
  correctAnswer, 
  onClose 
}) => {
  const { user } = useAuth();
  const { addXP } = useGame();
  const [explanations, setExplanations] = useState<UserExplanation[]>([]);
  const [newExplanation, setNewExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular');

  useEffect(() => {
    fetchExplanations();
  }, [questionId, sortBy]);

  const fetchExplanations = async () => {
    try {
      let query = supabase
        .from('user_explanations')
        .select(`
          *,
          users (username, avatar)
        `)
        .eq('question_id', questionId);

      if (sortBy === 'popular') {
        query = query.order('upvotes', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data: explanationData } = await query;

      if (explanationData) {
        // Get user votes if logged in
        if (user) {
          const explanationIds = explanationData.map(e => e.id);
          const { data: votes } = await supabase
            .from('explanation_votes')
            .select('explanation_id, vote_type')
            .eq('user_id', user.id)
            .in('explanation_id', explanationIds);

          const voteMap = new Map(votes?.map(v => [v.explanation_id, v.vote_type]) || []);
          
          const explanationsWithVotes = explanationData.map(exp => ({
            ...exp,
            user_vote: voteMap.get(exp.id)
          }));

          setExplanations(explanationsWithVotes);
        } else {
          setExplanations(explanationData);
        }
      }
    } catch (error) {
      console.error('Error fetching explanations:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitExplanation = async () => {
    if (!user || !newExplanation.trim()) return;

    setIsSubmitting(true);
    try {
      const { data } = await supabase
        .from('user_explanations')
        .insert({
          question_id: questionId,
          user_id: user.id,
          explanation: newExplanation.trim()
        })
        .select(`
          *,
          users (username, avatar)
        `)
        .single();

      if (data) {
        setExplanations([data, ...explanations]);
        setNewExplanation('');
        
        // Award XP for contributing
        await addXP(25);
      }
    } catch (error) {
      console.error('Error submitting explanation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const voteExplanation = async (explanationId: string, voteType: 'up' | 'down') => {
    if (!user) return;

    try {
      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from('explanation_votes')
        .select('*')
        .eq('explanation_id', explanationId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote
          await supabase
            .from('explanation_votes')
            .delete()
            .eq('id', existingVote.id);
        } else {
          // Update vote
          await supabase
            .from('explanation_votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
        }
      } else {
        // Create new vote
        await supabase
          .from('explanation_votes')
          .insert({
            explanation_id: explanationId,
            user_id: user.id,
            vote_type: voteType
          });
      }

      // Refresh explanations to update vote counts
      await fetchExplanations();
    } catch (error) {
      console.error('Error voting on explanation:', error);
    }
  };

  const getVoteButtonStyle = (explanation: UserExplanation, voteType: 'up' | 'down') => {
    const isActive = explanation.user_vote === voteType;
    const baseStyle = 'p-2 rounded-lg transition-colors';
    
    if (voteType === 'up') {
      return `${baseStyle} ${
        isActive 
          ? 'bg-green-500/20 text-green-400' 
          : 'bg-white/10 text-white/70 hover:bg-green-500/10 hover:text-green-400'
      }`;
    } else {
      return `${baseStyle} ${
        isActive 
          ? 'bg-red-500/20 text-red-400' 
          : 'bg-white/10 text-white/70 hover:bg-red-500/10 hover:text-red-400'
      }`;
    }
  };

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
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Community Explanations</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Question */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">Question</h3>
          <p className="text-white/80 mb-3">{question}</p>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">Correct Answer:</span>
            <span className="text-white">{correctAnswer}</span>
          </div>
        </div>

        {/* Add Explanation */}
        {user && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-3">Add Your Explanation</h3>
            <textarea
              value={newExplanation}
              onChange={(e) => setNewExplanation(e.target.value)}
              placeholder="Help others understand by explaining this answer in your own words..."
              className="w-full h-24 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2 text-sm text-white/70">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>Earn 25 XP for contributing</span>
              </div>
              <button
                onClick={submitExplanation}
                disabled={!newExplanation.trim() || isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Submit</span>
              </button>
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Community Explanations ({explanations.length})
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSortBy('popular')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'popular' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/20 text-white/70 hover:bg-white/30'
              }`}
            >
              Most Popular
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'recent' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/20 text-white/70 hover:bg-white/30'
              }`}
            >
              Most Recent
            </button>
          </div>
        </div>

        {/* Explanations List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : explanations.length > 0 ? (
            explanations.map((explanation) => (
              <div
                key={explanation.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {explanation.user.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">
                          {explanation.user.username}
                        </span>
                        {explanation.is_approved && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <div className="text-xs text-white/70">
                        {new Date(explanation.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-white/70">
                        {explanation.upvotes - explanation.downvotes}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-white/90 mb-4 leading-relaxed">
                  {explanation.explanation}
                </p>

                {user && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => voteExplanation(explanation.id, 'up')}
                      className={getVoteButtonStyle(explanation, 'up')}
                    >
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm">{explanation.upvotes}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => voteExplanation(explanation.id, 'down')}
                      className={getVoteButtonStyle(explanation, 'down')}
                    >
                      <div className="flex items-center space-x-1">
                        <ThumbsDown className="w-4 h-4" />
                        <span className="text-sm">{explanation.downvotes}</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Explanations Yet
              </h3>
              <p className="text-white/70 mb-4">
                Be the first to help others understand this question!
              </p>
              {!user && (
                <p className="text-white/50 text-sm">
                  Sign in to contribute explanations and earn XP
                </p>
              )}
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-6 p-4 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="text-sm">
                <strong>Help the community learn!</strong> Share your knowledge and earn XP. 
                The best explanations get upvoted and help others understand better.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExplainToEarn;