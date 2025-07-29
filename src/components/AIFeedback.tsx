import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, MessageCircle, Lightbulb, RefreshCw } from 'lucide-react';
import { aiService } from '../lib/ai';

interface AIFeedbackProps {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  onClose: () => void;
}

const AIFeedback: React.FC<AIFeedbackProps> = ({
  question,
  userAnswer,
  correctAnswer,
  explanation,
  onClose
}) => {
  const [simpleExplanation, setSimpleExplanation] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const getSimpleExplanation = async () => {
    setLoading(true);
    try {
      const response = await aiService.generateExplanation(
        question,
        userAnswer,
        correctAnswer,
        true
      );
      setSimpleExplanation(response.content);
    } catch (error) {
      console.error('Error getting simple explanation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-lg w-full border border-white/20">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">AI Tutor</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-white/10 p-4 rounded-lg border border-white/20">
            <p className="text-white/80 text-sm mb-2">
              <strong>Question:</strong> {question}
            </p>
            <p className="text-red-400 text-sm mb-2">
              <strong>Your Answer:</strong> {userAnswer}
            </p>
            <p className="text-green-400 text-sm">
              <strong>Correct Answer:</strong> {correctAnswer}
            </p>
          </div>

          <div className="bg-white/10 p-4 rounded-lg border border-white/20">
            <div className="flex items-center space-x-2 mb-3">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Explanation</span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              {explanation}
            </p>
          </div>

          {simpleExplanation && (
            <div className="bg-white/10 p-4 rounded-lg border border-white/20">
              <div className="flex items-center space-x-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">Simple Explanation</span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                {simpleExplanation}
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            {!simpleExplanation && (
              <button
                onClick={getSimpleExplanation}
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Lightbulb className="w-4 h-4" />
                )}
                <span>Get Simpler Explanation</span>
              </button>
            )}
            <button
              onClick={onClose}
              className={`${simpleExplanation ? 'w-full' : 'flex-1'} py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold border border-white/20`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIFeedback;