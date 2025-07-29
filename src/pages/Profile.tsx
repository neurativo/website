import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Calendar, 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  Award, 
  Crown,
  Settings,
  Edit,
  Save,
  X,
  Brain,
  BookOpen,
  Zap,
  Star,
  BarChart3,
  Calendar as CalendarIcon,
  Map,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  timezone?: string;
  preferences?: any;
  created_at: string;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  time_taken: number;
  completed_at: string;
  quizzes: {
    title: string;
    category: string;
    difficulty: string;
  };
}

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { stats } = useGame();
  const { currentPlan } = useSubscription();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    timezone: 'UTC'
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setEditForm({
          username: profileData.username || '',
          full_name: profileData.full_name || '',
          bio: profileData.bio || '',
          timezone: profileData.timezone || 'UTC'
        });
      }

      // Fetch recent quiz attempts
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes (title, category, difficulty)
        `)
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (attempts) {
        setRecentAttempts(attempts);
      }

      // Mock achievements for now
      setAchievements([
        { id: 1, name: 'First Quiz', description: 'Completed your first quiz', icon: '🎯', unlocked: true },
        { id: 2, name: 'Streak Master', description: 'Maintained a 7-day streak', icon: '🔥', unlocked: stats.streak >= 7 },
        { id: 3, name: 'Perfect Score', description: 'Got 100% on a quiz', icon: '⭐', unlocked: stats.averageScore >= 100 },
        { id: 4, name: 'Quiz Master', description: 'Completed 50 quizzes', icon: '👑', unlocked: stats.totalQuizzes >= 50 },
        { id: 5, name: 'Speed Demon', description: 'Completed a quiz in under 2 minutes', icon: '⚡', unlocked: false },
        { id: 6, name: 'Knowledge Seeker', description: 'Studied 10 different topics', icon: '📚', unlocked: false }
      ]);

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
      fetchProfileData(); // Refresh data
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      username: profile?.username || '',
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      timezone: profile?.timezone || 'UTC'
    });
    setIsEditing(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'hard': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Profile</h1>
          <p className="text-white/70">Manage your account and view your progress</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {profile?.username || 'User'}
                </h2>
                <p className="text-white/70">{profile?.email}</p>
                {currentPlan && (
                  <div className="flex items-center justify-center mt-2">
                    <Crown className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-white/70 text-sm">{currentPlan.name} Plan</span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-white/50" />
                  <span className="text-white/70 text-sm">{profile?.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-white/50" />
                  <span className="text-white/70 text-sm">
                    Joined {new Date(profile?.created_at || '').toLocaleDateString()}
                  </span>
                </div>
                {profile?.bio && (
                  <div className="pt-4 border-t border-white/20">
                    <p className="text-white/80 text-sm">{profile.bio}</p>
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setIsEditing(true)}
                className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.level}</p>
                    <p className="text-white/70 text-sm">Level</p>
                  </div>
                  <Trophy className="w-8 h-8 text-yellow-400" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalQuizzes}</p>
                    <p className="text-white/70 text-sm">Quizzes</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-blue-400" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.averageScore.toFixed(1)}%</p>
                    <p className="text-white/70 text-sm">Avg Score</p>
                  </div>
                  <Target className="w-8 h-8 text-green-400" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.streak}</p>
                    <p className="text-white/70 text-sm">Streak</p>
                  </div>
                  <Zap className="w-8 h-8 text-orange-400" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentAttempts.map((attempt, index) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{attempt.quizzes?.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(attempt.quizzes?.difficulty)}`}>
                          {attempt.quizzes?.difficulty}
                        </span>
                        <span className="text-white/60 text-xs">{attempt.quizzes?.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        attempt.score >= 70 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {attempt.score.toFixed(1)}%
                      </p>
                      <p className="text-white/60 text-xs">
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {recentAttempts.length === 0 && (
                  <p className="text-white/70 text-center py-6">No recent activity</p>
                )}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Achievements
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      achievement.unlocked
                        ? 'bg-white/10 border-white/20'
                        : 'bg-white/5 border-white/10 opacity-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <h4 className="text-white font-semibold text-sm mb-1">{achievement.name}</h4>
                      <p className="text-white/60 text-xs">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-xl p-6 w-full max-w-md border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Timezone</label>
                  <select
                    value={editForm.timezone}
                    onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;