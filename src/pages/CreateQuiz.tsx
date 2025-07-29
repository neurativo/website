import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Upload, 
  Link as LinkIcon, 
  Type, 
  Sparkles,
  FileText,
  Globe,
  Settings,
  Zap
} from 'lucide-react';
import { aiService } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'text'>('text');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [quizSettings, setQuizSettings] = useState({
    questionCount: 10,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer',
    enableTimer: false,
    timeLimit: 30,
  });
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);
  const [documentAnalysis, setDocumentAnalysis] = useState<any>(null);

  const tabs = [
    { id: 'text', label: 'Paste Text', icon: Type },
    { id: 'url', label: 'From URL', icon: LinkIcon },
    { id: 'upload', label: 'Upload File', icon: Upload },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // In a real app, you'd process the file here
      const reader = new FileReader();
      reader.onload = (e) => {
        setContent(e.target?.result as string);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleUrlSubmit = async () => {
    if (!url) return;
    
    setLoading(true);
    try {
      console.log('Extracting content from URL:', url);
      
      // Call Supabase Edge Function to extract content
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          url: url,
          options: {
            summarize: true,
            maxLength: 10000,
            focusAreas: ['main_content', 'educational_content']
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Extracted content:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Use the extracted and analyzed content
      const extractedContent = data.summary || data.content;
      if (!extractedContent) {
        throw new Error('No content could be extracted from the URL');
      }

      setContent(extractedContent);
      toast.success(`Content extracted successfully! Found ${data.metadata?.wordCount || 0} words.`);
      
      // Auto-switch to text tab to show extracted content
      setActiveTab('text');
      
    } catch (error) {
      console.error('Error extracting content:', error);
      toast.error(`Failed to extract content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (!content.trim()) return;

    setLoading(true);
    console.log('🎲 Quiz Creation: Starting generation...');
    console.log('📊 Quiz Creation: Content processed');
    
    try {
      const response = await aiService.generateQuiz(content, quizSettings);
      console.log('🤖 Quiz Creation: AI response received');
      
      if (response.error) {
        console.error('Error generating quiz:', response.error);
        toast.error('Error generating quiz: ' + response.error);
        return;
      }
      
      if (response.content) {
        try {
          const quizData = JSON.parse(response.content);
          console.log('Parsed quiz data:', quizData);
          
          // Validate quiz data structure
          if (quizData && quizData.questions && Array.isArray(quizData.questions)) {
            setGeneratedQuiz(quizData);
            toast.success('Quiz generated successfully!');
          } else {
            console.error('Invalid quiz structure:', quizData);
            toast.error('Generated quiz has invalid structure');
          }
        } catch (parseError) {
          console.error('Error parsing quiz JSON:', parseError);
          console.log('Raw response content:', response.content);
          toast.error('Error parsing quiz response. Please try again.');
        }
      } else {
        console.error('No content in response');
        toast.error('No content received from AI service');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error('Unexpected error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    if (!generatedQuiz) return;
    
    try {
      // Save quiz to Supabase
      const { data: savedQuiz, error } = await supabase
        .from('quizzes')
        .insert({
          title: generatedQuiz.title,
          description: generatedQuiz.description,
          category: generatedQuiz.category || 'general',
          difficulty: generatedQuiz.difficulty,
          questions: generatedQuiz.questions,
          questions_count: generatedQuiz.questions.length,
          estimated_time: Math.ceil(generatedQuiz.estimated_time || (generatedQuiz.questions.length * 0.5)),
          is_public: true,
          is_ai_generated: true,
          source_content: content.substring(0, 1000), // Store first 1000 chars
          created_by: user?.id || null,
          metadata: {
            quizSettings: quizSettings,
            sourceType: activeTab,
            generatedAt: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving quiz:', error);
        toast.error('Error saving quiz: ' + error.message);
        return;
      }

      if (savedQuiz) {
        toast.success('Quiz saved! Starting now...');
        // Navigate to the quiz
        navigate(`/quiz/${savedQuiz.id}`);
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Error starting quiz. Please try again.');
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">
            Create AI-Powered Quiz
          </h1>
          <p className="text-lg md:text-xl text-white/80">
            Upload content, paste text, or share a URL to generate intelligent quizzes
          </p>
        </motion.div>

        {/* Content Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 mb-6 md:mb-8 border border-white/20"
        >
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs md:text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Input Areas */}
          {activeTab === 'text' && (
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Paste your content here
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your text, lecture notes, or any content you want to turn into a quiz..."
                className="w-full h-32 md:h-40 p-3 md:p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none text-sm md:text-base"
              />
            </div>
          )}

          {activeTab === 'url' && (
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Enter URL to extract content
              </label>
              <p className="text-white/60 text-xs md:text-sm mb-3">
                Paste any article, blog post, Wikipedia page, or educational content URL. Our AI will extract, analyze, and summarize the key points automatically.
              </p>
              <div className="flex gap-4">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://en.wikipedia.org/wiki/Machine_Learning"
                  className="flex-1 p-3 md:p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm md:text-base"
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={!url || loading}
                  className="px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="hidden md:inline">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-5 h-5" />
                      <span className="hidden md:inline">Analyze</span>
                    </>
                  )}
                </button>
              </div>
              {content && activeTab === 'url' && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm md:text-base font-medium mb-2">
                    ✅ Content extracted and analyzed successfully!
                  </p>
                  <p className="text-green-300 text-xs md:text-sm">
                    Switch to "Paste Text" tab to review the extracted content, or proceed directly to generate your quiz.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Upload a file
              </label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 md:p-8 text-center hover:border-white/40 transition-colors">
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FileText className="w-12 h-12 text-white/40 mb-4" />
                  <span className="text-white/80 font-medium text-sm md:text-base">
                    {file ? file.name : 'Choose a file or drag & drop'}
                  </span>
                  <span className="text-white/50 text-xs md:text-sm mt-1">
                    Supports PDF, DOC, TXT files
                  </span>
                </label>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quiz Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 mb-6 md:mb-8 border border-white/20"
        >
          <div className="flex items-center space-x-2 mb-6">
            <Settings className="w-5 h-5 text-white" />
            <h3 className="text-lg md:text-xl font-semibold text-white">Quiz Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Number of Questions
              </label>
              <select
                value={quizSettings.questionCount}
                onChange={(e) => setQuizSettings({...quizSettings, questionCount: parseInt(e.target.value)})}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm md:text-base"
              >
                <option value={5} className="bg-slate-800">5 Questions</option>
                <option value={10} className="bg-slate-800">10 Questions</option>
                <option value={15} className="bg-slate-800">15 Questions</option>
                <option value={20} className="bg-slate-800">20 Questions</option>
              </select>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Difficulty Level
              </label>
              <select
                value={quizSettings.difficulty}
                onChange={(e) => setQuizSettings({...quizSettings, difficulty: e.target.value as any})}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm md:text-base"
              >
                <option value="easy" className="bg-slate-800">Easy</option>
                <option value="medium" className="bg-slate-800">Medium</option>
                <option value="hard" className="bg-slate-800">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Question Type
              </label>
              <select
                value={quizSettings.type}
                onChange={(e) => setQuizSettings({...quizSettings, type: e.target.value as any})}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm md:text-base"
              >
                <option value="multiple_choice" className="bg-slate-800">Multiple Choice</option>
                <option value="true_false" className="bg-slate-800">True/False</option>
                <option value="short_answer" className="bg-slate-800">Short Answer</option>
              </select>
            </div>
          </div>
          
          {/* Timer Settings */}
          <div className="mt-6">
            <label className="block text-white/80 text-sm font-medium mb-2">
              Timer Settings
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="timer"
                  checked={quizSettings.enableTimer}
                  onChange={() => setQuizSettings({...quizSettings, enableTimer: true})}
                  className="text-blue-500"
                />
                <span className="text-white/80">Enable Timer</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="timer"
                  checked={!quizSettings.enableTimer}
                  onChange={() => setQuizSettings({...quizSettings, enableTimer: false})}
                  className="text-blue-500"
                />
                <span className="text-white/80">No Timer</span>
              </label>
              {quizSettings.enableTimer && (
                <select
                  value={quizSettings.timeLimit}
                  onChange={(e) => setQuizSettings({...quizSettings, timeLimit: parseInt(e.target.value)})}
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                >
                  <option value={15} className="bg-slate-800">15 seconds</option>
                  <option value={30} className="bg-slate-800">30 seconds</option>
                  <option value={60} className="bg-slate-800">1 minute</option>
                  <option value={120} className="bg-slate-800">2 minutes</option>
                </select>
              )}
            </div>
          </div>
        </motion.div>

        {/* Generate Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center"
        >
          <button
            onClick={generateQuiz}
            disabled={!content.trim() || loading || analyzing}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto text-sm md:text-base"
          >
            {loading || analyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{analyzing ? 'Analyzing Document...' : 'Generating Quiz...'}</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Generate AI Quiz</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Generated Quiz Preview */}
        {generatedQuiz && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-6 md:mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20"
          >
            <h3 className="text-lg md:text-xl font-semibold text-white mb-4">
              Generated Quiz Preview
            </h3>
            <div className="space-y-4">
              {generatedQuiz.questions.map((question: any, index: number) => (
                <div key={index} className="bg-white/5 rounded-lg p-3 md:p-4">
                  <p className="text-white font-medium mb-2 text-sm md:text-base">
                    {index + 1}. {question.question}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center text-white/70 text-sm">
              Showing all {generatedQuiz.questions.length} questions
            </div>
            <div className="mt-6 flex justify-center">
              <button 
                onClick={startQuiz}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base"
              >
                Start Quiz
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CreateQuiz;