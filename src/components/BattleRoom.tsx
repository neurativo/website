import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sword, Trophy, Clock, Zap, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BattleRoom as BattleRoomType, Quiz } from '../types/quiz';
import QuestionRenderer from './QuizComponents/QuestionRenderer';

interface BattleRoomProps {
  battle: BattleRoomType;
  quiz: Quiz;
  onBattleEnd: (result: 'win' | 'lose' | 'draw') => void;
}

const BattleRoom: React.FC<BattleRoomProps> = ({ battle, quiz, onBattleEnd }) => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const isPlayer1 = user?.id === battle.player1_id;
  const myCurrentScore = isPlayer1 ? battle.player1_score : battle.player2_score;
  const opponentCurrentScore = isPlayer1 ? battle.player2_score : battle.player1_score;

  useEffect(() => {
    if (timeLeft > 0 && !answered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !answered) {
      handleAnswer(''); // Submit empty answer when time runs out
    }
  }, [timeLeft, answered]);

  const handleAnswer = (answer: string | string[]) => {
    setAnswered(true);
    setShowResult(true);
    
    const question = quiz.questions[currentQuestion];
    const isCorrect = Array.isArray(answer) 
      ? Array.isArray(question.correct_answer) && 
        question.correct_answer.every((ans, idx) => ans === answer[idx])
      : answer === question.correct_answer;

    if (isCorrect) {
      setMyScore(myScore + 1);
    }

    // In a real implementation, you'd emit this to a WebSocket server
    // and receive opponent's answer as well
    
    setTimeout(() => {
      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setTimeLeft(30);
        setAnswered(false);
        setShowResult(false);
      } else {
        // Battle ended
        if (myScore > opponentScore) {
          onBattleEnd('win');
        } else if (myScore < opponentScore) {
          onBattleEnd('lose');
        } else {
          onBattleEnd('draw');
        }
      }
    }, 3000);
  };

  const question = quiz.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Battle Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">You</p>
                  <p className="text-blue-400 text-sm">{myScore} points</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Sword className="w-6 h-6 text-white/50" />
                <span className="text-white/50">VS</span>
                <Sword className="w-6 h-6 text-white/50 rotate-180" />
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Opponent</p>
                  <p className="text-red-400 text-sm">{opponentScore} points</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-white/70" />
                <span className={`text-xl font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
                  {timeLeft}s
                </span>
              </div>
              <div className="text-white/70">
                Question {currentQuestion + 1} / {quiz.questions.length}
              </div>
            </div>
          </div>
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20"
        >
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">{currentQuestion + 1}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-4">
                {question.question}
              </h3>
              
              <QuestionRenderer
                question={question}
                onAnswer={handleAnswer}
                showResult={showResult}
                disabled={answered}
              />
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-sm">Progress</span>
            <span className="text-white/70 text-sm">
              {currentQuestion + 1} / {quiz.questions.length}
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleRoom;