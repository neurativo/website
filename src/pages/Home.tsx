import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Brain, 
  Zap, 
  Target, 
  Trophy,
  ArrowRight,
  Sparkles,
  BookOpen,
  Users
} from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import TypingAnimation from '../components/TypingAnimation';

const Home = () => {
  const { stats } = useGame();
  const { user } = useAuth();

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Quizzes',
      description: 'Generate intelligent quizzes from any content',
      color: 'from-blue-400 to-cyan-400'
    },
    {
      icon: Zap,
      title: 'Adaptive Learning',
      description: 'Difficulty adjusts to your performance',
      color: 'from-purple-400 to-pink-400'
    },
    {
      icon: Target,
      title: 'Personalized Feedback',
      description: 'Get detailed explanations for every answer',
      color: 'from-green-400 to-emerald-400'
    },
    {
      icon: Trophy,
      title: 'Gamified Experience',
      description: 'Earn XP, maintain streaks, and level up',
      color: 'from-yellow-400 to-orange-400'
    }
  ];

  return (
    <div className="-mt-16 md:-mt-20">
      {/* Hero Section */}
      <section className="px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mb-4"
              >
                <Brain className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                <TypingAnimation 
                  statements={[
                    {
                      text: "Learn Smarter with AI",
                      highlightedWords: ["AI"]
                    },
                    {
                      text: "Master Any Subject",
                      highlightedWords: ["Master"]
                    },
                    {
                      text: "Quiz Your Knowledge",
                      highlightedWords: ["Quiz"]
                    },
                    {
                      text: "Level Up Your Skills",
                      highlightedWords: ["Level"]
                    }
                  ]}
                  speed={80}
                  pauseTime={2500}
                  className="text-4xl md:text-6xl font-bold"
                />
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Transform any content into engaging, personalized quizzes. 
                Upload documents, paste URLs, or choose from our library.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <Link to="/create">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Create AI Quiz</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link to="/library">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Browse Library</span>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>



      {/* Stats Section */}
      {user && (
        <section className="px-4 py-20 md:py-28">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                <div className="text-2xl font-bold text-blue-400 mb-2">
                  Level {stats.level}
                </div>
                <div className="text-sm text-white/70">Current Level</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                <div className="text-2xl font-bold text-purple-400 mb-2">
                  {stats.xp}
                </div>
                <div className="text-sm text-white/70">Total XP</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                <div className="text-2xl font-bold text-green-400 mb-2">
                  {stats.streak}
                </div>
                <div className="text-sm text-white/70">Day Streak</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center border border-white/20">
                <div className="text-2xl font-bold text-orange-400 mb-2">
                  {stats.totalQuizzes}
                </div>
                <div className="text-sm text-white/70">Quizzes Completed</div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="px-4 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose Neurativo?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Experience the future of learning with our intelligent quiz platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.8 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/70">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 md:py-28 mb-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/20 text-center"
          >
            <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Learning?
            </h3>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are already using AI to master new skills faster and more effectively.
            </p>
            <Link to="/create">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg"
              >
                Get Started Now
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
