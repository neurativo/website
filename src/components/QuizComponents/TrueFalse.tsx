import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Question } from '../../types/quiz';

interface TrueFalseProps {
  question: Question;
  onAnswer: (answer: string) => void;
  showResult?: boolean;
  userAnswer?: string;
  disabled?: boolean;
}

const TrueFalse: React.FC<TrueFalseProps> = ({
  question,
  onAnswer,
  showResult = false,
  userAnswer,
  disabled = false
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>(userAnswer || '');

  // Keep selectedAnswer in sync with userAnswer from parent
  React.useEffect(() => {
    setSelectedAnswer(userAnswer || '');
  }, [userAnswer]);

  const handleOptionClick = (option: string) => {
    if (disabled) return;
    
    setSelectedAnswer(option);
    onAnswer(option);
  };

  const options = ['True', 'False'];

  const getOptionStyle = (option: string) => {
    const isSelected = selectedAnswer === option;
    const isCorrect = option === question.correct_answer;
    const isUserAnswer = userAnswer === option;

    if (showResult) {
      if (isCorrect) {
        return 'bg-green-500/20 border-green-500 text-green-400';
      } else if (isUserAnswer && !isCorrect) {
        return 'bg-red-500/20 border-red-500 text-red-400';
      } else {
        return 'bg-white/10 border-white/20 text-white/70';
      }
    }

    if (isSelected) {
      return 'bg-blue-500/20 border-blue-500 text-blue-400';
    }

    return 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:border-white/40';
  };

  const getOptionIcon = (option: string) => {
    const isCorrect = option === question.correct_answer;
    const isUserAnswer = userAnswer === option;

    if (showResult) {
      if (isCorrect) {
        return <Check className="w-5 h-5 text-green-400" />;
      } else if (isUserAnswer && !isCorrect) {
        return <X className="w-5 h-5 text-red-400" />;
      }
    }

    return null;
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((option, index) => (
        <motion.button
          key={index}
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          onClick={() => handleOptionClick(option)}
          disabled={disabled}
          className={`p-6 rounded-lg border-2 transition-all duration-200 text-center flex flex-col items-center justify-center space-y-2 ${getOptionStyle(option)}`}
        >
          <span className="text-2xl font-bold">{option}</span>
          {getOptionIcon(option)}
        </motion.button>
      ))}
    </div>
  );
};

export default TrueFalse;