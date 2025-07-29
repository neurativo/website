import React from 'react';
import { Question } from '../../types/quiz';
import MultipleChoice from './MultipleChoice';
import TrueFalse from './TrueFalse';
import ShortAnswer from './ShortAnswer';

interface QuestionRendererProps {
  question: Question;
  onAnswer: (answer: string | string[]) => void;
  showResult?: boolean;
  userAnswer?: string | string[];
  disabled?: boolean;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  onAnswer,
  showResult = false,
  userAnswer,
  disabled = false
}) => {
  const renderQuestionContent = () => {
  switch (question.type) {
    case 'multiple_choice':
      return (
        <MultipleChoice
          question={question}
          onAnswer={onAnswer as (answer: string) => void}
          showResult={showResult}
          userAnswer={userAnswer as string}
          disabled={disabled}
        />
      );
    case 'true_false':
      return (
        <TrueFalse
          question={question}
          onAnswer={onAnswer as (answer: string) => void}
          showResult={showResult}
          userAnswer={userAnswer as string}
          disabled={disabled}
        />
      );
    case 'short_answer':
      return (
        <ShortAnswer
          question={question}
          onAnswer={onAnswer as (answer: string) => void}
          showResult={showResult}
          userAnswer={userAnswer as string}
          disabled={disabled}
        />
      );

    default:
      return <div>Unsupported question type</div>;
  }
  };

  return (
    <div className="space-y-6">
      {/* Question Text */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-4 leading-relaxed">
          {question.question}
        </h2>
        
        {/* Question Type Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/20">
          {question.type.replace('_', ' ').toUpperCase()}
        </div>
        
        {/* Difficulty Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ml-2 bg-white/10 text-white/80 border border-white/20">
          {question.difficulty.toUpperCase()}
        </div>
      </div>

      {/* Question Content */}
      {renderQuestionContent()}
    </div>
  );
};

export default QuestionRenderer;