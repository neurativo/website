import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Question } from '../../types/quiz';

interface ShortAnswerProps {
  question: Question;
  onAnswer: (answer: string) => void;
  showResult?: boolean;
  userAnswer?: string;
  disabled?: boolean;
}

const ShortAnswer: React.FC<ShortAnswerProps> = ({
  question,
  onAnswer,
  showResult = false,
  userAnswer,
  disabled = false
}) => {
  const [answer, setAnswer] = useState<string>(userAnswer || '');

  const handleSubmit = () => {
    if (answer.trim()) {
      onAnswer(answer.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const isCorrect = userAnswer?.toLowerCase().trim() === (question.correct_answer as string).toLowerCase().trim();

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          placeholder="Type your answer here..."
          className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none h-24"
        />
        {showResult && (
          <div className="absolute top-2 right-2">
            {isCorrect ? (
              <Check className="w-6 h-6 text-green-400" />
            ) : (
              <X className="w-6 h-6 text-red-400" />
            )}
          </div>
        )}
      </div>

      {!disabled && !showResult && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answer
        </motion.button>
      )}

      {showResult && (
        <div className="space-y-2">
          <div className={`p-3 rounded-lg ${isCorrect ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
            <p className="text-sm font-medium text-white/90">
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </p>
          </div>
          <div className="bg-white/10 p-3 rounded-lg border border-white/20">
            <p className="text-sm text-white/70">
              <span className="font-medium">Correct answer:</span> {question.correct_answer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortAnswer;