import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Trophy, 
  Target, 
  ChevronRight, 
  ChevronLeft,
  RotateCcw,
  Home,
  Brain,
  Zap,
  Award,
  Crown,
  CheckCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Quiz as QuizType, Question, QuizAnswer } from '../types/quiz';
import QuestionRenderer from '../components/QuizComponents/QuestionRenderer';
import AIFeedback from '../components/AIFeedback';
import toast from 'react-hot-toast';

const Quiz = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addXP, completeQuiz, updateStreak } = useGame();
  
  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string | string[]}>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [selectedQuestionAnalysis, setSelectedQuestionAnalysis] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{[key: number]: string}>({});
  const [loadingAnalysis, setLoadingAnalysis] = useState<{[key: number]: boolean}>({});
  const [quizSettings, setQuizSettings] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchQuiz();
    }
  }, [id]);

  useEffect(() => {
    if (quiz && !quizCompleted && quizSettings?.enableTimer && quiz.questions[currentQuestion]?.time_limit && timeLeft === 0) {
      const questionTimeLimit = quiz.questions[currentQuestion].time_limit;
      setTimeLeft(questionTimeLimit);
      setStartTime(new Date());
    }
  }, [currentQuestion, quiz, quizCompleted, quizSettings]);

  useEffect(() => {
    if (timeLeft > 0 && !showResult && !quizCompleted && quizSettings?.enableTimer && quiz?.questions[currentQuestion]?.time_limit && quiz.questions[currentQuestion].time_limit > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult && !quizCompleted && quizSettings?.enableTimer && quiz?.questions[currentQuestion]?.time_limit && quiz.questions[currentQuestion].time_limit > 0) {
      handleAnswer(''); // Auto-submit empty answer when time runs out
    }
  }, [timeLeft, showResult, quizCompleted, quizSettings]);

  const fetchQuiz = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setQuiz(data);
      
      // Extract quiz settings from metadata
      if (data?.metadata?.quizSettings) {
        setQuizSettings(data.metadata.quizSettings);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast.error('Failed to load quiz');
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

    const handleAnswer = (answer: string | string[]) => {
    if (!quiz || !quiz.questions) return;
    
    const question = quiz.questions[currentQuestion];
    if (!question) return;

    // Normalize the answer for comparison
    const normalize = (val: string) => val.toLowerCase().trim();
    
    // Check if answer is correct
    let isCorrect = false;
    if (Array.isArray(answer) && Array.isArray(question.correct_answer)) {
      isCorrect = answer.length === question.correct_answer.length &&
        answer.every((ans, idx) => normalize(ans) === normalize(question.correct_answer[idx]));
    } else if (typeof answer === 'string' && typeof question.correct_answer === 'string') {
      isCorrect = normalize(answer) === normalize(question.correct_answer);
    } else if (Array.isArray(answer) && typeof question.correct_answer === 'string') {
      isCorrect = answer.length === 1 && normalize(answer[0]) === normalize(question.correct_answer);
    } else if (typeof answer === 'string' && Array.isArray(question.correct_answer)) {
      isCorrect = question.correct_answer.length === 1 && normalize(answer) === normalize(question.correct_answer[0]);
    }

    // Update user answers
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion]: answer
    }));
  };

  const nextQuestion = () => {
    if (!quiz || !quiz.questions || currentQuestion >= quiz.questions.length - 1) return;
      setCurrentQuestion(currentQuestion + 1);
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const completeQuizHandler = async () => {
    if (!quiz || !quiz.questions) return;
    
    // Create final answers array
    const finalAnswers: QuizAnswer[] = [];
    let correctCount = 0;
    let totalTime = 0;

    for (let i = 0; i < quiz.questions.length; i++) {
        const question = quiz.questions[i];
      const userAnswer = userAnswers[i] || '';
      
      // Check if answer is correct
      const normalize = (val: string) => val.toLowerCase().trim();
      let isCorrect = false;
      
      if (Array.isArray(userAnswer) && Array.isArray(question.correct_answer)) {
        isCorrect = userAnswer.length === question.correct_answer.length &&
          userAnswer.every((ans, idx) => normalize(ans) === normalize(question.correct_answer[idx]));
      } else if (typeof userAnswer === 'string' && typeof question.correct_answer === 'string') {
        isCorrect = normalize(userAnswer) === normalize(question.correct_answer);
      } else if (Array.isArray(userAnswer) && typeof question.correct_answer === 'string') {
        isCorrect = userAnswer.length === 1 && normalize(userAnswer[0]) === normalize(question.correct_answer);
      } else if (typeof userAnswer === 'string' && Array.isArray(question.correct_answer)) {
        isCorrect = question.correct_answer.length === 1 && normalize(userAnswer) === normalize(question.correct_answer[0]);
      }

      if (isCorrect) correctCount++;

      finalAnswers.push({
        question_id: question.id,
        user_answer: Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer,
        is_correct: isCorrect,
        time_taken: question.time_limit || 30,
        hints_used: 0
      });
    }

    const score = (correctCount / quiz.questions.length) * 100;
    
    setQuizCompleted(true);

    // Update game stats only if user is logged in
    if (user) {
      await completeQuiz(score, quiz.questions.length);
      await updateStreak(score >= 70); // 70% is passing grade
    }

    // Save quiz attempt only if user is logged in
    if (user) {
      try {
        const attemptData = {
          quiz_id: quiz.id,
          user_id: user.id,
          score,
          time_taken: totalTime,
          answers: finalAnswers,
          completed_at: new Date().toISOString()
        };
        await supabase.from('quiz_attempts').insert(attemptData);
      } catch (error) {
        console.error('Error saving quiz attempt:', error);
      }
    }

    // Show success message
    if (score >= 70) {
      toast.success(`Great job! You scored ${score.toFixed(1)}%`);
    } else {
      toast.error(`You scored ${score.toFixed(1)}%. Try again to improve!`);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setUserAnswers({});
    setShowResult(false);
    setQuizCompleted(false);
    setCurrentFeedback(null);
  };

  const getPerformanceInsights = () => {
    if (!quiz || Object.keys(userAnswers).length === 0) return null;

    const correctCount = Object.keys(userAnswers).filter(index => {
      const questionIndex = parseInt(index);
      const question = quiz.questions[questionIndex];
      const userAnswer = userAnswers[questionIndex];
      
      if (!question || !userAnswer) return false;
      
      const normalize = (val: string) => val.toLowerCase().trim();
      if (Array.isArray(userAnswer) && Array.isArray(question.correct_answer)) {
        return userAnswer.length === question.correct_answer.length &&
          userAnswer.every((ans, idx) => normalize(ans) === normalize(question.correct_answer[idx]));
      } else if (typeof userAnswer === 'string' && typeof question.correct_answer === 'string') {
        return normalize(userAnswer) === normalize(question.correct_answer);
      }
      return false;
    }).length;

    const totalAnswered = Object.keys(userAnswers).length;
    const accuracy = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;

    return {
      totalQuestions: quiz.questions.length,
      answeredQuestions: totalAnswered,
      correctAnswers: correctCount,
      accuracy,
      score: (correctCount / quiz.questions.length) * 100
    };
  };

  const generateQuestionAnalysis = async (questionIndex: number) => {
    if (!quiz || loadingAnalysis[questionIndex]) return;

    setLoadingAnalysis(prev => ({ ...prev, [questionIndex]: true }));

    try {
      const question = quiz.questions[questionIndex];
      const userAnswer = userAnswers[questionIndex];
      
      if (!question || !userAnswer) {
        setAiAnalysis(prev => ({ ...prev, [questionIndex]: 'No answer provided for this question.' }));
        return;
      }

      // For now, provide a simple analysis
      const isCorrect = (() => {
        const normalize = (val: string) => val.toLowerCase().trim();
        if (Array.isArray(userAnswer) && Array.isArray(question.correct_answer)) {
          return userAnswer.length === question.correct_answer.length &&
            userAnswer.every((ans, idx) => normalize(ans) === normalize(question.correct_answer[idx]));
        } else if (typeof userAnswer === 'string' && typeof question.correct_answer === 'string') {
          return normalize(userAnswer) === normalize(question.correct_answer);
        }
        return false;
      })();

      const analysis = isCorrect 
        ? `Great job! Your answer "${userAnswer}" is correct. ${question.explanation || 'Well done!'}`
        : `Your answer "${userAnswer}" is incorrect. The correct answer is "${question.correct_answer}". ${question.explanation || 'Keep practicing!'}`;

      setAiAnalysis(prev => ({ ...prev, [questionIndex]: analysis }));
    } catch (error) {
      console.error('Error generating analysis:', error);
      setAiAnalysis(prev => ({ ...prev, [questionIndex]: 'Unable to generate analysis at this time.' }));
    } finally {
      setLoadingAnalysis(prev => ({ ...prev, [questionIndex]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Quiz not found</p>
          <button
            onClick={() => navigate('/library')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const insights = getPerformanceInsights();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Quiz Complete!</h1>
            <p className="text-white/80 text-lg">Great job completing the quiz</p>
          </motion.div>

          {/* Results Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/20 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {insights?.score.toFixed(1)}%
              </div>
                <div className="text-white/70">Final Score</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {insights?.correctAnswers}/{insights?.totalQuestions}
                </div>
                <div className="text-white/70">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">
                  {insights?.answeredQuestions}/{insights?.totalQuestions}
                </div>
                <div className="text-white/70">Questions Answered</div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <button
              onClick={restartQuiz}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Retake Quiz
            </button>
            <button
              onClick={() => navigate('/library')}
              className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Library
            </button>
            <button
              onClick={() => setShowDetailedResults(!showDetailedResults)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              {showDetailedResults ? 'Hide' : 'Show'} Detailed Results
            </button>
          </motion.div>

          {/* Detailed Results */}
          {showDetailedResults && (
          <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Question-by-Question Analysis</h3>
              <div className="space-y-4">
                {quiz.questions.map((question, index) => {
                  const userAnswer = userAnswers[index];
                  const isCorrect = (() => {
                    if (!userAnswer) return false;
                    const normalize = (val: string) => val.toLowerCase().trim();
                    if (Array.isArray(userAnswer) && Array.isArray(question.correct_answer)) {
                      return userAnswer.length === question.correct_answer.length &&
                        userAnswer.every((ans, idx) => normalize(ans) === normalize(question.correct_answer[idx]));
                    } else if (typeof userAnswer === 'string' && typeof question.correct_answer === 'string') {
                      return normalize(userAnswer) === normalize(question.correct_answer);
                    }
                    return false;
                  })();

                  return (
                    <div key={index} className="border border-white/20 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white font-medium">Question {index + 1}</h4>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                </div>
                      <p className="text-white/80 text-sm mb-2">{question.question}</p>
                      <div className="text-sm">
                        <span className="text-white/60">Your answer: </span>
                        <span className="text-white">{userAnswer || 'No answer'}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-white/60">Correct answer: </span>
                        <span className="text-green-400">{Array.isArray(question.correct_answer) ? question.correct_answer.join(', ') : question.correct_answer}</span>
                </div>
                      {question.explanation && (
                        <div className="text-sm mt-2">
                          <span className="text-white/60">Explanation: </span>
                          <span className="text-white/80">{question.explanation}</span>
                  </div>
                      )}
                </div>
                  );
                })}
            </div>
          </motion.div>
          )}
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const userAnswer = userAnswers[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{quiz.title}</h1>
            <p className="text-white/70">Question {currentQuestion + 1} of {quiz.questions.length}</p>
          </div>
          <button
            onClick={() => navigate('/library')}
            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            <Home className="w-5 h-5" />
          </button>
          </div>
          
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-white/70 text-sm mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
          </div>
        </div>

        {/* Timer */}
        {quizSettings?.enableTimer && currentQ?.time_limit && (
          <div className="mb-6 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-white/70" />
                <span className="text-white font-medium">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
            </div>
          </div>
        </div>
        )}

        {/* Question */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/20 mb-8"
        >
              <QuestionRenderer
            question={currentQ}
            userAnswer={userAnswer}
                onAnswer={handleAnswer}
          />
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
            className="px-4 py-2 rounded bg-white/10 text-white border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-white/70 text-sm">
              {Object.keys(userAnswers).length} of {quiz.questions.length} answered
            </span>
          </div>

          <button
            onClick={() => {
              if (currentQuestion < quiz.questions.length - 1) {
                nextQuestion();
              } else {
                completeQuizHandler();
              }
            }}
            className="px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors flex items-center"
          >
            {currentQuestion === quiz.questions.length - 1 ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Finish Quiz
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>


        </div>

        {/* AI Feedback Modal */}
        {showAIFeedback && currentFeedback && (
          <AIFeedback
            question={currentFeedback.question}
            userAnswer={currentFeedback.userAnswer}
            correctAnswer={currentFeedback.correctAnswer}
            explanation={currentFeedback.explanation}
          onClose={() => setShowAIFeedback(false)}
          />
        )}
    </div>
  );
};

export default Quiz;