import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, AtSign, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Redirect if already logged in
  const from = (location.state as any)?.from?.pathname || '/';
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const cleanEmail = email.trim();
        
        // Auto-provision check for dedicated admin credentials
        if (cleanEmail === 'admin@nexashop.com' && password === 'AdminSecure2026!') {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          });

          if (signInError) {
            // Auto-signup Admin
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: cleanEmail,
              password,
              options: {
                data: {
                  username: 'admin',
                  full_name: 'Administrator'
                }
              }
            });

            if (signUpError) throw signUpError;

            if (signUpData.user) {
              // Set role to admin in profiles
              const { error: roleError } = await supabase
                .from('profiles')
                .update({ role: 'admin' })
                .eq('id', signUpData.user.id);

              if (roleError) throw roleError;

              // Sign in again
              const { error: reSignInError } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password
              });
              if (reSignInError) throw reSignInError;
            }
          }

          navigate('/admin', { replace: true });
          return;
        }

        // Standard Login Flow
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (loginError) throw loginError;

        // If the logged in user is admin, redirect to admin page, else to 'from'
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (profileData?.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else if (mode === 'signup') {
        if (!fullName.trim() || !username.trim()) {
          throw new Error("Full name and Username are required.");
        }
        const { error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              username: username.trim().toLowerCase()
            }
          }
        });
        if (signupError) throw signupError;
        setMessage("Signup successful! Please check your email for confirmation link.");
      } else if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`
        });
        if (resetError) throw resetError;
        setMessage("Password reset email sent! Check your inbox.");
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Check URL query parameters for reset mode
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('type') === 'recovery' || params.get('mode') === 'reset') {
      setMode('login'); // Can prompt password update modal later or handle it directly
      setMessage("Account recovery active. Log in to update your password in dashboard settings.");
    }
  }, [location]);

  return (
    <div className="min-h-screen pt-28 px-4 pb-12 flex flex-col justify-center items-center relative">
      <div className="bg-mesh"></div>
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-accent-purple/10 blur-3xl animate-pulse-glow -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent-blue/10 blur-3xl animate-pulse-glow -z-10" style={{ animationDelay: '2s' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel p-8 shadow-glass border border-white/10"
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-accent-indigo via-accent-purple to-accent-blue flex items-center justify-center shadow-neon font-black text-white text-2xl tracking-widest">
            N
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-3">
            {mode === 'login' && 'Welcome to NexaShop'}
            {mode === 'signup' && 'Create NexaShop Account'}
            {mode === 'forgot' && 'Reset your password'}
          </h2>
          <p className="text-xs text-gray-500">
            {mode === 'login' && 'Connect to browse the futuristic marketplace'}
            {mode === 'signup' && 'Join the next-generation e-commerce experience'}
            {mode === 'forgot' && 'We will email you a password recovery link'}
          </p>
        </div>

        {/* Info or error Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-lg bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-xs"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Sign Up Specific Fields */}
          {mode === 'signup' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                <div className="relative flex items-center bg-white/5 border border-white/5 focus-within:border-accent-purple/50 rounded-lg transition-all">
                  <User className="w-4 h-4 text-gray-500 absolute left-3" />
                  <input 
                    type="text" 
                    required
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-transparent border-none outline-none py-2.5 pl-10 pr-4 text-sm w-full text-white placeholder-gray-600"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Username</label>
                <div className="relative flex items-center bg-white/5 border border-white/5 focus-within:border-accent-purple/50 rounded-lg transition-all">
                  <AtSign className="w-4 h-4 text-gray-500 absolute left-3" />
                  <input 
                    type="text" 
                    required
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-transparent border-none outline-none py-2.5 pl-10 pr-4 text-sm w-full text-white placeholder-gray-600"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email input field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
            <div className="relative flex items-center bg-white/5 border border-white/5 focus-within:border-accent-purple/50 rounded-lg transition-all">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3" />
              <input 
                type="email" 
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-none outline-none py-2.5 pl-10 pr-4 text-sm w-full text-white placeholder-gray-600"
              />
            </div>
          </div>

          {/* Password field (except for forgot password mode) */}
          {mode !== 'forgot' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => setMode('forgot')}
                    className="text-[10px] text-accent-indigo hover:text-accent-purple font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center bg-white/5 border border-white/5 focus-within:border-accent-purple/50 rounded-lg transition-all">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-none outline-none py-2.5 pl-10 pr-10 text-sm w-full text-white placeholder-gray-600"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Primary CTA Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm cursor-pointer bg-gradient-to-r from-accent-indigo via-accent-purple to-accent-blue text-white shadow-neon flex items-center justify-center gap-2 hover:opacity-95 transition-all"
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
            ) : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'signup' && 'Get Started'}
                {mode === 'forgot' && 'Send Recovery Email'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* OAuth Google Divider */}
        {mode !== 'forgot' && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="h-px bg-white/5 flex-grow"></div>
              <span className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">Or continue with</span>
              <div className="h-px bg-white/5 flex-grow"></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 rounded-xl border border-white/5 hover:border-white/10 bg-white/5 text-gray-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2.5 cursor-pointer transition-all"
            >
              {/* Google SVG Logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.176 4.114a5.99 5.99 0 0 1-6-6c0-3.31 2.69-6 6-6 1.496 0 2.87.55 3.927 1.455l3.14-3.14A9.972 9.972 0 0 0 12.24 2c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.772 0 10.155-4.053 10.155-10.174 0-.616-.07-1.189-.188-1.54H12.24Z"/>
              </svg>
              Google Account
            </button>
          </>
        )}

        {/* Toggle Mode Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 flex flex-col gap-3">
          <div>
            {mode === 'login' && (
              <>
                Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="text-accent-indigo hover:text-accent-purple font-semibold hover:underline cursor-pointer">
                  Create Account
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-accent-indigo hover:text-accent-purple font-semibold hover:underline cursor-pointer">
                  Sign In
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <button onClick={() => setMode('login')} className="text-accent-indigo hover:text-accent-purple font-semibold hover:underline cursor-pointer">
                Back to Sign In
              </button>
            )}
          </div>
          
          {mode === 'login' && (
            <div className="border-t border-white/5 pt-3">
              <span className="text-[11px] text-gray-600">Are you an administrator? </span>
              <Link to="/admin" className="text-yellow-500 hover:text-yellow-400 font-bold hover:underline">
                Sign In as Admin
              </Link>
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
};
