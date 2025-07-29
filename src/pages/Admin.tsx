import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  BookOpen, 
  Settings, 
  BarChart3,
  MessageSquare,
  Zap,
  Database,
  Globe,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Brain,
  Key,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [apiSettings, setApiSettings] = useState({
    openai_key: '',
    claude_key: '',
    gemini_key: '',
    active_provider: 'openai'
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'quizzes', label: 'Quizzes', icon: BookOpen },
    { id: 'ai-settings', label: 'AI Settings', icon: Brain },
    { id: 'suggestions', label: 'Suggestions', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      switch (activeTab) {
        case 'overview':
          await fetchOverview();
          break;
        case 'users':
          await fetchUsers();
          break;
        case 'quizzes':
          await fetchQuizzes();
          break;
        case 'suggestions':
          await fetchSuggestions();
          break;
        case 'analytics':
          await fetchAnalytics();
          break;
        case 'ai-settings':
          await fetchAISettings();
          break;
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    const [usersCount, quizzesCount, attemptsCount] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('quizzes').select('*', { count: 'exact', head: true }),
      supabase.from('quiz_attempts').select('*', { count: 'exact', head: true })
    ]);

    setAnalytics({
      total_users: usersCount.count || 0,
      total_quizzes: quizzesCount.count || 0,
      total_attempts: attemptsCount.count || 0
    });
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers(data || []);
  };

  const fetchQuizzes = async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });
    setQuizzes(data || []);
  };

  const fetchSuggestions = async () => {
    const { data } = await supabase
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false });
    setSuggestions(data || []);
  };

  const fetchAnalytics = async () => {
    // Fetch detailed analytics
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('*, quizzes(category), users(username)')
      .order('completed_at', { ascending: false })
      .limit(100);

    if (attempts) {
      const categoryStats = attempts.reduce((acc: any, attempt) => {
        const category = attempt.quizzes?.category || 'Unknown';
        if (!acc[category]) {
          acc[category] = { attempts: 0, total_score: 0 };
        }
        acc[category].attempts += 1;
        acc[category].total_score += attempt.score;
        return acc;
      }, {});

      setAnalytics(prev => ({
        ...prev,
        category_stats: categoryStats,
        recent_attempts: attempts.slice(0, 10)
      }));
    }
  };

  const fetchAISettings = async () => {
    const { data } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('key', 'ai_config')
      .single();

    if (data) {
      setApiSettings(JSON.parse(data.value));
    }
  };

  const saveAISettings = async () => {
    try {
      await supabase
        .from('admin_settings')
        .upsert({
          key: 'ai_config',
          value: JSON.stringify(apiSettings)
        });
      alert('AI settings saved successfully!');
    } catch (error) {
      console.error('Error saving AI settings:', error);
    }
  };

  const deleteQuiz = async (quizId: string) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      await supabase.from('quizzes').delete().eq('id', quizId);
      fetchQuizzes();
    }
  };

  const deleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await supabase.from('users').delete().eq('id', userId);
      fetchUsers();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{analytics.total_users}</p>
              <p className="text-sm text-white/70">Total Users</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{analytics.total_quizzes}</p>
              <p className="text-sm text-white/70">Total Quizzes</p>
            </div>
            <BookOpen className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{analytics.total_attempts}</p>
              <p className="text-sm text-white/70">Quiz Attempts</p>
            </div>
            <Activity className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">System Health</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-between">
              <span className="text-white">Database Status</span>
              <span className="text-green-400 font-medium">Healthy</span>
            </div>
          </div>
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-between">
              <span className="text-white">AI API Status</span>
              <span className="text-green-400 font-medium">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Quizzes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">0</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-400 hover:text-blue-300">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-yellow-400 hover:text-yellow-300">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteUser(user.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderQuizzes = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Quiz</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{quiz.title}</h3>
                <p className="text-white/70 text-sm mb-3">{quiz.description}</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                    quiz.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    quiz.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>
                    {quiz.difficulty}
                  </span>
                  <span className="text-white/60 text-xs">{quiz.category}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/70">
                {quiz.questions_count} questions
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-blue-400 hover:text-blue-300">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="text-yellow-400 hover:text-yellow-300">
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteQuiz(quiz.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAISettings = () => (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Key className="w-5 h-5 mr-2" />
          API Configuration
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Active AI Provider
            </label>
            <select
              value={apiSettings.active_provider}
              onChange={(e) => setApiSettings({...apiSettings, active_provider: e.target.value})}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="openai" className="bg-slate-800">OpenAI</option>
              <option value="claude" className="bg-slate-800">Claude</option>
              <option value="gemini" className="bg-slate-800">Gemini</option>
            </select>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              OpenAI API Key
            </label>
            <input
              type="password"
              value={apiSettings.openai_key}
              onChange={(e) => setApiSettings({...apiSettings, openai_key: e.target.value})}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="sk-..."
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Claude API Key
            </label>
            <input
              type="password"
              value={apiSettings.claude_key}
              onChange={(e) => setApiSettings({...apiSettings, claude_key: e.target.value})}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="sk-ant-..."
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiSettings.gemini_key}
              onChange={(e) => setApiSettings({...apiSettings, gemini_key: e.target.value})}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="AI..."
            />
          </div>

          <button
            onClick={saveAISettings}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-semibold"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  const renderSuggestions = () => (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4">User Suggestions</h3>
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-2">{suggestion.title}</h4>
                  <p className="text-white/70 text-sm mb-3">{suggestion.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-white/60">
                    <span>From: {suggestion.user_email}</span>
                    <span>{new Date(suggestion.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-green-400 hover:text-green-300">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-8 pt-20 md:pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-white/70">
            Platform administration and management
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'quizzes' && renderQuizzes()}
          {activeTab === 'ai-settings' && renderAISettings()}
          {activeTab === 'suggestions' && renderSuggestions()}
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;