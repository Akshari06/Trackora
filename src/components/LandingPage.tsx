import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogIn, TrendingUp, Users, ArrowRight, Zap, Bot, Shield, Star } from 'lucide-react';
import { loginWithGoogle } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import GalaxyBackground from './GalaxyBackground';

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/app');
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        navigate('/app');
      }
    } catch (error: any) {
      // loginWithGoogle already handles common errors
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen selection:bg-purple-500/30 overflow-x-hidden transition-colors duration-500",
      theme === 'dark' ? "bg-[#030014] text-white" : "bg-white text-slate-900"
    )}>
      <GalaxyBackground />

      {/* Header */}
      <header className={cn(
        "fixed top-0 w-full z-50 backdrop-blur-md border-b transition-all duration-300",
        theme === 'dark' ? "bg-black/20 border-white/10" : "bg-white/80 border-slate-200"
      )}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold",
              theme === 'dark' ? "bg-purple-600 neon-border shadow-purple-500/50" : "bg-brand-primary"
            )}>T</div>
            <span className={cn(
              "font-display text-xl font-bold tracking-tight",
              theme === 'dark' && "neon-text"
            )}>TRACKORA</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogin}
              className={cn(
                "hidden md:flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all",
                theme === 'dark' ? "hover:bg-white/5" : "hover:bg-slate-50"
              )}
            >
              Sign in
            </button>
            <button 
              onClick={handleLogin}
              className={cn(
                "px-6 py-2 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95",
                theme === 'dark' 
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                  : "bg-brand-primary text-white"
              )}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8 border",
              theme === 'dark' ? "bg-purple-500/10 border-purple-500/30 text-purple-400" : "bg-brand-primary/5 border-brand-primary/10 text-brand-primary"
            )}>
              <Star className="w-4 h-4 fill-current" />
              <span>Next Generation Education Tracking</span>
            </div>
            
            <h1 className={cn(
              "text-5xl md:text-8xl font-bold tracking-tighter leading-[1.1] mb-8",
              theme === 'dark' && "bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40"
            )}>
              Elevate Student Potential <br />
              With <span className={cn(theme === 'dark' ? "text-purple-500 neon-text" : "text-brand-primary")}>AI Precision.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Track progress, monitor skills, and leverage AI insights to prevent dropouts and foster excellence in every classroom.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={handleLogin} 
                className={cn(
                  "w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all",
                  theme === 'dark' 
                    ? "bg-purple-600 text-white shadow-xl shadow-purple-600/40 hover:bg-purple-500" 
                    : "bg-brand-primary text-white hover:opacity-90"
                )}
              >
                Join the Mission
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                className={cn(
                  "w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg border transition-all",
                  theme === 'dark' ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"
                )}
              >
                Explore Features
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative Glows */}
        {theme === 'dark' && (
          <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[80px] -z-10" />
          </>
        )}
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className={cn(
              "group p-8 rounded-3xl border transition-all hover:scale-[1.02]",
              theme === 'dark' ? "bg-white/5 border-white/10 hover:border-purple-500/50" : "bg-white border-slate-200"
            )}>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-500">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Progress Tracking</h3>
              <p className="text-slate-500 leading-relaxed">
                Comprehensive tracking of lessons, activities, and performance metrics with detailed visual trends.
              </p>
            </div>
            
            <div className={cn(
              "group p-8 rounded-3xl border transition-all hover:scale-[1.02]",
              theme === 'dark' ? "bg-white/5 border-white/10 hover:border-blue-500/50" : "bg-white border-slate-200"
            )}>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-500">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Skill Management</h3>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Offered & Learning</h4>
              <p className="text-slate-500 leading-relaxed">
                Monitor student proficiency across various categories and set clear learning paths for every individual.
              </p>
            </div>

            <div className={cn(
              "group p-8 rounded-3xl border transition-all hover:scale-[1.02]",
              theme === 'dark' ? "bg-white/5 border-white/10 hover:border-pink-500/50" : "bg-white border-slate-200"
            )}>
              <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6 text-pink-500">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-4">AI Chatbot</h3>
              <p className="text-slate-500 leading-relaxed">
                Gemini-powered insights at your fingertips. Ask questions about student progress and get smart recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to transform your Institution?</h2>
            <button 
              onClick={handleLogin}
              className={cn(
                "px-12 py-5 rounded-full font-bold text-xl transition-all transform hover:scale-105 active:scale-95",
                theme === 'dark' 
                  ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]" 
                  : "bg-slate-900 text-white shadow-xl shadow-slate-900/20"
              )}
            >
              Get Started Now
            </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-slate-500 text-sm">© 2026 Trackora. All rights reserved.</p>
          <div className="flex gap-8 text-sm text-slate-500">
            <button onClick={toggleTheme} className="hover:text-white transition-colors">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
