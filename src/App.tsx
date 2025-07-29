import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import PWASetup from './components/PWASetup';
import ScrollToTop from './components/ScrollToTop';
import Aurora from './components/Aurora';
import Home from './pages/Home';
import QuizLibrary from './pages/QuizLibrary';
import Quiz from './pages/Quiz';
import CreateQuiz from './pages/CreateQuiz';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Admin from './pages/Admin';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <SubscriptionProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundRepeat: 'repeat'
                }}></div>
              </div>
              
              <Aurora 
                colorStops={["#6366f1", "#8b5cf6", "#ec4899"]}
                amplitude={0.4}
                blend={0.25}
                speed={0.25}
              />
              
              <div className="relative z-10">
                <Navigation />
                
                <main className="pt-16 md:pt-20 pb-20 md:pb-8">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/library" element={<QuizLibrary />} />
                    <Route path="/quiz/:id" element={<Quiz />} />
                    <Route path="/create" element={<CreateQuiz />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/admin" element={<Admin />} />
                  </Routes>
                </main>
                
                <Footer />
              </div>
              
              <Toaster 
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  className: 'bg-white/90 backdrop-blur-sm',
                  style: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }
                }}
              />
              
              <PWASetup />
            </div>
          </Router>
        </SubscriptionProvider>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;