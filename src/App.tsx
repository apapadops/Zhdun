/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  MessageSquare,
  LayoutDashboard,
  Trello,
  Send,
  User,
  Bot,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Clock,
  ExternalLink,
  Plus,
  ArrowRight,
  Target,
  BarChart3,
  Dna,
  Package,
  Layers,
  ChevronRight,
  Star,
  Save,
  Loader2,
  Zap,
  PieChart,
  Briefcase,
  LineChart,
  ArrowLeft,
  X,
  Home,
  ShieldCheck,
  Rocket,
  Search,
  Download,
  Filter,
  Activity,
  AlertTriangle,
  FileText,
  ClipboardList,
  RefreshCw,
  Table
} from 'lucide-react';
import { 
  TransformationCase, 
  ProjectStatus, 
  ProjectDecision, 
  TshirtSize, 
  Message, 
  AIGovernanceCase, 
  AIGovernanceDecision 
} from './types';
import { DEMO_DATA, DEMO_GOVERNANCE_CASES } from './constants';
import { callGemini, callGeminiOnce } from './geminiService';

import AIGovernanceModule from './components/AIGovernanceModule';
import { auth } from './firebase';
import { authService } from './services/authService';
import { governanceService } from './services/firestoreService';

const ADMIN_EMAILS = [
  'al.papadopoulos@kaizengaming.com',
  'm.chatzicharalampous@kaizengaming.com',
  'v.vlachakis@kaizengaming.com'
];

// --- HELPERS ---

const formatCurrency = (val: string | number) => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);
};

const getStatusColor = (status: ProjectStatus, decision: ProjectDecision | null) => {
  if (status === ProjectStatus.PENDING) return 'amber';
  if (status === ProjectStatus.REVIEW) return 'teal';
  if (decision === ProjectDecision.GO) return 'green';
  if (decision === ProjectDecision.NOGO) return 'red';
  if (decision === ProjectDecision.HOLD) return 'purple';
  return 'slate';
};

const EditableMetric = ({ label, value, note, onSave, isCurrency }: { label: string, value: string, note?: string, onSave: (v: string) => void, isCurrency?: boolean }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);

  useEffect(() => {
    setVal(value);
  }, [value]);

  if (isEditing) {
    return (
      <div className="bg-white p-3 rounded-lg border border-teal shadow-md animate-in fade-in zoom-in duration-200">
        <p className="text-[10px] font-bold text-teal uppercase leading-none mb-1">{label}</p>
        <input 
          autoFocus
          className="w-full text-lg font-mono font-bold text-base outline-none bg-teal-lt/30 px-1 rounded" 
          value={val} 
          onChange={e => setVal(e.target.value)}
          onBlur={() => { onSave(val); setIsEditing(false); }}
          onKeyDown={e => e.key === 'Enter' && (e.currentTarget.blur())}
        />
      </div>
    );
  }

  return (
    <div 
      className="bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm cursor-pointer group hover:bg-white hover:border-teal/30 transition-all"
      onClick={() => setIsEditing(true)}
    >
      <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1 group-hover:text-teal transition-colors">{label}</p>
      <p className="text-lg font-mono font-bold text-base group-hover:text-teal-dk transition-colors">
        {isCurrency && value ? formatCurrency(value) : (value || '—')}
      </p>
      {note && <p className="text-[8px] text-gray-400 mt-1 italic">{note}</p>}
    </div>
  );
};

// --- COMPONENTS ---

