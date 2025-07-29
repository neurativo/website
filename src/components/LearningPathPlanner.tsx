import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Map, 
  Target, 
  Calendar, 
  BookOpen, 
  Brain,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { aiService } from '../lib/ai';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  goal: string;
  target_date: string;
  topics: string[];
  recommended_quizzes: string[];
  progress: number;
  created_at: string;
}

interface LearningPathPlannerProps {
  onClose: () => void;
}

const LearningPathPlanner: React.FC<LearningPathPlannerProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPath, setNewPath] = useState({
    title: '',
    description: '',
    goal: '',
    target_date: '',
    topics: [] as string[],
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLearningPaths();
  }, []);

  const fetchLearningPaths = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setPaths(data || []);
    } catch (error) {
      console.error('Error fetching learning paths:', error);
    }
  };

  const generateAIPath = async () => {
    if (!newPath.goal || !newPath.target_date) return;

    setLoading(true);
    try {
      const prompt = `Create a learning path for: "${newPath.goal}"
      Target completion: ${newPath.target_date}
      Difficulty level: ${newPath.difficulty}
      
      Generate:
      1. A structured title
      2. Detailed description
      3. Key topics to cover (array of strings)
      4. Recommended study schedule
      
      Return as JSON with: title, description, topics, schedule`;

      const response = await aiService.generateExplanation(
        prompt,
        '',
        '',
        false
      );

      try {
        const aiSuggestion = JSON.parse(response.content);
        setNewPath(prev => ({
          ...prev,
          title: aiSuggestion.title || prev.title,
          description: aiSuggestion.description || prev.description,
          topics: aiSuggestion.topics || []
        }));
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
      }
    } catch (error) {
      console.error('Error generating AI path:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPath = async () => {
    if (!user || !newPath.title || !newPath.goal || !newPath.target_date) return;

    try {
      const { data } = await supabase
        .from('learning_paths')
        .insert({
          user_id: user.id,
          title: newPath.title,
          description: newPath.description,
          goal: newPath.goal,
          target_date: newPath.target_date,
          topics: newPath.topics,
          recommended_quizzes: [],
          progress: 0
        })
        .select()
        .single();

      if (data) {
        setPaths([data, ...paths]);
        setIsCreating(false);
        setNewPath({
          title: '',
          description: '',
          goal: '',
          target_date: '',
          topics: [],
          difficulty: 'medium'
        });
      }
    } catch (error) {
      console.error('Error creating learning path:', error);
    }
  };

  const deletePath = async (pathId: string) => {
    if (!confirm('Are you sure you want to delete this learning path?')) return;

    try {
      await supabase
        .from('learning_paths')
        .delete()
        .eq('id', pathId);
      
      setPaths(paths.filter(p => p.id !== pathId));
    } catch (error) {
      console.error('Error deleting learning path:', error);
    }
  };

  const updateProgress = async (pathId: string, newProgress: number) => {
    try {
      await supabase
        .from('learning_paths')
        .update({ progress: newProgress })
        .eq('id', pathId);
      
      setPaths(paths.map(p => 
        p.id === pathId ? { ...p, progress: newProgress } : p
      ));
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const addTopic = () => {
    const topic = prompt('Enter topic name:');
    if (topic && !newPath.topics.includes(topic)) {
      setNewPath(prev => ({
        ...prev,
        topics: [...prev.topics, topic]
      }));
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setNewPath(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic !== topicToRemove)
    }));
  };

  const getDaysUntilTarget = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-4xl w-full border border-white/20 max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
              <Map className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Learning Path Planner</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Path</span>
            </button>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Create New Path */}
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Create New Learning Path</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Learning Goal
                </label>
                <input
                  type="text"
                  value={newPath.goal}
                  onChange={(e) => setNewPath({...newPath, goal: e.target.value})}
                  placeholder="e.g., Master JavaScript DOM manipulation"
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Target Date
                </label>
                <input
                  type="date"
                  value={newPath.target_date}
                  onChange={(e) => setNewPath({...newPath, target_date: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Difficulty Level
                </label>
                <select
                  value={newPath.difficulty}
                  onChange={(e) => setNewPath({...newPath, difficulty: e.target.value as any})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="easy" className="bg-slate-800">Easy</option>
                  <option value="medium" className="bg-slate-800">Medium</option>
                  <option value="hard" className="bg-slate-800">Hard</option>
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={generateAIPath}
                  disabled={loading || !newPath.goal || !newPath.target_date}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      <span>Generate AI Path</span>
                    </>
                  )}
                </button>
              </div>

              {newPath.title && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newPath.title}
                      onChange={(e) => setNewPath({...newPath, title: e.target.value})}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={newPath.description}
                      onChange={(e) => setNewPath({...newPath, description: e.target.value})}
                      rows={3}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-white/80 text-sm font-medium">
                        Topics to Cover
                      </label>
                      <button
                        onClick={addTopic}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        + Add Topic
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newPath.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center space-x-1"
                        >
                          <span>{topic}</span>
                          <button
                            onClick={() => removeTopic(topic)}
                            className="text-blue-400 hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={createPath}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-lg font-semibold"
                    >
                      Create Path
                    </button>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-semibold border border-white/20"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Learning Paths */}
        <div className="space-y-6">
          {paths.length === 0 ? (
            <div className="text-center py-12">
              <Map className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Learning Paths Yet
              </h3>
              <p className="text-white/70 mb-4">
                Create your first learning path to start your structured learning journey
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Create Learning Path
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {paths.map((path) => {
                const daysLeft = getDaysUntilTarget(path.target_date);
                const isOverdue = daysLeft < 0;

                return (
                  <motion.div
                    key={path.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {path.title}
                        </h3>
                        <p className="text-white/70 text-sm mb-3">
                          {path.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-white/60">
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4" />
                            <span>{path.goal}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span className={isOverdue ? 'text-red-400' : ''}>
                              {isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-400 hover:text-blue-300">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePath(path.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/80 text-sm">Progress</span>
                        <span className="text-white/80 text-sm">{path.progress}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${path.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-white/80 text-sm font-medium mb-2">Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {path.topics.map((topic, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-white/10 text-white/70 rounded-full text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => updateProgress(path.id, Math.min(100, path.progress + 10))}
                        className="flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg font-semibold border border-green-500/30"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark Progress</span>
                      </button>
                      <button className="flex items-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg font-semibold border border-blue-500/30">
                        <BookOpen className="w-4 h-4" />
                        <span>Find Quizzes</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LearningPathPlanner;