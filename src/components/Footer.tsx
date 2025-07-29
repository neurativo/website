import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Heart, 
  Github, 
  Twitter, 
  Mail, 
  MapPin,
  Zap,
  BookOpen,
  Users,
  Shield
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    about: [
      { name: 'About Us', href: '#' },
      { name: 'Contact', href: '#' }
    ],
    support: [
      { name: 'Suggestions', href: '#' },
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' }
    ]
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Mail, href: '#', label: 'Email' }
  ];

  return (
    <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-20 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1 flex flex-col items-center md:items-start">
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Neurativo</h3>
            </div>
            <p className="text-white/70 text-sm mb-4 leading-relaxed max-w-xs md:max-w-none">
              Transform your learning with Neurativo's AI-powered platform. Interactive, intelligent, and personalized education for everyone.
            </p>
            <div className="flex items-center justify-center md:justify-start space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-white/70 hover:text-white" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* About and Support Links - Side by Side on Mobile */}
          <div className="md:col-span-2 flex justify-center md:justify-start">
            <div className="grid grid-cols-2 gap-8 md:gap-16">
              {/* About Links */}
              <div className="flex flex-col items-center md:items-start">
                <h4 className="text-white font-semibold mb-4">About</h4>
                <ul className="space-y-2">
                  {footerLinks.about.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        className="text-white/70 hover:text-white text-sm transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support Links */}
              <div className="flex flex-col items-center md:items-start">
                <h4 className="text-white font-semibold mb-4">Support</h4>
                <ul className="space-y-2">
                  {footerLinks.support.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link.href}
                        className="text-white/70 hover:text-white text-sm transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">10K+</div>
            <div className="text-sm text-white/70">Active Learners</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">50K+</div>
            <div className="text-sm text-white/70">Quizzes Created</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">1M+</div>
            <div className="text-sm text-white/70">Questions Answered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">99%</div>
            <div className="text-sm text-white/70">Satisfaction Rate</div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10">
          <div className="flex items-center justify-center space-x-2 text-white/70 text-sm mb-4 md:mb-0">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-400" />
            <span>for learners worldwide</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-6 text-white/70 text-sm">
            <div className="flex items-center justify-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>Global Platform</span>
            </div>
            <span className="text-center">© {currentYear} Neurativo. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;