const Badge = ({ children, color = 'slate' }: { children: React.ReactNode; color?: string; key?: string | number }) => {
  const colors: Record<string, string> = {
    teal: 'bg-teal-lt text-teal-dk border-teal-dk/20',
    amber: 'bg-amber-lt text-amber-dk border-amber-dk/20',
    green: 'bg-green-lt text-green-dk border-green-dk/20',
    red: 'bg-red-lt text-red-dk border-red-dk/20',
    purple: 'bg-purple-lt text-purple-dk border-purple-dk/20',
    blue: 'bg-blue-lt text-blue-dk border-blue-dk/20',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
};

const BigBetBadge = ({ driver }: { driver: string }) => {
  const configs: Record<string, { bg: string, text: string, icon: string }> = {
    'Hey Betano': { bg: '#FFF0E6', text: '#CC8F66', icon: '🤖' },
    'Shield Betano': { bg: '#E9F1FC', text: '#5C7DA6', icon: '🛡' },
    'Betano Republic': { bg: '#F2F1F9', text: '#6D6B90', icon: '🌍' },
    'Core Betano': { bg: '#EEF3EF', text: '#6B7B6E', icon: '⚡' },
  };
  
  const config = configs[driver] || { bg: '#f1f5f9', text: '#475569', icon: '🎯' };
  
  return (
    <span 
      className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-black/5 shadow-sm inline-flex"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      <span>{config.icon}</span>
      <span className="uppercase tracking-tight">{driver}</span>
    </span>
  );
};

// --- MAIN APP ---

export default function App() {
  const [selectedModule, setSelectedModule] = useState<'transformation' | 'governance' | null>(null);
  const [activeTab, setActiveTab] = useState<'wizard' | 'pipeline' | 'dashboard'>('wizard');
  const [cases, setCases] = useState<TransformationCase[]>([]);
  const [aiCases, setAiCases] = useState<AIGovernanceCase[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLogoutMenuOpen, setIsLogoutMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthSync((u) => {
      setUser(u);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Keep local storage as fallback or for transformation cases (not yet DB-bound)
    const saved = localStorage.getItem('transformation_cases');
    if (saved) {
      setCases(JSON.parse(saved));
    } else {
      setCases(DEMO_DATA);
      localStorage.setItem('transformation_cases', JSON.stringify(DEMO_DATA));
    }

    if (!user) {
      const savedAi = localStorage.getItem('ai_governance_cases');
      if (savedAi) {
        setAiCases(JSON.parse(savedAi));
      } else {
        setAiCases(DEMO_GOVERNANCE_CASES);
      }
    }
  }, [user]);

  const updateCases = useCallback((newCases: TransformationCase[]) => {
    setCases(newCases);
    localStorage.setItem('transformation_cases', JSON.stringify(newCases));
  }, []);

  const updateAiCases = useCallback((newCases: AIGovernanceCase[]) => {
    setAiCases(newCases);
    if (!user) {
      localStorage.setItem('ai_governance_cases', JSON.stringify(newCases));
    }
  }, [user]);

  if (isLoadingAuth) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-56 h-56 flex items-center justify-center mb-8"
        >
          <img src="/logo.png" alt="Zhdun" className="w-full h-full object-contain" />
        </motion.div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic mb-2">ZH<span className="text-teal">DUN</span></h2>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">Establishing Connection Node</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Animated Background Accents */}
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-teal/10 blur-[140px] rounded-full" 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, -60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange/10 blur-[140px] rounded-full" 
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-md w-full bg-white/70 backdrop-blur-xl p-12 md:p-16 rounded-[3.5rem] border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative z-10 text-center"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="w-56 h-56 flex items-center justify-center mx-auto mb-10"
          >
            <img src="/logo.png" alt="Zhdun" className="w-full h-full object-contain" />
          </motion.div>
          
          <h1 className="text-5xl font-black text-teal-dk tracking-tighter italic mb-4">
            ZH<span className="text-teal">DUN</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-12 opacity-80">Central Operations Hub</p>
          
          <div className="space-y-6">
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
              Welcome to the unified transformation portal. Please sign in to access the Zhdun ecosystem.
            </p>
            
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => authService.signInWithGoogle()}
              className="w-full bg-slate-900 border border-slate-800 py-5 px-8 rounded-3xl flex items-center justify-center gap-4 hover:shadow-2xl hover:shadow-teal/20 transition-all group"
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-slate-900 text-[10px] font-black group-hover:scale-110 transition-transform">G</div>
              <span className="text-sm font-black uppercase tracking-widest text-white">Authorize with Google</span>
            </motion.button>
          </div>
          
          <p className="mt-12 text-[9px] text-slate-300 font-black uppercase tracking-[0.3em]">
            Enterprise Security Enforced
          </p>
        </motion.div>
        
        <div className="absolute bottom-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] opacity-50">
          ZHDUN OS // 2026
        </div>
      </div>
    );
  }

  if (!selectedModule) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Abstract Background Elements */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal/10 blur-[140px] rounded-full" 
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 18, repeat: Infinity }}
          className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange/10 blur-[140px] rounded-full" 
        />

        <div className="max-w-6xl w-full text-center relative z-10">
          <div className="fixed top-8 right-8 z-50">
            <div className="relative">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => {
                  if (window.innerWidth < 640) {
                    setIsLogoutMenuOpen(!isLogoutMenuOpen);
                  }
                }}
                className="flex items-center gap-4 bg-white/70 backdrop-blur-xl p-2 sm:pl-6 rounded-[2rem] border border-white/50 shadow-2xl cursor-pointer sm:cursor-default relative z-10"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-black text-slate-900 uppercase leading-none tracking-tight">{user.displayName}</p>
                  <button onClick={(e) => { e.stopPropagation(); authService.logout(); }} className="text-[9px] font-black text-red uppercase tracking-widest hover:text-red-dk transition-colors mt-1 cursor-pointer">Disconnect</button>
                </div>
                <img 
                  src={user.photoURL} 
                  alt="" 
                  className="w-10 h-10 rounded-2xl border-2 border-white shadow-md active:scale-95 transition-transform"
                />
              </motion.div>

              <AnimatePresence>
                {isLogoutMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-3 sm:hidden"
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        authService.logout();
                        setIsLogoutMenuOpen(false);
                      }}
                      className="bg-red text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      <X size={14} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <div className="flex flex-col items-center justify-center gap-6 mb-10">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-64 h-64 flex items-center justify-center mx-auto mb-10"
              >
                <img src="/logo.png" alt="Zhdun" className="w-full h-full object-contain" />
              </motion.div>
              <div className="text-center">
                <h1 className="text-7xl font-black text-slate-900 tracking-tighter italic leading-none mb-4">ZH<span className="text-teal">DUN</span></h1>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.6em] opacity-80">Operational Intelligence Platform</p>
              </div>
            </div>
            <p className="text-slate-500 font-medium text-xl max-w-2xl mx-auto leading-relaxed">
              Precision orchestration for Kaizen's transformation roadmap. Seamless governance and data-driven oversight.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Transformation Option */}
            <motion.button
              whileHover={{ scale: 1.02, y: -8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedModule('transformation')}
              className="bg-white/80 backdrop-blur-lg p-12 rounded-[4rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.12)] hover:border-teal/20 transition-all text-left flex flex-col group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal/5 rounded-full -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000" />
              <div className="w-20 h-20 bg-teal text-white rounded-[2rem] flex items-center justify-center mb-10 group-hover:bg-slate-900 transition-colors duration-500 shadow-xl shadow-teal/30">
                <Rocket size={36} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Project Engine</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 flex-1">
                Initiate initiatives with AI assistance. Monitor ROI, FTE velocity, and strategic alignment in real-time.
              </p>
              <div className="flex items-center gap-3 text-teal font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                Initialize System <ArrowRight size={14} />
              </div>
            </motion.button>

            {/* Governance Option */}
            <motion.button
              whileHover={{ scale: 1.02, y: -8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedModule('governance')}
              className="bg-slate-900 p-12 rounded-[4rem] border border-slate-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.3)] transition-all text-left flex flex-col group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000" />
              <div className="w-20 h-20 bg-white/10 text-white rounded-[2rem] flex items-center justify-center mb-10 group-hover:bg-white group-hover:text-slate-900 transition-colors duration-500 border border-white/10">
                <ShieldCheck size={36} />
              </div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Governance Center</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 flex-1">
                Maintain absolute compliance. Perform high-criticality audits and browse the validated AI asset registry.
              </p>
              <div className="flex items-center gap-3 text-white font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                Security Protocol <ArrowRight size={14} />
              </div>
            </motion.button>
          </div>
        </div>

        <div className="absolute bottom-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.8em] opacity-40">
          ZHDUN SECURED ECOSYSTEM
        </div>
      </div>
    );
  }

  if (selectedModule === 'governance') {
    return (
      <AIGovernanceModule 
        cases={aiCases} 
        onUpdateCases={updateAiCases} 
        onBack={() => setSelectedModule(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      {/* Header */}
      <header className="h-20 bg-white/80 backdrop-blur-lg border-b border-slate-100 px-10 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setSelectedModule(null)}
            className="p-3 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-400 rounded-2xl transition-all shadow-sm group"
            title="Module Selection"
          >
            <Home size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          <div className="w-[1px] h-10 bg-slate-100" />
          <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Z" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter text-slate-900 flex items-center gap-3">
              ZH<span className="text-teal">DUN</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 not-italic">Suite 5.0</span>
            </h1>
          </div>
        </div>

        <nav className="flex gap-2 bg-slate-100/50 p-1.5 rounded-3xl border border-slate-200/50">
          {[
            { id: 'wizard', label: 'Draft', icon: Plus },
            { id: 'pipeline', label: 'Pipeline', icon: Trello },
            { id: 'dashboard', label: 'Insights', icon: LayoutDashboard }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-[1.25rem] text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-white shadow-xl shadow-slate-900/5 text-teal border border-slate-200' 
                  : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <tab.icon size={14} strokeWidth={3} />
                {tab.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <div className="text-right hidden lg:block">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{user.displayName}</p>
            <p className="text-[9px] font-black text-teal uppercase tracking-widest leading-none">{cases.length} Nodes Active</p>
          </div>
          <img src={user.photoURL} alt="" className="w-11 h-11 rounded-2xl border-2 border-white shadow-xl" />
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'wizard' && (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <IntakeWizard user={user} onCaseSubmit={(newCase) => updateCases([newCase, ...cases])} />
            </motion.div>
          )}

            {activeTab === 'pipeline' && (
              ADMIN_EMAILS.includes(user?.email || '') ? (
                <motion.div
                  key="pipeline"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-full"
                >
                  <AssessmentPipeline cases={cases} onUpdateCases={updateCases} />
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-xl text-center max-w-sm">
                    <ShieldCheck size={48} className="text-red mx-auto mb-6" />
                    <h3 className="text-xl font-black text-teal-dk uppercase italic mb-2">Access Restricted</h3>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed">
                      Only authorized Transformation Leads can access the Assessment Pipeline. Please contact your administrator.
                    </p>
                  </div>
                </div>
              )
            )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <ExecutiveDashboard cases={cases} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- TAB 1: INTAKE WIZARD ---

function IntakeWizard({ user, onCaseSubmit }: { user: any, onCaseSubmit: (c: TransformationCase) => void }) {
  const [history, setHistory] = useState<Message[]>([
    { role: 'assistant', content: `Hello ${user?.displayName?.split(' ')[0] || ''}! I'm the Transformation Team assistant. I'm here to help you build a robust business case for your project. What's the name of the project you're thinking about?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [completedCase, setCompletedCase] = useState<Partial<TransformationCase> | null>(null);
  const [candidateData, setCandidateData] = useState<Partial<TransformationCase>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  const WIZARD_PROMPT = `
You are ZHDUN, the specialized transformation architect for Kaizen Gaming. Conduct a friendly yet high-precision conversational interview to intake a new initiative business case.

Rules:
- You are ZHDUN. Maintain a calm, helpful, and highly efficient persona.
- Ask ONE question at a time. Max 2-3 sentences. No bullet points.
- Be warm and conversational — not form-like.
- When stakeholder doesn't know a number, help them estimate via indirect questions (e.g. "how many people do this and how often per week?") then compute and confirm with them.
- Show calculations clearly: "So that's X people × Y times/week × 4 weeks = Z per month — does that sound right?"
- Once you have volume + hours + team profile, compute and present the annual FTE cost with working shown.
- Track what you've collected. Never re-ask something already answered.
- After every message, output exactly 'STATE:{"field": "value", ...}' on a new line with ALL fields collected/computed so far. This will be hidden.
- When you have ALL fields, output your closing message then on a NEW LINE output exactly:
CASE_COMPLETE:{"requestor_name":"","requestor_department":"","project_title":"","teams_involved":"","markets_affected":"","duration":"","problem_statement":"","expected_outcome":"","volume_per_month":"","hours_per_case":"","team_profile":"","annual_fte_cost":"","annual_hours":"","fte_saving_est":"","soft_benefits":"","strategic_driver":"","deadline":"","impl_cost":"","payback_months":"","tier":"T2","tshirt":"M","flags":[]}

Kaizen Gaming Context:
Active Markets: Argentinian Spanish (CABA/PBA/MZA), Brazilian Portuguese, Bulgarian, Colombian Spanish, Czech, Danish, Ecuadorian Spanish, English (Nigeria, Ontario, UK, Ghana), Flemish/French, German, Mexican Spanish, Peruvian Spanish, Portuguese, Romanian.

Big Bets (Strategic Drivers):
1. Hey Betano (AI Focus): CX differentiation, AI-ready infrastructure, back-office efficiency.
2. Shield Betano (Governance & Risk): Corporate Governance, Regulatory/RG/AML, Privacy/Cybersecurity.
3. Betano Republic (Operating Model): Task delegation, RACI, market tiering/playbooks, talent mobility.
4. Core Betano (Foundational): Operational excellence, automation, CX enhancement.

Fields to collect in order:
1. requestor_name, requestor_department (ask "Which department or team are you from?"), project_title, markets_affected (Which of Kaizen's markets does this project affect?)
2. problem_statement, expected_outcome (What would success look like for you? What do you expect to have at the end?)
3. volume_per_month, hours_per_case, team_profile (seniority+country), duration
4. teams_involved (comma-separated list of participating teams), soft_benefits, strategic_driver (Big Bets), deadline

DO NOT ask about impl_cost or payback_months. Set them to "" in CASE_COMPLETE.

Salary Benchmarks (gross * 1.35 multiplier, 1720 working hours/year):
- Greece/Cyprus/Malta region: Junior €20k, Mid €30k, Senior €45k, Manager €60k
- Eastern Europe (Romania, Bulgaria, Czech): Junior €15k, Mid €22k, Senior €35k, Manager €50k
- Western Europe (UK, Germany, Flemish/French, Danish): Junior €28k, Mid €42k, Senior €60k, Manager €80k
- Latin America (Argentina, Colombia, Ecuador, Mexico, Peru, Brazil): Junior €12k, Mid €18k, Senior €28k, Manager €40k
- Other/Mixed: Junior €20k, Mid €30k, Senior €44k, Manager €58k

Computations:
annual_hours = volume_per_month * hours_per_case * 12
loaded_hourly_rate = (salary * 1.35) / 1720
annual_fte_cost = annual_hours * loaded_hourly_rate
fte_saving_est = annual_hours / 1720
tier: score = teams_involved_count(1..3) + duration_score(1..3). T1 <= 4, T2 <= 7, T3 > 7.
tshirt: S(T1), M(T2 < 2m), L(T2/T3), XL(T3 & 3m+).
  `.trim();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', content: input };
    setHistory(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      let response = await callGemini(WIZARD_PROMPT, [...history, userMessage]);
      
      // Parse STATE: updates first
      if (response.includes('STATE:')) {
        const stateParts = response.split('STATE:');
        const stateJsonStr = stateParts[1].split('\n')[0].trim();
        try {
          const stateUpdate = JSON.parse(stateJsonStr);
          setCandidateData(prev => ({ ...prev, ...stateUpdate }));
          response = response.replace(/STATE:\{.*?\}/, '').trim();
        } catch (e) {
          console.error("Failed to parse state update", e);
        }
      }

      if (response.includes('CASE_COMPLETE:')) {
        const parts = response.split('CASE_COMPLETE:');
        const text = parts[0].trim();
        const jsonStr = parts[1].trim();
        
        try {
          const caseData = JSON.parse(jsonStr);
          setCompletedCase(caseData);
          setCandidateData(caseData);
          setHistory(prev => [...prev, { role: 'assistant', content: text }]);
        } catch (e) {
          console.error("Failed to parse completion JSON", e);
          setHistory(prev => [...prev, { role: 'assistant', content: response }]);
        }
      } else {
        setHistory(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (err) {
      setHistory(prev => [...prev, { role: 'assistant', content: "I'm having a bit of trouble connecting. Could you please check your AI Studio Secrets for a GEMINI_API_KEY?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const submitToPipeline = () => {
    if (!completedCase) return;

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#92B0A9', '#FFB380', '#A3B9A8']
    });

    const finalCase: TransformationCase = {
      ...completedCase as TransformationCase,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      decided_at: null,
      status: ProjectStatus.PENDING,
      decision: null,
      score_problem: 0,
      score_benefit: 0,
      score_strategic: 0,
      score_feasibility: 0,
      score_urgency: 0,
      score_data: 0,
      assessment_notes: "",
      requestor_name: user?.displayName || (completedCase as any).requestor_name,
      requestor_email: user?.email,
    };
    onCaseSubmit(finalCase);
    setHistory([{ role: 'assistant', content: "Case submitted! Would you like to start another project intake?" }]);
    setCompletedCase(null);
    setCandidateData({});
  };

  // Phase tracker logic
  const PHASES = [
    { name: 'Who & what', fields: ['requestor_name', 'requestor_department', 'project_title', 'markets_affected'] },
    { name: 'Problem & outcome', fields: ['problem_statement', 'expected_outcome'] },
    { name: 'Baseline metrics', fields: ['volume_per_month', 'hours_per_case', 'annual_fte_cost'] },
    { name: 'Strategic fit', fields: ['strategic_driver', 'deadline'] },
    { name: 'Review & submit', fields: ['tier', 'tshirt'] }
  ];

  const getPhaseStatus = (phaseIdx: number) => {
    const phase = PHASES[phaseIdx];
    const completedCount = phase.fields.filter(f => candidateData[f as keyof TransformationCase]).length;
    
    if (completedCount === phase.fields.length) return 'completed';
    if (phaseIdx === 0) return completedCount > 0 ? 'active' : 'active';
    const prevPhase = PHASES[phaseIdx - 1];
    const prevCompleted = prevPhase.fields.every(f => candidateData[f as keyof TransformationCase]);
    if (prevCompleted) return 'active';
    return 'pending';
  };

  const TRACKED_FIELDS = [
    { label: 'Requestor', field: 'requestor_name' },
    { label: 'Dept', field: 'requestor_department' },
    { label: 'Project', field: 'project_title' },
    { label: 'Markets', field: 'markets_affected' },
    { label: 'Duration', field: 'duration' },
    { label: 'Volume', field: 'volume_per_month' },
    { label: 'FTE cost', field: 'annual_fte_cost' },
    { label: 'Big Bet', field: 'strategic_driver' },
  ];

  const capturedFields = TRACKED_FIELDS.filter(f => 
    candidateData[f.field as keyof TransformationCase] !== undefined && 
    candidateData[f.field as keyof TransformationCase] !== "" &&
    candidateData[f.field as keyof TransformationCase] !== null
  );

  const progressPercent = Math.min(100, Math.round((capturedFields.length / TRACKED_FIELDS.length) * 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:h-[calc(100vh-140px)] overflow-y-auto lg:overflow-hidden">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <Target className="text-teal" size={18} />
            Intake Progress
          </h3>
          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden mb-2">
            <motion.div 
              className="bg-teal h-full" 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
            <span>{progressPercent}% Complete</span>
            {completedCase && <Badge color="green">Ready</Badge>}
          </div>

          <div className="mt-8 space-y-4">
            <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Phase Tracker</h4>
            {PHASES.map((phase, idx) => {
              const status = getPhaseStatus(idx);
              const isActive = status === 'active';
              const isCompleted = status === 'completed';
              
              return (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-teal' : isActive ? 'bg-teal ring-4 ring-teal-lt' : 'bg-gray-200'
                  }`} />
                  <span className={`text-xs transition-colors ${
                    isActive ? 'font-bold text-base' : isCompleted ? 'text-teal font-medium' : 'text-gray-500'
                  }`}>
                    {phase.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex-1 overflow-hidden flex flex-col">
          <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-4">Captured So Far</h4>
          <div className="overflow-y-auto space-y-2 pr-2 scrollbar-hide">
             {capturedFields.length === 0 && <p className="text-xs text-gray-400 italic">Starting conversation...</p>}
             {capturedFields.map(f => (
               <div key={f.field} className="p-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between group hover:bg-teal-lt transition-colors">
                 <span className="text-[10px] font-medium text-gray-600 capitalize group-hover:text-teal-dk">{f.label}</span>
                 <CheckCircle2 size={10} className="text-teal" />
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-3 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-lt flex items-center justify-center text-teal font-bold">
              T
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Transformation Intake</h2>
              <p className="text-[10px] text-teal font-bold uppercase tracking-widest">Powered by Gemini AI</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {history.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-xs ${msg.role === 'user' ? 'bg-gray-800' : 'bg-teal'}`}>
                  {msg.role === 'user' ? 'S' : 'T'}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-tr-none shadow-lg' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal shrink-0 flex items-center justify-center text-white font-bold text-xs">T</div>
                <div className="p-4 rounded-2xl bg-gray-100 rounded-tl-none flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          {completedCase && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-teal-lt border border-teal rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="text-teal" size={24} />
                <h3 className="font-bold text-teal-dk text-lg">Case Complete!</h3>
              </div>

              {/* Big Bet Badge */}
              <div className="mb-6">
                <BigBetBadge driver={completedCase.strategic_driver} />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[
                  { label: 'Title', val: completedCase.project_title },
                  { label: 'Requestor', val: completedCase.requestor_name },
                  { label: 'Dept', val: completedCase.requestor_department || (completedCase as any).department },
                  { label: 'Annual Impact', val: formatCurrency(completedCase.annual_fte_cost || 0) },
                  { label: 'Markets', val: completedCase.markets_affected },
                  { label: 'Tier / Size', val: `${completedCase.tier} / ${completedCase.tshirt}` },
                ].map((item, idx) => (
                  <div key={idx}>
                    <p className="text-[9px] uppercase font-bold text-teal-dk/60 mb-0.5 tracking-wider">{item.label}</p>
                    <p className="text-sm font-bold text-teal-dk truncate">{item.val}</p>
                  </div>
                ))}
                <div className="col-span-2 lg:col-span-3">
                  <p className="text-[9px] uppercase font-bold text-teal-dk/60 mb-0.5 tracking-wider">Expected Outcome</p>
                  <p className="text-sm text-teal-dk line-clamp-2">{completedCase.expected_outcome}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={submitToPipeline}
                  className="flex-1 bg-teal text-white py-3 rounded-xl font-bold hover:bg-teal-dk transition-colors shadow-lg shadow-teal/20"
                >
                  Submit Business Case
                </button>
                <button 
                  onClick={() => setCompletedCase(null)}
                  className="px-6 py-3 border border-teal/20 text-teal-dk font-bold rounded-xl hover:bg-white transition-colors"
                >
                  Keep Editing
                </button>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        {!completedCase && (
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="max-w-4xl mx-auto flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your answer here..."
                className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal/30 focus:bg-white transition-all outline-none"
              />
              <button
                onClick={handleSend}
                disabled={isTyping}
                className="bg-teal text-white w-12 h-12 flex items-center justify-center rounded-xl hover:bg-teal-dk transition-all disabled:opacity-50 shadow-lg shadow-teal/20"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- TAB 2: ASSESSMENT PIPELINE ---

function AssessmentPipeline({ cases, onUpdateCases }: { cases: TransformationCase[], onUpdateCases: (c: TransformationCase[]) => void }) {
  const [selectedCase, setSelectedCase] = useState<TransformationCase | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  const columns = [
    { id: ProjectStatus.PENDING, title: 'Pending Review', accent: 'amber' },
    { id: ProjectStatus.REVIEW, title: 'In Review', accent: 'teal' },
    { id: ProjectStatus.DECIDED, title: 'Decided', accent: 'slate' },
  ];

  const handleCardClick = (c: TransformationCase) => {
    if (c.status === ProjectStatus.PENDING) {
      const updated = cases.map(item => item.id === c.id ? { ...item, status: ProjectStatus.REVIEW } : item);
      onUpdateCases(updated);
      setSelectedCase({ ...c, status: ProjectStatus.REVIEW });
    } else {
      setSelectedCase(c);
    }
  };

  const updateSelectedCase = (updates: Partial<TransformationCase>) => {
    if (!selectedCase) return;
    const newCase = { ...selectedCase, ...updates };
    setSelectedCase(newCase);
    onUpdateCases(cases.map(c => c.id === newCase.id ? newCase : c));
  };

  const handleDecision = (decision: ProjectDecision) => {
    updateSelectedCase({
      decision,
      status: ProjectStatus.DECIDED,
      decided_at: new Date().toISOString()
    });
  };

  const calculatedScore = selectedCase ? (
    (selectedCase.score_problem * 0.2) +
    (selectedCase.score_benefit * 0.25) +
    (selectedCase.score_strategic * 0.2) +
    (selectedCase.score_feasibility * 0.15) +
    (selectedCase.score_urgency * 0.1) +
    (selectedCase.score_data * 0.1)
  ).toFixed(1) : '0.0';

  const getScoreVerdict = (score: string) => {
    const s = parseFloat(score);
    if (s >= 4.0) return { text: 'Strong GO', color: 'green' };
    if (s >= 3.0) return { text: 'Conditional GO', color: 'amber' };
    if (s >= 2.0) return { text: 'Hold', color: 'amber' };
    return { text: 'No-Go', color: 'red' };
  };

  const verdict = getScoreVerdict(calculatedScore);

  const requestAIScoring = async () => {
    if (!selectedCase || isScoring) return;
    setIsScoring(true);
    
    const prompt = `
      Review this project business case at Kaizen Gaming:
      Title: ${selectedCase.project_title}
      Requestor: ${selectedCase.requestor_name} (${selectedCase.requestor_department || selectedCase.department})
      Problem: ${selectedCase.problem_statement}
      Outcome: ${selectedCase.expected_outcome}
      Annual Savings: ${selectedCase.annual_fte_cost}
      Implementation Cost: ${selectedCase.impl_cost}
      Strategic Driver (Big Bet): ${selectedCase.strategic_driver}
      Soft Benefits: ${selectedCase.soft_benefits}
      Markets: ${selectedCase.markets_affected}
      Flags: ${selectedCase.flags.join(', ')}

      Kaizen Gaming's strategic pillars (Big Bets):
      - Hey Betano: AI focus, CX differentiation, AI-ready infrastructure, back-office ops efficiency
      - Shield Betano: Corporate governance, regulatory compliance (RG, AML), data privacy, cybersecurity
      - Betano Republic: Operating model, delegation, RACI, market playbooks, talent mobility
      - Core Betano: Operational excellence, automation, CX enhancement, foundational enablement

      Provide suggestions for 1-5 scores on these 6 dimensions:
      1. Problem clarity
      2. Benefit quantification
      3. Strategic alignment (Big Bet fit)
      4. Feasibility
      5. Urgency
      6. Data quality
      
      Also provide a recommendation (Go/Hold/No-Go) with reasoning. Be direct.
    `;

    try {
      const result = await callGeminiOnce(prompt);
      // For this demo, we just show it in a toast or notes, but could parse it.
      updateSelectedCase({
         assessment_notes: selectedCase.assessment_notes + "\n\n--- AI ASSESSMENT ---\n" + result
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsScoring(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 relative overflow-y-auto md:overflow-hidden">
      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:overflow-hidden flex-1 min-h-[600px] md:min-h-0">
        {columns.map(col => (
          <div key={col.id} className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between px-1">
              <h3 className={`text-xs font-bold uppercase tracking-widest text-${col.accent} flex items-center gap-2`}>
                <span className={`w-2 h-2 rounded-full bg-${col.accent}`} />
                {col.title} ({cases.filter(c => c.status === col.id).length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
              {cases.filter(c => c.status === col.id).map(c => {
                const color = getStatusColor(c.status, c.decision);
                const isSelected = selectedCase?.id === c.id;
                return (
                  <motion.div
                    key={c.id}
                    layoutId={c.id}
                    onClick={() => handleCardClick(c)}
                    className={`bg-white p-4 rounded-xl border-l-4 border-${color} border-y border-r border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative ${isSelected ? 'ring-2 ring-teal shadow-md' : ''}`}
                  >
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 leading-none">{c.requestor_department || c.department} • {c.tier}</p>
                    <h4 className="font-semibold text-sm text-base mb-2 line-clamp-1 group-hover:text-teal transition-colors">{c.project_title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{c.problem_statement}</p>
                    
                    <div className="flex items-center justify-between text-[10px] font-mono border-t pt-3 border-gray-100">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{formatCurrency(c.annual_fte_cost)} / yr</span>
                      <span className={`text-${color} font-bold`}>{c.payback_months}mo Payback</span>
                    </div>

                    {c.decision && (
                       <div className="absolute top-3 right-3">
                         <span className={`bg-${color}-lt text-${color}-dk text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase border border-${color}-dk/10`}>
                           {c.decision}
                         </span>
                       </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Full-Screen Assessment Dashboard */}
      <AnimatePresence>
        {selectedCase && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-gray-100/95 backdrop-blur-md flex flex-col p-4 md:p-10"
          >
            <div className="max-w-7xl mx-auto w-full bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-full ring-1 ring-black/5">
              {/* Dashboard Header */}
              <div className="bg-teal-dk p-6 md:p-8 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setSelectedCase(null)}
                    className="group p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10"
                  >
                    <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className="px-2.5 py-1 bg-white/20 text-[10px] font-black rounded-lg uppercase tracking-widest border border-white/10">{selectedCase.tier}</span>
                       <span className="px-2.5 py-1 bg-white/20 text-[10px] font-black rounded-lg uppercase tracking-widest border border-white/10">{selectedCase.tshirt}</span>
                       <BigBetBadge driver={selectedCase.strategic_driver} />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight leading-none">{selectedCase.project_title || "Untitled Transformation Case"}</h2>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="hidden md:flex gap-4 mr-4 pr-6 border-r border-white/10 items-center">
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mb-1">Impact Score</p>
                       <p className="text-xl font-black leading-none">{calculatedScore} <span className="text-sm font-normal opacity-50">/ 5.0</span></p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl bg-${verdict.color}-lt text-${verdict.color}-dk font-black text-xs uppercase tracking-widest bg-white`}>
                      {verdict.text}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleDecision(ProjectDecision.NOGO)}
                      className="px-6 py-3 bg-white/10 hover:bg-red text-white rounded-xl text-xs font-black uppercase tracking-widest border border-white/10 transition-all shadow-sm"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleDecision(ProjectDecision.GO)}
                      className="px-8 py-3 bg-teal hover:bg-white hover:text-teal-dk text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-teal/20"
                    >
                      Approve Go
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  
                  {/* Part 1: Strategic Context */}
                  <div className="space-y-10">
                    <section>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Target size={16} className="text-teal" /> Context & Stakeholders
                      </h3>
                      <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-6">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 bg-teal-lt rounded-2xl flex items-center justify-center text-teal shrink-0">
                            <User size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Requestor</p>
                            <p className="font-bold text-base text-teal-dk">{selectedCase.requestor_name}</p>
                            <p className="text-xs text-gray-500 font-medium">Department: {selectedCase.requestor_department || selectedCase.department}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-200/50">
                          <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target Markets</p>
                             <p className="text-sm font-semibold text-gray-700">{selectedCase.markets_affected || "Global / Corporate Functions"}</p>
                          </div>
                           <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Submission Deadline</p>
                             <p className="text-sm font-semibold text-gray-700">{selectedCase.deadline || "No hard deadline"}</p>
                          </div>
                           <div>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Stakeholder Teams</p>
                             <div className="flex flex-wrap gap-2">
                               {(selectedCase.teams_involved || "Shared Services").split(',').map((t, i) => (
                                 <span key={i} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 shadow-sm">{t.trim()}</span>
                               ))}
                             </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Zap size={16} className="text-teal" /> Problem & Vision
                      </h3>
                      <div className="space-y-8">
                        <div>
                          <p className="text-[10px] font-black text-teal uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-1 h-3 bg-teal rounded-full" /> Initial Hypothesis
                          </p>
                          <div className="text-sm text-gray-700 leading-relaxed bg-white border border-gray-100 p-5 rounded-2xl shadow-sm italic">
                            "{selectedCase.problem_statement}"
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-teal uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="w-1 h-3 bg-teal rounded-full" /> Target Outcome
                          </p>
                          <div className="text-sm font-bold text-teal-dk leading-relaxed bg-teal-lt/30 border border-teal/10 p-5 rounded-2xl shadow-sm mb-4">
                            {selectedCase.expected_outcome}
                          </div>
                          {selectedCase.soft_benefits && (
                            <div className="flex flex-wrap gap-2">
                              {selectedCase.soft_benefits.split(',').map((b, i) => (
                                <span key={i} className="text-[9px] font-black text-teal uppercase px-2 py-1 bg-white border border-teal/20 rounded-md">
                                  ✨ {b.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Part 2: Commercial & Operational Metrics */}
                  <div className="space-y-10">
                    <section>
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <PieChart size={16} className="text-teal" /> Efficiency Profile
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white border border-teal/10 p-6 rounded-3xl shadow-sm ring-1 ring-black/5">
                           <p className="text-[10px] font-bold text-teal uppercase tracking-widest mb-1.5 opacity-60">FTE Value /yr</p>
                           <p className="text-2xl font-black text-teal-dk font-mono leading-none">{formatCurrency(selectedCase.annual_fte_cost)}</p>
                        </div>
                        <div className="bg-white border border-teal/10 p-6 rounded-3xl shadow-sm ring-1 ring-black/5">
                           <p className="text-[10px] font-bold text-teal uppercase tracking-widest mb-1.5 opacity-60">Hours Released</p>
                           <p className="text-2xl font-black text-teal-dk font-mono leading-none">{parseFloat(selectedCase.annual_hours || '0').toLocaleString()}<span className="text-xs font-normal opacity-50 ml-1">h</span></p>
                        </div>
                        
                        <div className="col-span-2">
                          <EditableMetric 
                            label="Implementation Capital" 
                            value={selectedCase.impl_cost} 
                            isCurrency
                            note="Transformation Team estimated cost for delivery"
                            onSave={(v) => updateSelectedCase({ impl_cost: v })}
                          />
                        </div>

                        <div className="col-span-2">
                          <EditableMetric 
                            label="Payback Period (Months)" 
                            value={selectedCase.payback_months} 
                            note="ROI Breakeven timeline"
                            onSave={(v) => updateSelectedCase({ payback_months: v })}
                          />
                        </div>
                      </div>
                    </section>

                    <section className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                         <Briefcase size={14} /> Operational Baseline
                      </h4>
                      <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
                           <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Volume / Mo</span>
                           <span className="text-base font-black text-teal-dk">{selectedCase.volume_per_month} units</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100">
                           <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Duration / Case</span>
                           <span className="text-base font-black text-teal-dk">{selectedCase.hours_per_case} hr</span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-gray-100">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Team Profile Benchmarking</span>
                           <span className="text-sm font-bold text-teal-dk">{selectedCase.team_profile}</span>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Part 3: Transformation Scorecard */}
                  <div className="space-y-10 flex flex-col">
                    <section className="flex-1">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <LineChart size={16} className="text-teal" /> Reviewer Scorecard
                        </h3>
                        <button 
                          onClick={requestAIScoring}
                          disabled={isScoring}
                          className="flex items-center gap-2 px-4 py-2 bg-teal-lt text-teal text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-teal hover:text-white transition-all shadow-sm ring-1 ring-teal/10"
                        >
                          {isScoring ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
                          AI Deep-Review
                        </button>
                      </div>

                      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm h-fit ring-1 ring-black/5">
                        <div className="grid grid-cols-1 gap-6">
                          {[
                            { label: 'Problem clarity', field: 'score_problem' },
                            { label: 'Benefit quantification', field: 'score_benefit' },
                            { label: 'Strategic alignment', field: 'score_strategic' },
                            { label: 'Feasibility', field: 'score_feasibility' },
                            { label: 'Urgency', field: 'score_urgency' },
                            { label: 'Data quality', field: 'score_data' },
                          ].map((score, i) => (
                            <div key={i}>
                              <div className="flex justify-between text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2.5 px-0.5">
                                <span>{score.label}</span>
                                <div className="flex gap-1.5 shrink-0">
                                   {[1, 2, 3, 4, 5].map(v => (
                                      <button 
                                        key={v}
                                        onClick={() => updateSelectedCase({ [score.field]: v })}
                                        className={`w-3.5 h-3.5 rounded-full transition-all ${v <= (selectedCase[score.field as keyof TransformationCase] as number) ? 'bg-teal shadow-sm shadow-teal/50' : 'bg-gray-100 hover:bg-gray-200'}`}
                                      />
                                   ))}
                                </div>
                              </div>
                              <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${((selectedCase[score.field as keyof TransformationCase] as number)/5)*100}%` }}
                                  className="h-full bg-teal"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-10 pt-8 border-t border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Internal Assessment Notes</p>
                          <textarea 
                            className="w-full h-40 text-sm text-gray-600 bg-gray-50/50 rounded-2xl p-5 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal resize-none scrollbar-hide text-teal-dk font-medium leading-relaxed"
                            placeholder="Add findings, synergy opportunities or delivery risks identified during review..."
                            value={selectedCase.assessment_notes || ''}
                            onChange={(e) => updateSelectedCase({ assessment_notes: e.target.value })}
                          />
                        </div>
                      </div>
                    </section>

                    {selectedCase.flags.length > 0 && (
                       <section>
                         <h3 className="text-xs font-black text-amber uppercase tracking-widest mb-4 flex items-center gap-2">
                           <AlertCircle size={16} /> Attention Required
                         </h3>
                         <div className="bg-amber-lt/30 border border-amber/10 rounded-2xl p-6 flex flex-wrap gap-2">
                           {selectedCase.flags.map((flag, idx) => (
                             <span key={idx} className="px-3 py-1.5 bg-white text-[10px] font-black text-amber-dk uppercase tracking-widest rounded-lg border border-amber/10 shadow-sm flex items-center gap-1.5">
                               <span className="w-1.5 h-1.5 bg-amber rounded-full animate-pulse" />
                               {flag}
                             </span>
                           ))}
                         </div>
                       </section>
                    )}
                  </div>

                </div>
              </div>

              {/* Dashboard Footer */}
              <div className="px-10 py-5 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400 shrink-0">
                 <div className="flex items-center gap-8">
                   <span className="flex items-center gap-1.5"><Clock size={12} /> Received: {new Date(selectedCase.created_at).toLocaleDateString()}</span>
                   <span className="flex items-center gap-1.5 tracking-normal">Hash: {selectedCase.id.substring(0,8)}...</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="font-medium lowercase italic text-gray-400 tracking-normal">Kaizen Transformation Pipeline v1.2</span>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                      <div className={`w-2 h-2 rounded-full bg-${getStatusColor(selectedCase.status, selectedCase.decision)} shadow-sm`} />
                      <span className={`text-${getStatusColor(selectedCase.status, selectedCase.decision)}-dk`}>{selectedCase.status}</span>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- TAB 3: EXECUTIVE DASHBOARD ---

function ExecutiveDashboard({ cases }: { cases: TransformationCase[] }) {
  const goCases = cases.filter(c => c.decision === ProjectDecision.GO);
  const decidedCases = cases.filter(c => c.status === ProjectStatus.DECIDED);
  
  // Financial Impact
  const totalBenefit = goCases.reduce((acc, c) => acc + parseFloat(c.annual_fte_cost), 0);
  const totalImplCost = goCases.reduce((acc, c) => acc + parseFloat(c.impl_cost), 0);
  const roi = totalImplCost > 0 ? ((totalBenefit / totalImplCost) * 100).toFixed(0) : '0';
  const avgPayback = goCases.length > 0 ? (goCases.reduce((acc, c) => acc + parseFloat(c.payback_months), 0) / goCases.length).toFixed(1) : '0';

  // Pipeline Health
  const killRate = decidedCases.length > 0 ? ((cases.filter(c => c.decision === ProjectDecision.NOGO).length / decidedCases.length) * 100).toFixed(0) : '0';
  
  const getAvgDays = (filteredCases: TransformationCase[]) => {
    if (filteredCases.length === 0) return 0;
    const total = filteredCases.reduce((acc, c) => {
      const created = new Date(c.created_at).getTime();
      const decided = c.decided_at ? new Date(c.decided_at).getTime() : Date.now();
      return acc + (decided - created);
    }, 0);
    return Math.round(total / (1000 * 60 * 60 * 24 * filteredCases.length));
  };

  const avgTimeToKill = getAvgDays(cases.filter(c => c.decision === ProjectDecision.NOGO));
  const avgTimeToDecide = getAvgDays(cases.filter(c => c.decision === ProjectDecision.GO));
  const stuckProjects = cases.filter(c => c.status !== ProjectStatus.DECIDED && (Date.now() - new Date(c.created_at).getTime()) >= (7 * 24 * 60 * 60 * 1000)).length;

  // Hours returned
  const totalHours = goCases.reduce((acc, c) => acc + parseFloat(c.annual_hours), 0);
  const fteEquivalent = (totalHours / 1720).toFixed(1);
  const savingsProgress = Math.min(100, (totalHours / 8000) * 100);

  // Top Submitter
  const deptCounts: Record<string, number> = {};
  cases.forEach(c => {
    const dept = c.requestor_department || c.department || 'Unknown';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  const topDept = Object.entries(deptCounts).sort((a,b) => b[1] - a[1])[0] || ['N/A', 0];
  const engagement = ((Object.keys(deptCounts).length / 10) * 100).toFixed(0);

  // T-shirt mix
  const tshirtMix = { [TshirtSize.S]: 0, [TshirtSize.M]: 0, [TshirtSize.L]: 0, [TshirtSize.XL]: 0 };
  cases.forEach(c => tshirtMix[c.tshirt]++);

  // Submission Funnel
  const funnel = [
    { label: 'Submitted', count: cases.length, pct: 100 },
    { label: 'Reviewed', count: cases.filter(c => c.status !== ProjectStatus.PENDING).length, pct: (cases.filter(c => c.status !== ProjectStatus.PENDING).length / (cases.length || 1)) * 100 },
    { label: 'Decided', count: decidedCases.length, pct: (decidedCases.length / (cases.length || 1)) * 100 },
    { label: 'Go Issued', count: goCases.length, pct: (goCases.length / (cases.length || 1)) * 100 },
  ];

  // Value by Business Unit
  const unitValue = Object.entries(cases.filter(c => c.decision === ProjectDecision.GO).reduce((acc, c) => {
    const dept = c.requestor_department || c.department || 'Unknown';
    acc[dept] = (acc[dept] || 0) + parseFloat(c.annual_fte_cost || '0');
    return acc;
  }, {} as Record<string, number>)).sort((a,b) => b[1] - a[1]).slice(0, 5);

  const maxVal = Math.max(...unitValue.map(v => v[1]), 1000);

  return (
    <div className="space-y-8 pb-12 overflow-y-auto h-full pr-2 scrollbar-hide">
      <section>
        <h3 className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-4">Financial Impact (Annualized)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
             { label: 'Total Benefit', val: formatCurrency(totalBenefit), color: 'teal', icon: TrendingUp },
             { label: 'Total Impl Cost', val: formatCurrency(totalImplCost), color: 'gray', icon: Package },
             { label: 'Portfolio ROI', val: roi + '%', color: 'teal', icon: Target },
             { label: 'Avg Payback', val: avgPayback + ' mo', color: 'blue', icon: Clock },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg bg-${kpi.color === 'gray' ? 'gray-100' : kpi.color + '-lt'} text-${kpi.color === 'gray' ? 'gray-600' : kpi.color}`}>
                  <kpi.icon size={16} />
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{kpi.label}</span>
              </div>
              <p className="text-2xl font-black text-base font-mono tracking-tight">{kpi.val}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-4">Pipeline Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
             { label: 'Kill Rate', val: killRate + '%', color: 'red', icon: AlertCircle },
             { label: 'Avg Time to Kill', val: avgTimeToKill + ' Days', color: 'gray', icon: Clock },
             { label: 'Avg Time to Decide', val: avgTimeToDecide + ' Days', color: 'gray', icon: Clock },
             { label: 'Stuck Projects', val: stuckProjects, color: 'amber', icon: AlertCircle },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg bg-${kpi.color === 'gray' ? 'gray-100' : kpi.color + '-lt'} text-${kpi.color === 'gray' ? 'gray-600' : kpi.color}`}>
                  <kpi.icon size={16} />
                </div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{kpi.label}</span>
              </div>
              <p className="text-2xl font-black text-base font-mono tracking-tight">{kpi.val}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-6">Execution Funnel</h3>
          <div className="space-y-6">
            {funnel.map((step, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-700">{step.label}</span>
                  <span className="text-xs font-bold text-gray-400">{step.count} projects</span>
                </div>
                <div className="w-full bg-gray-100 h-8 rounded-lg overflow-hidden relative border border-gray-200/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${step.pct}%` }}
                    className={`h-full bg-gray-800 flex items-center justify-end px-3 transition-all`}
                  >
                    <span className="text-[10px] font-black text-white">{step.pct.toFixed(0)}%</span>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-8">
          <section className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
             <div className="absolute bottom-0 right-0 w-48 h-48 bg-teal/10 rounded-full -mb-24 -mr-24 blur-3xl" />
             <div className="relative z-10">
               <h3 className="font-bold text-teal/50 text-[10px] uppercase tracking-[0.2em] mb-6">Efficiency Returned</h3>
               <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-5xl font-black tracking-tighter">{totalHours.toLocaleString()}h</p>
                    <p className="text-[10px] font-bold uppercase text-teal">Annual Hours Saved</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">{fteEquivalent}</p>
                    <p className="text-[10px] font-bold uppercase text-gray-400">FTE Equivalent</p>
                  </div>
               </div>
               <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/10">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${savingsProgress}%` }}
                    className="h-full bg-teal"
                 />
               </div>
               <p className="mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">Goal: 8,000 hrs/year</p>
             </div>
          </section>

          <section className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-6">Top Value Departments</h3>
            <div className="space-y-4">
              {unitValue.map(([dept, val], idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-700">{dept}</span>
                    <span className="text-xs font-mono font-bold text-teal-dk">{formatCurrency(val)}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(val / maxVal) * 100}%` }}
                      className="h-full bg-teal rounded-full"
                    />
                  </div>
                </div>
              ))}
              {unitValue.length === 0 && <p className="text-xs text-gray-400 italic">No project decisions issued yet.</p>}
            </div>
          </section>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-6">T-Shirt Mix</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(tshirtMix).map(([size, count]) => (
                <div key={size} className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">{size} Size</span>
                  <span className="text-2xl font-black text-base">{count}</span>
                </div>
              ))}
            </div>
         </div>

         <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm md:col-span-2">
            <h3 className="font-bold text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-6">Portfolio Meta</h3>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Top Submitter</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-lt text-blue flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-base">{topDept[0]}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{topDept[1]} Submissions</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Dept Engagement</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-lt text-purple flex items-center justify-center">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-xl font-black text-base">{engagement}%</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Cross-Dept Connect</p>
                  </div>
                </div>
              </div>
            </div>
         </div>
      </section>
    </div>
  );
}
