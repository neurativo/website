import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypingAnimationProps {
  statements: Array<{
    text: string;
    highlightedWords: string[];
  }>;
  speed?: number;
  pauseTime?: number;
  className?: string;
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({
  statements,
  speed = 100,
  pauseTime = 2000,
  className = ""
}) => {
  const [currentStatementIndex, setCurrentStatementIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentStatement = statements[currentStatementIndex];
    
    if (isTyping && !isDeleting) {
      if (currentText.length < currentStatement.text.length) {
        const timeout = setTimeout(() => {
          setCurrentText(currentStatement.text.slice(0, currentText.length + 1));
        }, speed);
        return () => clearTimeout(timeout);
      } else {
        // Finished typing, wait then start deleting
        const timeout = setTimeout(() => {
          setIsTyping(false);
          setIsDeleting(true);
        }, pauseTime);
        return () => clearTimeout(timeout);
      }
    } else if (isDeleting) {
      if (currentText.length > 0) {
        const timeout = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1));
        }, speed / 2); // Delete faster than typing
        return () => clearTimeout(timeout);
      } else {
        // Finished deleting, move to next statement
        setIsDeleting(false);
        setIsTyping(true);
        setCurrentStatementIndex((prev) => (prev + 1) % statements.length);
      }
    }
  }, [currentText, isTyping, isDeleting, currentStatementIndex, statements, speed, pauseTime]);

  const renderTextWithHighlights = (text: string, highlightedWords: string[]) => {
    const words = text.split(' ');
    return words.map((word, index) => {
      const isHighlighted = highlightedWords.some(highlighted => 
        word.toLowerCase().includes(highlighted.toLowerCase())
      );
      
      return (
        <span key={index}>
          <span className={isHighlighted ? "bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent" : "text-white"}>
            {word}
          </span>
          {index < words.length - 1 && <span className="text-white"> </span>}
        </span>
      );
    });
  };

  return (
    <div className={`inline-block ${className}`}>
      {renderTextWithHighlights(currentText, statements[currentStatementIndex].highlightedWords)}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="text-white"
      >
        |
      </motion.span>
    </div>
  );
};

export default TypingAnimation; 