import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Target, 
  BookOpen, 
  ArrowRight,
  Zap,
  TrendingUp,
  CheckCircle,
  Circle,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface KnowledgeNode {
  id: string;
  topic: string;
  description: string;
  difficulty: number;
  prerequisites: string[];
  related_topics: string[];
  quizzes: string[];
  mastery_level: number;
}

interface KnowledgeGraphProps {
  onClose: () => void;
  currentTopic?: string;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ onClose, currentTopic }) => {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [userKnowledge, setUserKnowledge] = useState<Map<string, number>>(new Map());
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetchKnowledgeGraph();
  }, [user]);

  const fetchKnowledgeGraph = async () => {
    try {
      // Fetch knowledge nodes
      const { data: nodeData } = await supabase
        .from('knowledge_nodes')
        .select('*')
        .order('difficulty');

      // Fetch user knowledge if logged in
      let userMasteryData = null;
      if (user) {
        const { data } = await supabase
          .from('user_knowledge')
          .select('*')
          .eq('user_id', user.id);
        userMasteryData = data;
      }

      if (nodeData) {
        const processedNodes = nodeData.map(node => ({
          ...node,
          mastery_level: userMasteryData?.find(uk => uk.topic === node.topic)?.mastery_level || 0
        }));
        setNodes(processedNodes);

        // Create user knowledge map
        const knowledgeMap = new Map();
        userMasteryData?.forEach(uk => {
          knowledgeMap.set(uk.topic, uk.mastery_level);
        });
        setUserKnowledge(knowledgeMap);

        // Auto-select current topic if provided
        if (currentTopic) {
          const currentNode = processedNodes.find(n => n.topic === currentTopic);
          if (currentNode) {
            setSelectedNode(currentNode);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching knowledge graph:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (node: KnowledgeNode) => {
    const mastery = node.mastery_level;
    if (mastery >= 80) return '#10b981'; // green
    if (mastery >= 50) return '#f59e0b'; // yellow
    if (mastery >= 20) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  const getPrerequisitesMet = (node: KnowledgeNode) => {
    return node.prerequisites.every(prereq => {
      const masteryLevel = userKnowledge.get(prereq) || 0;
      return masteryLevel >= 60; // 60% mastery considered "met"
    });
  };

  const renderGraphView = () => {
    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Simple circular layout
    const nodePositions = nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      const radius = 200 + node.difficulty * 30;
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      };
    });

    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Knowledge Graph</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/20 text-white/70'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'graph' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/20 text-white/70'
              }`}
            >
              Graph
            </button>
          </div>
        </div>

        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="border border-white/20 rounded-lg bg-black/20"
        >
          {/* Render connections */}
          {nodePositions.map(node => 
            node.related_topics.map(relatedTopic => {
              const relatedNode = nodePositions.find(n => n.topic === relatedTopic);
              if (relatedNode) {
                return (
                  <line
                    key={`${node.topic}-${relatedTopic}`}
                    x1={node.x}
                    y1={node.y}
                    x2={relatedNode.x}
                    y2={relatedNode.y}
                    stroke="#ffffff40"
                    strokeWidth="1"
                  />
                );
              }
              return null;
            })
          )}

          {/* Render nodes */}
          {nodePositions.map(node => (
            <g key={node.topic}>
              <circle
                cx={node.x}
                cy={node.y}
                r={20 + node.difficulty * 2}
                fill={getNodeColor(node)}
                stroke={selectedNode?.topic === node.topic ? '#3b82f6' : '#ffffff40'}
                strokeWidth={selectedNode?.topic === node.topic ? 3 : 1}
                className="cursor-pointer transition-all duration-200 hover:stroke-white"
                onClick={() => setSelectedNode(node)}
              />
              <text
                x={node.x}
                y={node.y + 40}
                textAnchor="middle"
                className="fill-white text-xs font-medium cursor-pointer"
                onClick={() => setSelectedNode(node)}
              >
                {node.topic}
              </text>
              {!getPrerequisitesMet(node) && (
                <circle
                  cx={node.x + 15}
                  cy={node.y - 15}
                  r={5}
                  fill="#ef4444"
                  className="animate-pulse"
                />
              )}
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-white/70">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Mastered (80%+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span>Learning (50%+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Started (20%+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
            <span>Not Started</span>
          </div>
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const sortedNodes = [...nodes].sort((a, b) => b.mastery_level - a.mastery_level);

    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Knowledge Topics</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedNodes.map(node => (
            <div
              key={node.topic}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                selectedNode?.topic === node.topic
                  ? 'bg-blue-500/20 border-blue-500/50'
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
              }`}
              onClick={() => setSelectedNode(node)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getNodeColor(node) }}
                  />
                  <div>
                    <h4 className="font-medium text-white">{node.topic}</h4>
                    <p className="text-sm text-white/70">{node.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    {node.mastery_level}%
                  </div>
                  <div className="text-xs text-white/70">
                    Level {node.difficulty}
                  </div>
                </div>
              </div>
              
              {node.prerequisites.length > 0 && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs text-white/60">Prerequisites:</span>
                  {node.prerequisites.map(prereq => (
                    <span
                      key={prereq}
                      className={`px-2 py-1 rounded-full text-xs ${
                        userKnowledge.get(prereq) >= 60
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {prereq}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderNodeDetails = () => {
    if (!selectedNode) return null;

    const prerequisitesMet = getPrerequisitesMet(selectedNode);

    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{selectedNode.topic}</h3>
          <div className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getNodeColor(selectedNode) }}
            />
            <span className="text-white font-medium">{selectedNode.mastery_level}%</span>
          </div>
        </div>

        <p className="text-white/70 mb-4">{selectedNode.description}</p>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Difficulty Level</h4>
            <div className="flex items-center space-x-2">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < selectedNode.difficulty ? 'bg-blue-500' : 'bg-white/20'
                  }`}
                />
              ))}
              <span className="text-sm text-white/70 ml-2">
                {selectedNode.difficulty}/10
              </span>
            </div>
          </div>

          {selectedNode.prerequisites.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Prerequisites</h4>
              <div className="space-y-1">
                {selectedNode.prerequisites.map(prereq => {
                  const masteryLevel = userKnowledge.get(prereq) || 0;
                  const isMet = masteryLevel >= 60;
                  return (
                    <div
                      key={prereq}
                      className="flex items-center justify-between p-2 bg-white/5 rounded"
                    >
                      <span className="text-white/80">{prereq}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-white/70">{masteryLevel}%</span>
                        {isMet ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedNode.related_topics.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Related Topics</h4>
              <div className="flex flex-wrap gap-2">
                {selectedNode.related_topics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => {
                      const relatedNode = nodes.find(n => n.topic === topic);
                      if (relatedNode) setSelectedNode(relatedNode);
                    }}
                    className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm hover:bg-blue-500/30 transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              disabled={!prerequisitesMet}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                prerequisitesMet
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                  : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Start Learning</span>
              </div>
            </button>
            <button className="flex-1 py-2 px-4 bg-blue-500/20 text-blue-400 rounded-lg font-medium hover:bg-blue-500/30 transition-colors">
              <div className="flex items-center justify-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Find Quizzes</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-6xl w-full border border-white/20 max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Knowledge Graph</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {viewMode === 'graph' ? renderGraphView() : renderListView()}
          </div>
          <div>
            {selectedNode ? renderNodeDetails() : (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
                <Brain className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/70">
                  Select a topic to view details and recommendations
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default KnowledgeGraph;