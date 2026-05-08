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
  Table,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { 
  UnifiedCase, 
  ProjectStatus, 
  ProjectDecision, 
  AIDecision,
  TshirtSize, 
  Message, 
  CaseType 
} from './types';
import { UNIFIED_DEMO_DATA } from './constants';
import { callGemini, callGeminiOnce } from './geminiService';
import { auth } from './firebase';
import { authService } from './services/authService';
import { unifiedService } from './services/firestoreService';

const ADMIN_EMAILS = [
  'al.papadopoulos@kaizengaming.com',
  'm.chatzicharalampous@kaizengaming.com',
  'v.vlachakis@kaizengaming.com',
  'admin@kaizengaming.com' // For testing
];

// --- HELPERS ---

interface QuickReplyProps {
  options: string[];
  multiSelect: boolean;
  onSelect: (value: string) => void;
  onMultiConfirm?: (values: string[]) => void;
}

function QuickReplyChips({ options, multiSelect, onSelect, onMultiConfirm }: QuickReplyProps) {
  const [selected, setSelected] = useState<string[]>([]);

  if (!multiSelect) {
    return (
      <div className="flex flex-wrap gap-2 mt-3 ml-12">
        {options.map(opt => (
          <motion.button
            key={opt}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(opt)}
            className="px-4 py-2 rounded-pill bg-white border border-indigo/30 text-indigo text-[10px] font-bold 
                       hover:bg-indigo hover:text-white hover:border-indigo transition-standard shadow-sm uppercase tracking-wider"
          >
            {opt}
          </motion.button>
        ))}
      </div>
    );
  }

  // Multi-select variant
  return (
    <div className="mt-3 ml-12">
      <div className="flex flex-wrap gap-2 mb-3">
        {options.map(opt => (
          <motion.button
            key={opt}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(prev =>
              prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]
            )}
            className={`px-4 py-2 rounded-pill text-[10px] font-bold transition-standard shadow-sm border uppercase tracking-wider
              ${selected.includes(opt)
                ? 'bg-indigo text-white border-indigo'
                : 'bg-white border-indigo/30 text-indigo hover:bg-indigo/10'}`}
          >
            {opt}
          </motion.button>
        ))}
      </div>
      {selected.length > 0 && (
        <button
          onClick={() => onMultiConfirm?.(selected)}
          className="px-6 py-2 bg-navy text-white rounded-pill text-[9px] font-bold uppercase tracking-[0.2em] shadow-md hover:bg-indigo transition-standard"
        >
          Confirm ({selected.length} selected)
        </button>
      )}
    </div>
  );
}

const formatCurrency = (val: string | number) => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);
};

const getStatusColor = (status: ProjectStatus, decision: ProjectDecision | AIDecision | null) => {
  if (status === ProjectStatus.PENDING) return 'gold';
  if (status === ProjectStatus.REVIEW) return 'indigo';
  if (decision === ProjectDecision.GO || decision === AIDecision.APPROVED) return 'success';
  if (decision === ProjectDecision.NOGO || decision === AIDecision.REJECTED) return 'danger';
  if (decision === ProjectDecision.HOLD || decision === AIDecision.NEEDS_INFO) return 'gold';
  return 'grey';
};

const EditableMetric = ({ label, value, note, onSave, isCurrency }: { label: string, value: string, note?: string, onSave: (v: string) => void, isCurrency?: boolean }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);

  useEffect(() => {
    setVal(value);
  }, [value]);

  if (isEditing) {
    return (
      <div className="bg-white p-3 rounded-lg border border-indigo shadow-md animate-in fade-in zoom-in duration-200">
        <p className="text-[10px] font-bold text-indigo uppercase leading-none mb-1">{label}</p>
        <input 
          autoFocus
          className="w-full text-lg font-mono font-bold text-base outline-none bg-indigo-lt/30 px-1 rounded" 
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
      className="bg-grey-50 p-3 rounded-lg border border-grey-100 shadow-sm cursor-pointer group hover:bg-white hover:border-indigo/30 transition-all"
      onClick={() => setIsEditing(true)}
    >
      <p className="text-[10px] font-bold text-grey-400 uppercase leading-none mb-1 group-hover:text-indigo transition-colors">{label}</p>
      <p className="text-lg font-mono font-bold text-base group-hover:text-indigo transition-colors">
        {isCurrency && value ? formatCurrency(value) : (value || '—')}
      </p>
      {note && <p className="text-[8px] text-grey-400 mt-1 italic">{note}</p>}
    </div>
  );
};

// --- COMPONENTS ---

const Badge = ({ children, color = 'grey' }: { children: React.ReactNode; color?: string; key?: string | number }) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-lt text-indigo border-indigo/20',
    gold: 'bg-gold-lt text-gold-dk border-gold-dk/20',
    success: 'bg-success-lt text-success border-success/20',
    danger: 'bg-danger-lt text-danger border-danger/20',
    grey: 'bg-grey-50 text-grey-500 border-grey-200',
    sage: 'bg-sage-lt text-sage-dk border-sage/20'
  };
  return (
    <span className={`px-2.5 py-1 rounded-pill text-[10px] font-bold uppercase tracking-wider border ${colors[color] || colors.grey}`}>
      {children}
    </span>
  );
};

