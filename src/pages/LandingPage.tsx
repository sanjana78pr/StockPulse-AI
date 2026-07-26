import { Link } from 'react-router-dom';
import { Activity, Shield, Zap, BarChart3, ChevronRight, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">StockPulse AI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Sign in</Link>
          <Link to="/login" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 text-center flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-gray-300 mb-8"
        >
          <Zap className="w-4 h-4 text-blue-400" />
          <span>Powered by advanced machine learning</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-br from-white via-white to-gray-500 bg-clip-text text-transparent"
        >
          Intelligence for the <br className="hidden md:block" /> modern investor.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10"
        >
          Real-time market analytics, trend prediction, and portfolio risk management in one beautifully designed platform.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center"
        >
          <Link to="/app" className="inline-flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-medium text-lg transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)]">
            Open Dashboard <ChevronRight className="w-5 h-5" />
          </Link>
          <button className="inline-flex justify-center items-center bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-full font-medium text-lg border border-white/10 transition-colors">
            View Demo
          </button>
        </motion.div>
      </main>

      {/* Features Grid */}
      <div className="relative z-10 bg-black/50 border-t border-white/5 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: BarChart3, title: "Real-Time Analytics", desc: "Institutional-grade data streaming with millisecond latency for precise market timing." },
              { icon: Shield, title: "Risk Management", desc: "Advanced portfolio modeling, Value at Risk (VaR), and dynamic asset allocation strategies." },
              { icon: Globe, title: "Global Coverage", desc: "Monitor equities, forex, and crypto across all major global exchanges in one unified view." }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white/5 border border-white/5 rounded-2xl p-8 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20">
                  <f.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}