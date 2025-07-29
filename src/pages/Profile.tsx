import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Trophy, 
  Target, 
  Clock, 
  Award,
  Settings,
  Camera,
  Edit3,
  Save,
  X,
  Calendar,
  BookOpen,
  Zap,
  TrendingUp,
  Mail,
  Crown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../lib/supabase';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { stats, refreshStats } = useGame();
  const { currentPlan } = useSubscription();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: user?.username || '',
    bio: '',
    avatar: user?.avatar || ''
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setEditData({
        username: user.username || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch recent quiz attempts
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes (title, category)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      setRecentActivity(attempts || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setEditData({
      username: user?.username || '',
      bio: user?.bio || '',
      avatar: user?.avatar || ''
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please sign in to view your profile</h2>
          <p className="text-white/60">You need to be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Profile Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                {isEditing && (
                  <button className="absolute -bottom-2 -right-2 bg-blue-500 p-2 rounded-full">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                    className="text-2xl font-bold text-white bg-white/10 rounded-lg px-3 py-1 border border-white/20"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-white">{user.username || 'User'}</h1>
                )}
                
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-white/60" />
                  <span className="text-white/60">{user.email}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {currentPlan?.id !== 'free' && <Crown className="w-4 h-4 text-yellow-400" />}
                  <span className="text-white/60">{currentPlan?.name || 'Free'} Plan</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-white/60 text-sm">Total Quizzes</p>
                <p className="text-2xl font-bold text-white">{stats.totalQuizzes}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-white/60 text-sm">Average Score</p>
                <p className="text-2xl font-bold text-white">{stats.averageScore.toFixed(1)}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center space-x-3">
              <Zap className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-white/60 text-sm">Current Streak</p>
                <p className="text-2xl font-bold text-white">{stats.streak} days</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
          >
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-white/60 text-sm">Total XP</p>
                <p className="text-2xl font-bold text-white">{stats.xp}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Recent Activity</span>
          </h2>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">{activity.quizzes?.title || 'Quiz'}</p>
                      <p className="text-white/60 text-sm">{activity.quizzes?.category || 'General'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{activity.score}%</p>
                    <p className="text-white/60 text-sm">
                      {new Date(activity.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">No recent activity yet. Start taking quizzes to see your progress!</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Profile;