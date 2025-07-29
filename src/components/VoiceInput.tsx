import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause,
  RotateCcw,
  CheckCircle,
  X
} from 'lucide-react';

interface VoiceInputProps {
  onVoiceInput: (text: string) => void;
  onClose: () => void;
  question: string;
  isActive?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onVoiceInput, 
  onClose, 
  question, 
  isActive = false 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            setConfidence(confidence);
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    if (SpeechSynthesis) {
      synthRef.current = SpeechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && isSupported) {
      setTranscript('');
      setConfidence(0);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakQuestion = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = volume;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setConfidence(0);
  };

  const submitAnswer = () => {
    if (transcript.trim()) {
      onVoiceInput(transcript.trim());
      onClose();
    }
  };

  const getConfidenceColor = () => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-white/20 text-center"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MicOff className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Voice Input Not Supported
          </h3>
          <p className="text-white/70 mb-6">
            Your browser doesn't support speech recognition. Please use a modern browser like Chrome or Firefox.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-lg w-full border border-white/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Voice Input</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Question */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Question</h3>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-white/70">Volume:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16"
              />
              <button
                onClick={isPlaying ? stopSpeaking : speakQuestion}
                className={`p-2 rounded-lg ${
                  isPlaying 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="text-white/80">{question}</p>
        </div>

        {/* Voice Recording */}
        <div className="text-center mb-6">
          <div className="relative mb-4">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
                isListening
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              }`}
            >
              {isListening ? (
                <MicOff className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>
            
            {isListening && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 rounded-full border-2 border-red-400/50 animate-ping"
              />
            )}
          </div>
          
          <p className="text-white/70 text-sm">
            {isListening ? 'Listening... Speak your answer' : 'Click to start recording'}
          </p>
        </div>

        {/* Transcript */}
        <div className="bg-white/5 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">Your Answer</h3>
            <div className="flex items-center space-x-2">
              {confidence > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-white/70">Confidence:</span>
                  <span className={`text-xs font-medium ${getConfidenceColor()}`}>
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
              )}
              <button
                onClick={clearTranscript}
                className="p-1 text-white/70 hover:text-white"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="min-h-[60px] p-3 bg-white/5 rounded-lg">
            {transcript ? (
              <p className="text-white/90">{transcript}</p>
            ) : (
              <p className="text-white/40 italic">Your spoken answer will appear here...</p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold border border-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submitAnswer}
            disabled={!transcript.trim()}
            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Submit Answer</span>
            </div>
          </button>
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
          <p className="text-sm">
            💡 <strong>Tips:</strong> Speak clearly and at a moderate pace. 
            You can re-record your answer anytime before submitting.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VoiceInput;