const BigBetBadge = ({ driver }: { driver: string }) => {
  const configs: Record<string, { bg: string, text: string, icon: string, border: string }> = {
    'Hey Betano': { bg: 'bg-navy-lt', text: 'text-white', icon: '🤖', border: 'border-white/10' },
    'Shield Betano': { bg: 'bg-indigo-lt', text: 'text-indigo', icon: '🛡', border: 'border-indigo/10' },
    'Betano Republic': { bg: 'bg-gold-lt', text: 'text-gold-dk', icon: '🌍', border: 'border-gold/10' },
    'Core Betano': { bg: 'bg-success-lt', text: 'text-success', icon: '⚡', border: 'border-success/10' },
  };
  const cfg = configs[driver] || { bg: 'bg-grey-50', text: 'text-grey-400', icon: '🎯', border: 'border-grey-100' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill ${cfg.bg} ${cfg.text} font-bold text-[9px] uppercase tracking-widest border ${cfg.border} shadow-sm`}>
      <span className="text-[11px] leading-none">{cfg.icon}</span> {driver || 'Project'}
    </span>
  );
};

// REDUNDANT SECTIONS CLEANED

// --- TAB 1: INTAKE WIZARD (ZHDUN) ---

// TAB 2: MY SUBMISSIONS

function MySubmissionsModule({ cases }: { cases: UnifiedCase[] }) {
  if (cases.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-white rounded-card border-2 border-dashed border-grey-100 font-sans">
        <div className="w-16 h-16 bg-grey-50 rounded-pill flex items-center justify-center text-grey-200 mb-6 shadow-tiny">
          <ClipboardList size={32} />
        </div>
        <h3 className="text-xl font-bold mb-2 italic text-navy">No Submissions Yet</h3>
        <p className="text-grey-400 font-medium max-w-sm">Use the Intake Wizard to start your first transformation or AI initiative.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 h-full flex flex-col font-sans">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-bold tracking-tight italic text-navy">My Initiatives</h2>
           <p className="text-grey-400 font-medium mt-1">Tracking {cases.length} active nodes</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-grey-100 p-1 rounded-pill border border-grey-200 shadow-tiny">
             <button className="px-4 py-1.5 rounded-pill bg-white text-[10px] font-bold uppercase tracking-wider text-navy shadow-sm">All</button>
             <button className="px-4 py-1.5 rounded-pill text-[10px] font-bold uppercase tracking-wider text-grey-400 hover:text-navy transition-standard">Active</button>
             <button className="px-4 py-1.5 rounded-pill text-[10px] font-bold uppercase tracking-wider text-grey-400 hover:text-navy transition-standard">Decided</button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto pr-2 pb-10 scrollbar-hide">
        {cases.map((c) => (
          <motion.div 
             key={c.id} 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white rounded-card border border-grey-100 p-6 shadow-sm-kaizen hover:shadow-md-kaizen transition-standard group cursor-pointer border-l-4 border-l-indigo relative overflow-hidden"
          >
             <div className="flex justify-between items-start mb-6">
                <Badge color={c.case_type === CaseType.AI ? 'gold' : c.case_type === CaseType.HYBRID ? 'indigo' : 'sage'}>{c.case_type}</Badge>
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-${getStatusColor(c.status, c.decision)}`}>
                   <div className={`w-2 h-2 rounded-pill bg-current animate-pulse`} />
                   {c.decision ? c.decision.replace(/_/g, ' ') : c.status}
                </div>
             </div>

             <h4 className="font-bold text-lg text-navy mb-3 group-hover:text-indigo transition-standard italic line-clamp-1">{c.project_title}</h4>
             <p className="text-xs text-grey-400 font-medium mb-6 line-clamp-3 italic leading-relaxed h-[4.5em]">
               "{c.case_type === CaseType.AI ? (c.initiative_description || c.problem_statement) : c.problem_statement}"
             </p>

             <div className="grid grid-cols-2 gap-4 pt-6 border-t border-grey-50">
                <div>
                   <p className="text-[8px] font-bold text-grey-300 uppercase tracking-wider mb-1">
                     {c.case_type === CaseType.AI ? 'Risk Level' : 'Tier / Size'}
                   </p>
                   <p className="text-[11px] font-bold text-navy uppercase tabular-nums">
                     {c.case_type === CaseType.AI ? (c.tier === 'T3' ? 'High' : c.tier === 'T2' ? 'Medium' : 'Low') : `${c.tier} / ${c.tshirt}`}
                   </p>
                </div>
                <div>
                   <p className="text-[8px] font-bold text-grey-300 uppercase tracking-wider mb-1">Benefit Est.</p>
                   <p className="text-[11px] font-bold text-navy italic tabular-nums">
                     {c.case_type === CaseType.AI ? 'N/A' : formatCurrency(c.annual_fte_cost || 0)}
                   </p>
                </div>
                <div className="col-span-2 pt-2">
                   <p className="text-[8px] font-bold text-grey-300 uppercase tracking-wider mb-2">Strategy</p>
                   <BigBetBadge driver={c.strategic_driver || ''} />
                </div>
             </div>
             
             {c.next_review_date && (
               <div className="mt-4 pt-4 border-t border-grey-50 flex items-center gap-2">
                 <Clock size={10} className="text-indigo" />
                 <span className="text-[9px] font-bold text-indigo uppercase tracking-wider">Next Review: {c.next_review_date}</span>
               </div>
             )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN APP ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'wizard' | 'pipeline' | 'dashboard' | 'submissions'>('wizard');
  const [selectedModule, setSelectedModule] = useState<'transformation' | 'governance' | null>(null);
  const [cases, setCases] = useState<UnifiedCase[]>([]);
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
    if (!user) return;
    const isAdmin = ADMIN_EMAILS.includes(user.email || '');
    const unsubscribe = isAdmin
      ? unifiedService.subscribeToAllCases(setCases)
      : unifiedService.subscribeToMyCases(setCases);
    return () => unsubscribe();
  }, [user]);

  const handleSubmitCase = async (newCase: UnifiedCase) => {
    try {
      await unifiedService.saveCase(newCase);
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  const handleUpdateCase = async (id: string, updates: Partial<UnifiedCase>) => {
    try {
      await unifiedService.updateCase(id, updates);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  // Removed separate AIGovernanceCase logic as it's now unified.

  if (isLoadingAuth) {
    return (
      <div className="h-screen bg-cream flex flex-col items-center justify-center p-6 text-center font-sans">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-48 h-48 flex items-center justify-center mb-8"
        >
          <img src="/logo.png" alt="Zhdun" className="w-full h-full object-contain drop-shadow-lg" />
        </motion.div>
        <h2 className="text-4xl font-bold text-navy tracking-tight uppercase italic mb-2">ZH<span className="text-indigo">DUN</span></h2>
        <p className="text-grey-400 text-[10px] font-bold uppercase tracking-[0.4em] tabular-nums">Establishing Connection Node</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Animated Background Accents */}
        <motion.div 
          animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-lt/40 blur-[120px] rounded-pill" 
        />
        <motion.div 
          animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-gold-lt/40 blur-[120px] rounded-pill" 
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-md w-full bg-white/80 backdrop-blur-xl p-10 md:p-14 rounded-card border border-white/50 shadow-lg-kaizen relative z-10 text-center"
        >
          <motion.div 
            whileHover={{ scale: 1.02, rotate: 1 }}
            className="w-48 h-48 flex items-center justify-center mx-auto mb-8"
          >
            <img src="/logo.png" alt="Zhdun" className="w-full h-full object-contain" />
          </motion.div>
          
          <h1 className="text-5xl font-bold text-navy tracking-tighter italic mb-3">
            ZH<span className="text-indigo">DUN</span>
          </h1>
          <p className="text-grey-400 text-[9px] font-bold uppercase tracking-[0.4em] mb-10 opacity-70">Central Operations Hub</p>
          
          <div className="space-y-6">
            <p className="text-grey-500 text-sm font-medium leading-relaxed mb-8">
              Welcome to the unified transformation portal. Please authorize to access the Zhdun ecosystem.
            </p>
            
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => authService.signInWithGoogle()}
              className="w-full bg-navy hover:bg-navy-lt border border-navy/10 py-5 px-8 rounded-btn flex items-center justify-center gap-4 transition-standard shadow-sm-kaizen group"
            >
              <div className="w-6 h-6 bg-white rounded-pill flex items-center justify-center text-navy text-[10px] font-bold group-hover:scale-110 transition-transform">G</div>
              <span className="text-sm font-bold uppercase tracking-widest text-white">Authorize with Google</span>
            </motion.button>
          </div>
          
          <p className="mt-10 text-[8px] text-grey-300 font-bold uppercase tracking-[0.3em] tabular-nums">
            Enterprise Security Enforced v5.0
          </p>
        </motion.div>
        
        <div className="absolute bottom-10 text-[9px] font-bold text-grey-300 uppercase tracking-[0.5em] opacity-40 tabular-nums">
          ZHDUN OS // 2026
        </div>
      </div>
    );
  }

  if (!selectedModule) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Abstract Background Elements */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-lt/30 blur-[120px] rounded-pill" 
        />
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 18, repeat: Infinity }}
          className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold-lt/30 blur-[120px] rounded-pill" 
        />

        <div className="max-w-6xl w-full text-center relative z-10 font-sans">
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
                className="flex items-center gap-4 bg-white/70 backdrop-blur-xl p-2 sm:pl-6 rounded-pill border border-white/50 shadow-md cursor-pointer sm:cursor-default relative z-10"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-bold text-navy uppercase leading-none tracking-tight">{user.displayName}</p>
                  <button onClick={(e) => { e.stopPropagation(); authService.logout(); }} className="text-[9px] font-bold text-danger uppercase tracking-widest hover:text-danger-lt transition-standard mt-1 cursor-pointer">Disconnect</button>
                </div>
                <img 
                  src={user.photoURL} 
                  alt="" 
                  className="w-10 h-10 rounded-pill border-2 border-white shadow-sm active:scale-95 transition-standard"
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
                      className="bg-danger text-white px-6 py-3 rounded-pill font-bold text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 whitespace-nowrap cursor-pointer"
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
            className="mb-16"
          >
            <div className="flex flex-col items-center justify-center gap-6 mb-8">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="w-56 h-56 flex items-center justify-center mx-auto mb-6"
              >
                <img src="/logo.png" alt="Zhdun" className="w-full h-full object-contain drop-shadow-xl" />
              </motion.div>
              <div className="text-center">
                <h1 className="text-7xl font-bold text-navy tracking-tighter italic leading-none mb-4">ZH<span className="text-indigo">DUN</span></h1>
                <p className="text-grey-400 font-bold text-[9px] uppercase tracking-[0.5em] opacity-80">Operational Intelligence Platform</p>
              </div>
            </div>
            <p className="text-grey-500 font-medium text-lg max-w-2xl mx-auto leading-relaxed italic">
              Precision orchestration for Kaizen's transformation roadmap. Seamless governance and data-driven oversight.
            </p>
          </motion.div>

          <div className="flex justify-center">
            {/* Unified Intake Option */}
            <motion.button
              whileHover={{ scale: 1.01, y: -4 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedModule('transformation')}
              className="bg-navy p-10 md:p-14 rounded-card border border-navy/20 shadow-lg-kaizen hover:shadow-xl-kaizen transition-standard text-left flex flex-col group relative overflow-hidden max-w-2xl w-full"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-pill -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-700" />
              <div className="flex items-start justify-between mb-10">
                <div className="w-20 h-20 bg-white/10 text-white rounded-inner flex items-center justify-center group-hover:bg-white group-hover:text-navy transition-standard border border-white/10 shadow-sm">
                  <Bot size={40} />
                </div>
                <div className="bg-indigo text-white text-[10px] font-bold px-4 py-1.5 rounded-pill uppercase tracking-widest shadow-sm">
                  Unified Protocol
                </div>
              </div>
              <h3 className="text-4xl font-bold text-white mb-4 tracking-tight">Unified Intake Engine</h3>
              <p className="text-white/60 text-lg font-medium leading-relaxed mb-10 flex-1">
                Initiate initiatives with AI assistance. A single gateway for Transformation Projects, AI Governance audits, and Strategic Alignment.
              </p>
              <div className="flex items-center gap-4 text-white font-bold text-xs uppercase tracking-[0.3em] group-hover:translate-x-3 transition-transform">
                Initialize System <ArrowRight size={18} className="text-indigo" />
              </div>
            </motion.button>
          </div>
        </div>

        <div className="absolute bottom-12 text-[10px] font-bold text-grey-300 uppercase tracking-[0.6em] opacity-40 tabular-nums">
          ZHDUN SECURED ECOSYSTEM
        </div>
      </div>
    );
  }

  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');

  const tabs = [
    { id: 'wizard', label: 'Intake', icon: MessageSquare },
    { id: 'submissions', label: 'My Submissions', icon: ClipboardList },
    ...(isAdmin ? [
      { id: 'pipeline', label: 'Pipeline', icon: Trello },
      { id: 'dashboard', label: 'Insights', icon: LayoutDashboard }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans">
      {/* Header */}
      <header className="h-20 bg-white/80 backdrop-blur-lg border-b border-grey-100 px-6 md:px-10 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Z" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold italic tracking-tight text-navy flex items-center gap-2">
              ZH<span className="text-indigo">DUN</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-grey-300 not-italic tabular-nums">v5.0</span>
            </h1>
          </div>
        </div>

        <nav className="flex gap-1.5 bg-grey-100/50 p-1.5 rounded-pill border border-grey-200/50 overflow-x-auto scrollbar-hide max-w-[50%] md:max-w-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 md:px-6 py-2 rounded-pill text-[10px] font-bold uppercase tracking-widest transition-standard shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-white shadow-sm text-indigo border border-grey-100' 
                  : 'text-grey-400 hover:text-navy hover:bg-grey-100/30'
              }`}
            >
              <span className="flex items-center gap-2">
                <tab.icon size={12} strokeWidth={3} />
                <span className="hidden xs:inline">{tab.label}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="text-right hidden lg:block">
            <p className="text-[10px] font-bold text-navy uppercase tracking-tight leading-none mb-1">{user.displayName}</p>
            <p className="text-[9px] font-bold text-indigo uppercase tracking-widest leading-none tabular-nums">{cases.length} Nodes Active</p>
          </div>
          <div className="relative group">
            <img src={user.photoURL} alt="" className="w-10 h-10 rounded-pill border-2 border-white shadow-md cursor-pointer" />
            <div className="absolute right-0 top-full mt-2 hidden group-hover:block w-48 bg-white rounded-btn shadow-lg border border-grey-100 p-2 z-50">
              <button 
                onClick={() => authService.logout()}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-grey-50 text-xs font-bold text-danger rounded-btn transition-standard md:cursor-pointer"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
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
              <IntakeWizard user={user} onCaseSubmit={handleSubmitCase} />
            </motion.div>
          )}

          {activeTab === 'submissions' && (
             <motion.div
               key="submissions"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="h-full"
             >
               <MySubmissionsModule cases={cases.filter(c => c.requestor_email === user.email)} />
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
                <AssessmentPipeline cases={cases} onUpdateCase={handleUpdateCase} />
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="bg-white p-10 rounded-card border border-grey-100 shadow-lg text-center max-w-sm">
                  <ShieldCheck size={40} className="text-danger mx-auto mb-6" />
                  <h3 className="text-lg font-bold text-navy uppercase italic mb-2">Access Restricted</h3>
                  <p className="text-grey-500 text-xs font-medium leading-relaxed">
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

function IntakeWizard({ user, onCaseSubmit }: { user: any, onCaseSubmit: (c: UnifiedCase) => void }) {
  const [history, setHistory] = useState<Message[]>([
    { role: 'assistant', content: `Hello ${user?.displayName?.split(' ')[0] || ''}! I'm ZHDUN, your Transformation Catalyst. I'm here to help you draft your next big initiative. What's on your mind today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [completedCase, setCompletedCase] = useState<Partial<UnifiedCase> | null>(null);
  const [candidateData, setCandidateData] = useState<Partial<UnifiedCase>>({});
  const [currentChoices, setCurrentChoices] = useState<{type:'single'|'multi', field:string, options:string[]} | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const WIZARD_PROMPT = `
You are ZHDUN, the strategic intake specialist for Kaizen Gaming's Transformation team.
Your job: conduct a warm, precise conversational interview to intake a new initiative.
Speak naturally. Never use bullet lists. One question at a time. Max 2-3 short sentences per message.

─── CORE BEHAVIOR (CRITICAL) ───
- DATA INTEGRITY: You MUST capture accurate and complete information. If a user provides vague, incorrect, or incomplete data, or refuses to provide information (e.g., "I won't give you this"), you MUST insist politely and explain why that data is critical for the initiative's success in the pipeline.
- GUIDANCE: If a user isn't sure what to write or how to define their initiative, you MUST proactively offer help, examples, or suggestions based on common Kaizen transformation patterns (e.g., automation of manual reporting, LLM-based customer support, process streamlining).
- PERSISTENCE: Do not allow the user to skip essential fields. If they try to bypass a question, reiterate its importance and help them formulate an answer.

─── CLASSIFICATION (SILENT) ───
On the first message, determine intake type based on the user's initial selection or description:
- PROJECT: operational / process / automation initiative (no AI/LLM)
- AI: pure AI/LLM/GenAI initiative  
- HYBRID: process improvement that includes an AI component

Never mention PROJECT/AI/HYBRID or T1/T2/T3 to the user. These are internal only.

─── TIER SCORING (SILENT, AI CASES ONLY) ───
Maintain a running tier_score (0–20) as you learn about an AI initiative.
Add points as follows:
+4 if external/3rd-party LLM (not internal model)
+3 if customer-facing (not internal-only users)
+3 if any PII data involved
+3 if financial or regulated data involved
+2 if health/sensitive data involved
+2 if integrated with production systems
+2 if used in regulated process (AML, KYC, responsible gambling)
+1 if >100 users in scope

Tier mapping: 0-5 = T1, 6-12 = T2, 13-20 = T3
CRITICAL: If tier_score >= 6 (T2 or T3), you MUST ask about expected_benefits before closing.
Never tell the user their tier.

─── FIELD CHECKLIST ───
For PROJECT intake, capture ALL of:
project_title, requestor_department, markets_affected, problem_statement, expected_outcome,
volume_per_month (numeric), hours_per_case (numeric), team_profile, duration, teams_involved,
soft_benefits, strategic_driver, deadline

For AI intake, capture ALL of:
initiative_title (maps to project_title), requestor_department, initiative_description,
expected_outcome, use_type, intended_purpose, users_scope, markets_affected, data_types,
ai_tool, system_integrations, additional_context (ask at end: "Anything else to add?"),
expected_benefits (ONLY if tier_score >= 6)

─── COMPUTED FIELDS (DO SILENTLY, INCLUDE IN CASE_COMPLETE) ───
annual_hours = volume_per_month × hours_per_case × 12
annual_fte_cost = annual_hours × hourly_rate (use salary table below × 1.35 burden)
fte_saving_est = annual_hours / 1720

Salary table (annual base):
- GR/CY/MT: Jr 20k, Mid 30k, Sr 45k, Mgr 60k
- EE (RO/BG/CZ): Jr 15k, Mid 22k, Sr 35k, Mgr 50k
- WE (UK/DE/DK): Jr 28k, Mid 42k, Sr 60k, Mgr 80k
- LATAM (BR/MX/AR): Jr 12k, Mid 18k, Sr 28k, Mgr 40k

T-shirt size: S = <500 annual_hours, M = 500-2000, L = 2000-5000, XL = >5000

Strategic driver mapping (ask user to pick one, show as choices):
"Hey Betano" = AI Transformation
"Shield Betano" = Risk & Governance  
"Betano Republic" = Market Expansion
"Core Betano" = Operational Excellence

─── CHOICES SIGNAL ───
When a field has predefined options, ALWAYS include a CHOICES signal after your question.
The user will see clickable buttons — do NOT list the options in your text.

Format: CHOICES:{"type":"single"|"multi","field":"fieldname","options":["Option1","Option2"...]}

Use CHOICES for:
- markets_affected → CHOICES:{"type":"multi","field":"markets_affected","options":["Greece","Cyprus","Malta","Bulgaria","Romania","Czech Republic","United Kingdom","Germany","Denmark","Brazil","Mexico","Argentina","All Markets"]}
- strategic_driver → CHOICES:{"type":"single","field":"strategic_driver","options":["Hey Betano","Shield Betano","Betano Republic","Core Betano"]}
- use_type → CHOICES:{"type":"single","field":"use_type","options":["Internal Staff Only","Customer-Facing","Both"]}
- data_types → CHOICES:{"type":"multi","field":"data_types","options":["Personal / PII","Financial Data","Behavioral / Clickstream","Health / Sensitive","Proprietary Business Data","No Sensitive Data"]}
- ai_tool → CHOICES:{"type":"single","field":"ai_tool","options":["ChatGPT / GPT-4","Claude / Anthropic","Gemini","Internal / Custom Model","Other"]}
- users_scope → CHOICES:{"type":"single","field":"users_scope","options":["Internal Staff Only","Our Customers","Both Internal & Customers"]}
- team_profile → CHOICES:{"type":"single","field":"team_profile","options":["Junior-heavy","Mixed Team","Senior-heavy","Management Level"]}
- duration → CHOICES:{"type":"single","field":"duration","options":["Under 1 month","1–3 months","3–6 months","6–12 months","Over 12 months"]}
- intended_purpose → CHOICES:{"type":"single","field":"intended_purpose","options":["Content Generation","Decision Support","Data Analysis","Process Automation","Customer Service / Chatbot","Risk & Compliance","Other"]}

─── SIGNALS ───
Always append STATE:{<partial fields>} to every message (hidden from user).
When all fields are captured, append CASE_COMPLETE:{<full JSON>} and say something like:
"Great — I've captured everything I need. Please review the summary below and submit when ready."

CASE_COMPLETE JSON for PROJECT:
{
  "project_title": "",
  "case_type": "project",
  "requestor_department": "",
  "problem_statement": "",
  "expected_outcome": "",
  "markets_affected": "",
  "volume_per_month": 0,
  "hours_per_case": 0,
  "team_profile": "",
  "duration": "",
  "teams_involved": "",
  "soft_benefits": "",
  "strategic_driver": "",
  "deadline": "",
  "annual_fte_cost": 0,
  "annual_hours": 0,
  "fte_saving_est": 0,
  "tier": "T1|T2|T3",
  "tshirt": "S|M|L|XL",
  "flags": []
}

CASE_COMPLETE JSON for AI:
{
  "project_title": "",
  "case_type": "ai",
  "requestor_department": "",
  "initiative_description": "",
  "expected_outcome": "",
  "use_type": "",
  "intended_purpose": "",
  "users_scope": "",
  "markets_affected": "",
  "data_types": "",
  "ai_tool": "",
  "ai_model_name": "",
  "ai_is_external_data": false,
  "ai_data_subjects": "",
  "system_integrations": "",
  "additional_context": "",
  "expected_benefits": "",
  "strategic_driver": "",
  "tier": "T1|T2|T3",
  "tier_score": 0,
  "flags": [],
  "tshirt": "S"
}
`.trim();

  useEffect(() => {
    if (history.length === 1 && !currentChoices) {
      setCurrentChoices({
        type: 'single',
        field: 'initial_classification',
        options: ['AI initiative', 'Optimization Project', 'Not sure']
      });
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSendValue = async (value: string) => {
    if (!value.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', content: value };
    setHistory(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await callGemini(WIZARD_PROMPT, [...history, userMessage]);
      
      // Extract state updates if present
      const stateMatch = response.match(/STATE:\s*(\{[\s\S]*?\})/);
      if (stateMatch) {
        try {
          const stateUpdate = JSON.parse(stateMatch[1]);
          setCandidateData(prev => ({ ...prev, ...stateUpdate }));
        } catch (e) {
          console.error("State parse err", e);
        }
      }

      // Extract complete signal if present
      const completeMatch = response.match(/CASE_COMPLETE:\s*(\{[\s\S]*?\})/);
      if (completeMatch) {
        try {
          const caseData = JSON.parse(completeMatch[1]);
          setCompletedCase(caseData);
          setCandidateData(caseData);
        } catch (e) {
          console.error("Complete parse err", e);
        }
      }

      // Extract choices signal if present
      const choicesMatch = response.match(/CHOICES:\s*(\{[\s\S]*?\})/);
      if (choicesMatch) {
        try {
          const choicesData = JSON.parse(choicesMatch[1]);
          setCurrentChoices(choicesData);
        } catch (e) {
          console.error("Choices parse err", e);
        }
      } else {
        setCurrentChoices(null);
      }

      // Clean the response for display - removing all operational signals and raw JSON blocks
      let cleanResponse = response
        .replace(/CASE_COMPLETE:\s*\{[\s\S]*?\}/g, '')
        .replace(/STATE:\s*\{[\s\S]*?\}/g, '')
        .replace(/CHOICES:\s*\{[\s\S]*?\}/g, '')
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/```[\s\S]*?```/g, '')
        // Catch any stray JSON-like blocks at the end or middle
        .replace(/\{[\s\S]*?\}/g, '')
        .trim();

      // If cleaning left it empty but we have data, use a default transition
      if (!cleanResponse && completeMatch) {
         cleanResponse = "Perfect. I've compiled the initiative node. Please review the orchestration block below.";
      }

      setHistory(prev => [...prev, { role: 'assistant', content: cleanResponse || "Signal received. Proceeding." }]);
    } catch (err) {
      setHistory(prev => [...prev, { role: 'assistant', content: "Connection severed. Node unstable." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => handleSendValue(input);

  const submitToPipeline = () => {
    if (!completedCase) return;

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#92B0A9', '#FFB380', '#A3B9A8']
    });

    const finalCase: UnifiedCase = {
      ...completedCase as UnifiedCase,
      id: Date.now().toString(),
      userId: user.uid,
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
      requestor_name: user?.displayName || "Anonymous",
      requestor_email: user?.email || "",
      flags: completedCase.flags || [],
      impl_cost: "0",
      payback_months: "0"
    };

    onCaseSubmit(finalCase);
    setHistory([{ role: 'assistant', content: "Transmission confirmed. Your initiative is now in the pipeline." }]);
    setCompletedCase(null);
    setCandidateData({});
  };

  const PHASES = [
    { name: 'Identity', fields: ['project_title', 'requestor_department'] },
    { name: 'Core Vision', fields: ['problem_statement', 'expected_outcome'] },
    { name: 'Metric Baseline', fields: ['annual_fte_cost'] },
    { name: 'Strategic Fit', fields: ['strategic_driver'] },
    { name: 'Review', fields: ['case_type'] }
  ];

  const getPhaseStatus = (phaseIdx: number) => {
    const phase = PHASES[phaseIdx];
    const completedCount = phase.fields.filter(f => candidateData[f as keyof UnifiedCase]).length;
    if (completedCount === phase.fields.length) return 'completed';
    if (phaseIdx === 0 || (PHASES[phaseIdx-1]?.fields.every(f => candidateData[f as keyof UnifiedCase]))) return 'active';
    return 'pending';
  };

  const progressPercent = Math.min(100, Math.round((Object.keys(candidateData).length / 12) * 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:h-[calc(100vh-140px)] overflow-y-auto lg:overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col gap-4">
        <div className="bg-white rounded-card border border-grey-100 p-6 shadow-sm-kaizen">
          <h3 className="font-bold text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-navy">
            <Activity className="text-indigo" size={14} /> Intake Rhythm
          </h3>
          <div className="w-full bg-grey-50 h-2 rounded-pill overflow-hidden mb-3 border border-grey-100">
            <motion.div 
              className="bg-indigo h-full shadow-sm" 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[9px] font-bold text-grey-400 uppercase tracking-widest tabular-nums">{progressPercent}% ORCHESTRATED</p>

          <div className="mt-10 space-y-5">
            {PHASES.map((p, i) => {
              const status = getPhaseStatus(i);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-pill transition-all duration-700 ${status === 'completed' ? 'bg-indigo' : status === 'active' ? 'bg-indigo ring-4 ring-indigo-lt' : 'bg-grey-100'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${status === 'pending' ? 'text-grey-300' : 'text-navy italic'}`}>{p.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-card border border-grey-100 p-6 shadow-sm-kaizen flex-1 flex flex-col overflow-hidden">
          <h4 className="text-[9px] font-bold text-grey-400 uppercase tracking-widest mb-4">Captured Nodes</h4>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
            {Object.entries(candidateData).filter(([_,v]) => v).map(([k,v]) => (
              <div key={k} className="p-3 bg-grey-50 border border-grey-100 rounded-inner flex items-center justify-between group hover:bg-white transition-standard">
                <span className="text-[9px] font-bold text-grey-400 uppercase tracking-tight truncate mr-2">{k.replace(/_/g, ' ')}</span>
                <CheckCircle2 size={12} className="text-indigo shrink-0" />
              </div>
            ))}
            {Object.keys(candidateData).length === 0 && <p className="text-[10px] text-grey-300 italic">Awakening ZHDUN...</p>}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="lg:col-span-3 flex flex-col bg-white rounded-card border border-grey-100 shadow-sm-kaizen overflow-hidden relative">
        <div className="p-5 border-b border-grey-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-navy text-white rounded-inner flex items-center justify-center font-bold italic shadow-md">Z</div>
            <div>
              <h2 className="font-bold text-sm tracking-tight">Catalyst Interview</h2>
              <p className="text-[9px] font-bold text-indigo uppercase tracking-widest italic tabular-nums">Unified Node V5.1</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-cream/20">
          {history.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-pill shrink-0 flex items-center justify-center text-white font-bold text-[10px] shadow-sm ${msg.role === 'user' ? 'bg-navy' : 'bg-indigo'}`}>
                  {msg.role === 'user' ? 'U' : 'Z'}
                </div>
                <div className={`p-4 rounded-card text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-navy text-white rounded-tr-none' : 'bg-white text-navy border border-grey-100 rounded-tl-none font-medium'}`}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] flex gap-4">
                <div className="w-8 h-8 rounded-pill bg-indigo shrink-0 flex items-center justify-center text-white font-bold text-[10px]">Z</div>
                <div className="p-4 rounded-card bg-white border border-grey-100 rounded-tl-none flex items-center gap-2 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-indigo-dk rounded-pill animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-indigo-dk rounded-pill animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-dk rounded-pill animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          {currentChoices && !isTyping && !completedCase && (
            <QuickReplyChips
              options={currentChoices.options}
              multiSelect={currentChoices.type === 'multi'}
              onSelect={(val) => {
                setCurrentChoices(null);
                handleSendValue(val);
              }}
              onMultiConfirm={(vals) => {
                setCurrentChoices(null);
                handleSendValue(vals.join(', '));
              }}
            />
          )}

          {completedCase && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-indigo/20 rounded-card p-8 shadow-lg-kaizen"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-success-lt text-success rounded-inner shadow-sm line-none">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-navy text-xl italic tracking-tight">Draft Orchestrated</h3>
                  <p className="text-[10px] font-bold text-indigo uppercase tracking-widest mt-0.5">Classification: {completedCase.case_type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {[
                  { label: 'Title', val: completedCase.project_title },
                  { label: 'Dept', val: completedCase.requestor_department },
                  { label: 'Impact / yr', val: formatCurrency(completedCase.annual_fte_cost || 0) },
                  { label: 'Bet', val: completedCase.strategic_driver },
                  { label: 'Magnitude', val: `${completedCase.tier} / ${completedCase.tshirt}` },
                  { label: 'Markets', val: completedCase.markets_affected }
                ].map((i, idx) => (
                  <div key={idx} className="bg-grey-50 p-4 rounded-inner border border-grey-100 ring-1 ring-white/50">
                    <p className="text-[8px] font-bold text-grey-400 uppercase tracking-[0.2em] mb-1.5">{i.label}</p>
                    <p className="text-[11px] font-bold text-navy truncate italic">{i.val || '---'}</p>
                  </div>
                ))}
                {completedCase.case_type !== CaseType.PROJECT && (
                   <div className="col-span-3 bg-indigo-lt/30 p-4 rounded-inner border border-indigo/10">
                     <p className="text-[8px] font-bold text-indigo uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                       <Bot size={12} /> AI Governance Context
                     </p>
                     <p className="text-[11px] font-medium text-indigo italic">
                        Model: <span className="font-bold">{completedCase.ai_model_name || 'Unspecified'}</span> • {completedCase.ai_is_external_data ? 'External Data' : 'Internal Data Only'} • Subjects: {completedCase.ai_data_subjects || 'N/A'}
                     </p>
                   </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={submitToPipeline}
                  className="flex-1 bg-navy hover:bg-indigo text-white py-4 rounded-btn font-bold uppercase text-[10px] tracking-[0.3em] transition-standard shadow-sm-kaizen group"
                >
                  <span className="flex items-center justify-center gap-2 text-white">
                    <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Commit to Pipeline
                  </span>
                </button>
                <button 
                  onClick={() => setCompletedCase(null)}
                  className="px-8 py-4 border border-grey-200 text-grey-400 font-bold rounded-btn hover:bg-grey-50 transition-standard uppercase text-[10px] tracking-widest"
                >
                  Edit Logic
                </button>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {!completedCase && (
          <div className="p-5 bg-white border-t border-grey-100 flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Send orchestrator signal..."
              className="flex-1 bg-grey-50 border border-grey-100 rounded-btn px-6 py-4 text-sm focus:ring-4 focus:ring-indigo/5 focus:border-indigo/30 transition-standard outline-none font-sans font-medium"
            />
            <button
              onClick={handleSend}
              disabled={isTyping}
              className="bg-navy text-white w-14 h-14 flex items-center justify-center rounded-btn hover:bg-indigo transition-standard disabled:opacity-50 shadow-md group border border-navy/10"
            >
              <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- TAB 2: ASSESSMENT PIPELINE ---

function AssessmentPipeline({ cases, onUpdateCase }: { cases: UnifiedCase[], onUpdateCase: (id: string, updates: Partial<UnifiedCase>) => void }) {
  const [selectedCase, setSelectedCase] = useState<UnifiedCase | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  // Sync selectedCase when cases array updates from Firestore
  useEffect(() => {
    if (selectedCase) {
      const match = cases.find(c => c.id === selectedCase.id);
      if (match) setSelectedCase(match);
    }
  }, [cases, selectedCase?.id]);

  const columns = [
    { id: ProjectStatus.PENDING, title: 'Pending Review', accent: 'gold', text: 'text-gold-dk', bg: 'bg-gold-lt' },
    { id: ProjectStatus.REVIEW, title: 'In Review', accent: 'indigo', text: 'text-indigo', bg: 'bg-indigo-lt' },
    { id: ProjectStatus.DECIDED, title: 'Decided', accent: 'grey-400', text: 'text-grey-700', bg: 'bg-grey-100' },
  ];

  const handleCardClick = (c: UnifiedCase) => {
    if (c.status === ProjectStatus.PENDING) {
      onUpdateCase(c.id, { status: ProjectStatus.REVIEW });
    }
    // We set selected case locally for the UI panel, 
    // it will be synced by the useEffect above when DB updates
    setSelectedCase(c);
  };

  const updateSelectedCase = (updates: Partial<UnifiedCase>) => {
    if (!selectedCase) return;
    onUpdateCase(selectedCase.id, updates);
  };

  const handleDecision = (decision: ProjectDecision | AIDecision) => {
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
    if (s >= 4.0) return { text: 'Strong GO', color: 'success' };
    if (s >= 3.0) return { text: 'Conditional GO', color: 'gold' };
    if (s >= 2.0) return { text: 'Hold', color: 'gold' };
    return { text: 'No-Go', color: 'danger' };
  };

  const verdict = getScoreVerdict(calculatedScore);

  const requestAIScoring = async () => {
    if (!selectedCase || isScoring) return;
    setIsScoring(true);
    
    const prompt = `
      Review this transformation business case:
      Type: ${selectedCase.case_type}
      Title: ${selectedCase.project_title}
      Requestor: ${selectedCase.requestor_name} (${selectedCase.requestor_department})
      Problem: ${selectedCase.problem_statement}
      Outcome: ${selectedCase.expected_outcome}
      Annual Savings: ${selectedCase.annual_fte_cost}
      Strategic Bet: ${selectedCase.strategic_driver}
      Markets: ${selectedCase.markets_affected}
      ${selectedCase.case_type !== CaseType.PROJECT ? `AI Context: Model ${selectedCase.ai_model_name}, Ext Data: ${selectedCase.ai_is_external_data}, Subjects: ${selectedCase.ai_data_subjects}` : ''}

      Kaizen Pillars (Big Bets): Hey Betano (AI), Shield Betano (Risk), Betano Republic (Model), Core Betano (Ops).

      Provide suggested 1-5 scores for:
      1. score_problem (intensity of the problem)
      2. score_benefit (ROI/Scale)
      3. score_strategic (Alignment with Big Bets)
      4. score_feasibility (Ease of implementation)
      5. score_urgency (Timeline pressure)
      6. score_data (Data readiness / quality)

      Then write 2 sentences of high-level assessment notes.
      FORMAT: JSON exactly: {"scores": {"score_problem": p, "score_benefit": b, "score_strategic": s, "score_feasibility": f, "score_urgency": u, "score_data": d}, "notes": ""}
    `;

      try {
        const resp = await callGeminiOnce(prompt);
        const data = JSON.parse(resp);
        updateSelectedCase({
          ...data.scores,
          assessment_notes: data.notes
        });
      } catch (e) {
      console.error(e);
    } finally {
      setIsScoring(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden font-sans">
      <div className="flex h-full gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {columns.map(col => (
          <div key={col.id} className="w-[340px] shrink-0 flex flex-col bg-grey-50/50 rounded-card border border-grey-100 overflow-hidden">
            <div className={`p-4 border-b border-grey-100 flex items-center justify-between ${col.bg}`}>
              <h3 className={`font-bold text-[10px] uppercase tracking-widest ${col.text}`}>{col.title}</h3>
              <span className={`px-2 py-0.5 rounded-pill bg-white text-[9px] font-bold ${col.text} border border-grey-100 tabular-nums`}>
                {cases.filter(c => c.status === (col.id as unknown as ProjectStatus)).length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {cases.filter(c => c.status === (col.id as unknown as ProjectStatus)).map(c => {
                const colorClass = c.decision === ProjectDecision.GO ? 'success' : c.decision === ProjectDecision.NOGO ? 'danger' : c.decision === ProjectDecision.HOLD ? 'gold' : c.status === ProjectStatus.PENDING ? 'gold' : 'indigo';
                return (
                <motion.div
                  key={c.id}
                  layoutId={c.id}
                  whileHover={{ y: -2, scale: 1.01 }}
                  onClick={() => handleCardClick(c)}
                  className={`bg-white p-4 rounded-inner border shadow-sm cursor-pointer transition-standard ${
                    selectedCase?.id === c.id ? 'border-navy shadow-md-kaizen' : 'border-grey-100 hover:border-grey-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[8px] font-bold uppercase py-0.5 px-1.5 rounded-pill tracking-tight shadow-sm border ${
                      c.case_type === CaseType.AI ? 'bg-indigo text-white border-indigo' : 
                      c.case_type === CaseType.HYBRID ? 'bg-navy text-indigo-lt border-navy' : 
                      'bg-white text-grey-400 border-grey-100'
                    }`}>
                      {c.case_type}
                    </span>
                    <span className="text-[9px] font-bold text-grey-300 tabular-nums uppercase tracking-tight">{c.tshirt}</span>
                  </div>
                  <h4 className="text-xs font-bold text-navy mb-2 line-clamp-2 leading-snug italic tracking-tight uppercase">
                    {c.project_title}
                  </h4>
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-grey-400">
                    <span className="tabular-nums">{formatCurrency(c.annual_fte_cost || 0)}</span>
                    <span className="opacity-50">• {c.tier}</span>
                  </div>
                </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedCase && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-20 right-0 bottom-0 w-[420px] bg-white border-l border-grey-100 shadow-2xl z-50 overflow-y-auto custom-scrollbar font-sans"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                     <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-pill border ${
                        selectedCase.case_type === CaseType.AI ? 'bg-indigo text-white border-indigo' : 
                        selectedCase.case_type === CaseType.HYBRID ? 'bg-navy text-white border-navy' : 
                        'bg-grey-100 text-grey-400 border-grey-200'
                      }`}>
                        {selectedCase.case_type} Node
                     </span>
                     <span className="text-[9px] font-bold text-grey-300 uppercase italic">ID: #{selectedCase.id.slice(-4)}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-navy leading-tight tracking-tighter uppercase italic">{selectedCase.project_title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedCase(null)}
                  className="p-2 hover:bg-grey-100 rounded-pill transition-standard group"
                >
                  <X size={20} className="text-grey-300 group-hover:text-navy" />
                </button>
              </div>

              {/* Assessment Panel */}
              <div className="space-y-6">
                {/* Scoring Header */}
                <div className="bg-navy p-6 rounded-card text-white relative overflow-hidden group shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-pill -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-1000" />
                  <div className="flex items-end justify-between relative z-10">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mb-1 leading-none">Unified Index</p>
                      <div className="text-5xl font-bold italic tracking-tighter tabular-nums leading-none">{calculatedScore}</div>
                    </div>
                    <div className="text-right">
                      <div className={`px-4 py-1.5 rounded-pill text-[10px] font-bold uppercase tracking-widest bg-white border border-white/10 ${
                        verdict.color === 'success' ? 'text-success' : 
                        verdict.color === 'gold' ? 'text-gold-dk' : 
                        'text-danger'
                      } shadow-sm mb-2`}>
                        {verdict.text}
                      </div>
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest tabular-nums italic leading-none">Weight: Standard</p>
                    </div>
                  </div>
                </div>

                {/* Score Sliders */}
                <div className="bg-grey-50/50 p-6 rounded-card border border-grey-100 grid grid-cols-2 gap-x-8 gap-y-6 shadow-sm">
                  {[
                    { label: 'Problem Intensity', field: 'score_problem' },
                    { label: 'Benefit / ROI', field: 'score_benefit' },
                    { label: 'Strategic Fit', field: 'score_strategic' },
                    { label: 'Feasibility', field: 'score_feasibility' },
                    { label: 'Urgency', field: 'score_urgency' },
                    { label: 'Data Readiness', field: 'score_data' },
                  ].map(score => (
                    <div key={score.field}>
                      <div className="flex justify-between mb-2">
                        <span className="text-[9px] font-bold text-grey-400 uppercase tracking-widest italic">{score.label}</span>
                        <span className="text-[10px] font-bold text-navy tabular-nums">{selectedCase[score.field as keyof UnifiedCase] as number}/5</span>
                      </div>
                      <input 
                        type="range" min="0" max="5" step="1"
                        value={selectedCase[score.field as keyof UnifiedCase] as number}
                        onChange={(e) => updateSelectedCase({ [score.field]: parseInt(e.target.value) })}
                        className="w-full accent-indigo"
                      />
                    </div>
                  ))}
                  <div className="col-span-2 pt-4 border-t border-grey-100">
                    <p className="text-[9px] text-grey-400 italic text-center mb-2">Automated scoring initialized via pipeline logic</p>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-white border border-grey-100 p-6 rounded-card shadow-sm group">
                  <h4 className="text-[10px] font-bold text-grey-400 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                    <FileText size={14} className="text-indigo" /> Assessment Record
                  </h4>
                  <textarea 
                    value={selectedCase.assessment_notes || ''}
                    onChange={(e) => updateSelectedCase({ assessment_notes: e.target.value })}
                    className="w-full h-24 bg-transparent border-none focus:ring-0 text-sm italic text-navy font-medium p-0 leading-relaxed placeholder:text-grey-200"
                    placeholder="Enter strategic observations..."
                  />
                </div>

                {/* Case Type Context */}
                {selectedCase.case_type !== CaseType.PROJECT && (
                   <div className="bg-navy p-6 rounded-card border border-navy shadow-lg relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-indigo/20 rounded-pill -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000" />
                     <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-6 flex items-center gap-2 italic">
                        <Bot size={14} className="text-indigo-lt" /> Intelligence Protocols
                     </h4>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/5 p-3 rounded-inner border border-white/10">
                          <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Model Architecture</p>
                          <p className="text-xs font-bold text-white italic truncate">{selectedCase.ai_model_name || 'Generic LLM'}</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-inner border border-white/10">
                          <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Data Boundary</p>
                          <p className="text-xs font-bold text-white italic">{selectedCase.ai_is_external_data ? 'External Node' : 'Enclosed Env'}</p>
                        </div>
                        <div className="col-span-2 bg-white/5 p-3 rounded-inner border border-white/10">
                          <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Data Subjects</p>
                          <p className="text-xs font-bold text-white italic truncate leading-none">{selectedCase.ai_data_subjects || 'N/A'}</p>
                        </div>
                     </div>
                   </div>
                )}

                {/* T3 AI Governance Checkboxes */}
                {selectedCase.case_type !== CaseType.PROJECT && selectedCase.tier === 'T3' && (
                  <div className="bg-white border border-grey-100 p-6 rounded-card shadow-sm space-y-4">
                    <h4 className="text-[10px] font-bold text-grey-400 uppercase tracking-widest mb-2 flex items-center gap-2 italic">
                      <ShieldCheck size={14} className="text-danger" /> T3 Governance Anchors
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { label: 'DPO Approval', field: 'dpo_approved' },
                        { label: 'Security Review', field: 'security_approved' },
                        { label: 'Arch Council', field: 'architecture_approved' }
                      ].map(item => (
                        <label key={item.field} className="flex items-center gap-3 p-3 bg-grey-50 rounded-inner border border-grey-100 cursor-pointer hover:bg-white transition-standard">
                          <input 
                            type="checkbox"
                            checked={!!selectedCase[item.field as keyof UnifiedCase]}
                            onChange={(e) => updateSelectedCase({ [item.field]: e.target.checked })}
                            className="w-4 h-4 accent-indigo rounded"
                          />
                          <span className="text-xs font-bold text-navy uppercase tracking-tight">{item.label}</span>
                          {selectedCase[item.field as keyof UnifiedCase] && (
                            <CheckCircle2 size={12} className="text-success ml-auto" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Details Section */}
                <div className="p-6 bg-grey-50/30 rounded-card border border-grey-100 border-dashed space-y-6 shadow-tiny">
                  <div>
                    <h4 className="text-[10px] font-bold text-grey-300 uppercase tracking-widest mb-3 italic">Initiative Context</h4>
                    <p className="text-sm text-navy font-medium leading-relaxed italic">"{selectedCase.problem_statement}"</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-grey-300 uppercase tracking-widest mb-3 italic">Projected Outcome</h4>
                    <p className="text-sm text-navy font-medium leading-relaxed italic">"{selectedCase.expected_outcome}"</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white border border-grey-100 rounded-inner shadow-tiny">
                      <p className="text-[8px] font-bold text-grey-400 uppercase tracking-[0.2em] mb-1">Impact Radius</p>
                      <p className="text-xs font-bold text-navy italic">{selectedCase.markets_affected}</p>
                    </div>
                    <div className="p-3 bg-white border border-grey-100 rounded-inner shadow-tiny">
                      <p className="text-[8px] font-bold text-grey-300 uppercase tracking-[0.2em] mb-1">Strategic Bet</p>
                      <p className="text-[10px] font-bold text-indigo italic truncate">{selectedCase.strategic_driver}</p>
                    </div>
                  </div>
                </div>

                {/* Final Decision Section */}
                <div className="pt-6 border-t border-grey-100 pb-10">
                  <h4 className="text-[10px] font-bold text-grey-400 uppercase tracking-widest mb-6 flex items-center gap-2 italic">
                    <CheckCircle2 size={14} className="text-success" /> Decision Matrix
                  </h4>
                  {selectedCase.case_type !== CaseType.PROJECT ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleDecision(AIDecision.REJECTED)}
                          className="flex-1 px-4 py-3 rounded-btn border border-danger/20 text-danger text-[10px] font-bold uppercase tracking-widest hover:bg-danger hover:text-white transition-standard bg-white shadow-sm"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleDecision(AIDecision.NEEDS_INFO)}
                          className="flex-1 px-4 py-3 rounded-btn border border-gold-dk/20 text-gold-dk text-[10px] font-bold uppercase tracking-widest hover:bg-gold-dk hover:text-white transition-standard bg-white shadow-sm"
                        >
                          Needs Info
                        </button>
                      </div>
                      <button 
                        onClick={() => handleDecision(AIDecision.APPROVED)}
                        className="w-full px-4 py-4 rounded-btn bg-success hover:bg-success/90 text-white text-[10px] font-bold uppercase tracking-widest transition-standard shadow-md-kaizen"
                      >
                        Approve Governance Node
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleDecision(ProjectDecision.NOGO)}
                        className="flex-1 px-4 py-4 rounded-btn border border-danger/20 text-danger text-[10px] font-bold uppercase tracking-widest hover:bg-danger hover:text-white transition-standard bg-white shadow-sm"
                      >
                        Archive / Reject
                      </button>
                      <button 
                        onClick={() => handleDecision(ProjectDecision.GO)}
                        className="flex-1 px-4 py-4 rounded-btn bg-success hover:bg-success/90 text-white text-[10px] font-bold uppercase tracking-widest transition-standard shadow-md-kaizen"
                      >
                        Approve Initiative
                      </button>
                    </div>
                  )}
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

function ExecutiveDashboard({ cases }: { cases: UnifiedCase[] }) {
  const goCases = cases.filter(c => c.decision === ProjectDecision.GO);
  const decidedCases = cases.filter(c => c.status === ProjectStatus.DECIDED);
  
  const totalBenefit = goCases.reduce((acc, c) => acc + (parseFloat(c.annual_fte_cost as any) || 0), 0);
  const totalImplCost = goCases.reduce((acc, c) => acc + (parseFloat(c.impl_cost as any) || 0), 0);
  const roi = totalImplCost > 0 ? ((totalBenefit / totalImplCost) * 100).toFixed(0) : '0';
  const avgPayback = goCases.length > 0 ? (goCases.reduce((acc, c) => acc + (parseFloat(c.payback_months as any) || 0), 0) / goCases.length).toFixed(1) : '0';

  const killRate = decidedCases.length > 0 ? ((cases.filter(c => c.decision === ProjectDecision.NOGO).length / decidedCases.length) * 100).toFixed(0) : '0';

  const getAvgDays = (filteredCases: UnifiedCase[]) => {
    if (filteredCases.length === 0) return 0;
    const total = filteredCases.reduce((acc, c) => {
      const created = new Date(c.created_at).getTime();
      const decided = c.decided_at ? new Date(c.decided_at).getTime() : Date.now();
      return acc + (decided - created);
    }, 0);
    return Math.round(total / (1000 * 60 * 60 * 24 * filteredCases.length));
  };

  const aiMix = cases.length > 0 ? ((cases.filter(c => c.case_type === CaseType.AI).length / cases.length) * 100).toFixed(0) : '0';
  const hybridMix = cases.length > 0 ? ((cases.filter(c => c.case_type === CaseType.HYBRID).length / cases.length) * 100).toFixed(0) : '0';

  const deptCounts: Record<string, number> = {};
  cases.forEach(c => {
    const dept = c.requestor_department || 'Unknown';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  const topDept = Object.entries(deptCounts).sort((a,b) => b[1] - a[1])[0] || ['N/A', 0];

  const tshirtMix = { [TshirtSize.S]: 0, [TshirtSize.M]: 0, [TshirtSize.L]: 0, [TshirtSize.XL]: 0 };
  cases.forEach(c => tshirtMix[c.tshirt]++);

  const funnel = [
    { label: 'Submitted', count: cases.length, pct: 100 },
    { label: 'Reviewed', count: cases.filter(c => c.status !== ProjectStatus.PENDING).length, pct: (cases.filter(c => c.status !== ProjectStatus.PENDING).length / (cases.length || 1)) * 100 },
    { label: 'Decided', count: decidedCases.length, pct: (decidedCases.length / (cases.length || 1)) * 100 },
    { label: 'Go Issued', count: goCases.length, pct: (goCases.length / (cases.length || 1)) * 100 },
  ];

  return (
    <div className="space-y-10 pb-20 font-sans h-full overflow-y-auto pr-2 scrollbar-hide">
      <section>
        <h3 className="font-bold text-grey-400 text-[10px] uppercase tracking-[0.2em] mb-6 italic">Financial Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
             { label: 'Total Benefit', val: formatCurrency(totalBenefit), color: 'indigo', icon: LineChart },
             { label: 'Pipeline Val', val: formatCurrency(totalImplCost), color: 'grey-400', icon: Package },
             { label: 'Portfolio ROI', val: roi + '%', color: 'success', icon: Target },
             { label: 'Avg Payback', val: avgPayback + ' mo', color: 'indigo', icon: Clock },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white border border-grey-100 p-6 rounded-card shadow-sm-kaizen transition-standard hover:shadow-md-kaizen group">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-inner bg-${kpi.color === 'grey-400' ? 'grey-50' : kpi.color + '-lt'} text-${kpi.color === 'grey-400' ? 'grey-500' : kpi.color} group-hover:scale-110 transition-standard`}>
                  <kpi.icon size={18} />
                </div>
                <span className="text-[10px] text-grey-400 font-bold uppercase tracking-wider">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-navy italic tracking-tight tabular-nums">{kpi.val}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-bold text-grey-400 text-[10px] uppercase tracking-[0.2em] mb-6 italic">Portfolio Velocity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
             { label: 'Kill Rate', val: killRate + '%', color: 'danger', icon: AlertCircle },
             { label: 'AI Intensity', val: aiMix + '%', color: 'indigo', icon: Bot },
             { label: 'Hybrid Nodes', val: hybridMix + '%', color: 'navy', icon: Activity },
             { label: 'Portfolio Magnitude', val: cases.length, color: 'gold', icon: Layers },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-white border border-grey-100 p-6 rounded-card shadow-sm-kaizen transition-standard hover:shadow-md-kaizen group">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-inner bg-${kpi.color + '-lt'} text-${kpi.color} group-hover:scale-110 transition-standard`}>
                  <kpi.icon size={18} />
                </div>
                <span className="text-[10px] text-grey-400 font-bold uppercase tracking-wider">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-navy italic tracking-tight tabular-nums">{kpi.val}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-white border border-grey-100 p-8 rounded-card shadow-sm-kaizen">
          <h3 className="font-bold text-grey-400 text-[10px] uppercase tracking-[0.2em] mb-8 italic">Submission Funnel</h3>
          <div className="space-y-8">
            {funnel.map((step, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-center mb-2.5 px-0.5">
                  <span className="text-[11px] font-bold text-navy uppercase tracking-widest">{step.label}</span>
                  <span className="text-[10px] font-bold text-grey-400 tabular-nums">{step.count} NODES</span>
                </div>
                <div className="w-full bg-grey-50 h-10 rounded-pill overflow-hidden relative border border-grey-100/50 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${step.pct}%` }}
                    className={`h-full bg-navy flex items-center justify-end px-4 transition-standard group-hover:bg-indigo shadow-lg`}
                  >
                    <span className="text-[10px] font-bold text-white tabular-nums tracking-widest leading-none">{step.pct.toFixed(0)}%</span>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-10">
          <section className="bg-navy text-white p-8 rounded-card shadow-lg-kaizen relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo/10 rounded-pill -mt-32 -mr-32 blur-3xl group-hover:bg-indigo/20 transition-standard" />
             <div className="relative z-10">
               <h3 className="font-bold text-indigo/50 text-[10px] uppercase tracking-[0.2em] mb-8 italic">Node Magnitude</h3>
               <div className="grid grid-cols-2 gap-4">
                  {Object.entries(tshirtMix).map(([size, count]) => (
                    <div key={size} className="bg-white/5 border border-white/10 p-4 rounded-inner flex justify-between items-center">
                       <span className="text-[9px] font-bold uppercase text-white/40 tracking-widest">{size}</span>
                       <span className="text-xl font-bold italic tabular-nums">{count}</span>
                    </div>
                  ))}
               </div>
             </div>
          </section>

          <section className="bg-white border border-grey-100 p-8 rounded-card shadow-sm-kaizen">
            <h3 className="font-bold text-grey-400 text-[10px] uppercase tracking-[0.2em] mb-8 italic">Lead Catalyst Unit</h3>
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-inner bg-indigo-lt text-indigo flex items-center justify-center font-bold text-2xl shadow-sm italic ring-4 ring-white">
                  {topDept[0].toString().charAt(0)}
               </div>
               <div>
                  <p className="text-2xl font-bold text-navy italic tracking-tighter uppercase">{topDept[0]}</p>
                  <p className="text-[10px] font-bold text-grey-400 uppercase tracking-widest mt-1 italic">{topDept[1] as number} Orchestrations Submitted</p>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
