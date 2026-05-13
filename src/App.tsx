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
            className="px-4 py-2 rounded-pill bg-white border border-indigo/30 text-indigo text-[10px] font-medium 
                       hover:bg-indigo hover:text-white hover:border-indigo transition-standard shadow-sm tracking-wider"
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
            className={`px-4 py-2 rounded-pill text-[10px] font-medium transition-standard shadow-sm border tracking-wider
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
          className="px-6 py-2 bg-navy text-white rounded-pill text-[9px] font-medium tracking-[0.2em] shadow-md hover:bg-indigo transition-standard"
        >
          Confirm ({selected.length} selected)
        </button>
      )}
    </div>
  );
}

const TIER_NAMES: Record<string, string> = {
  'T1': 'Strategic',
  'T2': 'Tactical',
  'T3': 'Quick Win'
};

const formatCurrency = (val: string | number) => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);
};

const getStatusColor = (status: ProjectStatus, decision: ProjectDecision | AIDecision | null) => {
  if (status === ProjectStatus.ACCEPTED) return 'success';
  if (status === ProjectStatus.REJECTED) return 'danger';
  if (status === ProjectStatus.NEEDS_INFO) return 'gold';
  if (status === ProjectStatus.PENDING) return 'gold';
  if (status === ProjectStatus.REVIEW) return 'indigo';
  if (decision === ProjectDecision.GO || decision === AIDecision.APPROVED) return 'success';
  if (decision === ProjectDecision.NOGO || decision === AIDecision.REJECTED) return 'danger';
  if (decision === ProjectDecision.HOLD || decision === AIDecision.NEEDS_INFO) return 'gold';
  return 'grey';
};

const ScoringSpheres = ({ score }: { score: number }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i} 
          className={`w-2 h-2 rounded-pill ${i <= Math.round(score) ? 'bg-indigo' : 'bg-grey-200'}`} 
        />
      ))}
    </div>
  );
};

const getOverallScore = (c: UnifiedCase) => {
  return (
    (c.score_problem * 0.2) +
    (c.score_benefit * 0.25) +
    (c.score_strategic * 0.2) +
    (c.score_feasibility * 0.15) +
    (c.score_urgency * 0.1) +
    (c.score_data * 0.1)
  );
};

const getSuggestedOutcome = (score: number) => {
  if (score >= 4.0) return { text: "Strong GO — prioritise", color: "success" };
  if (score >= 3.0) return { text: "Conditional GO — address gaps first", color: "indigo" };
  if (score >= 2.0) return { text: "HOLD — significant rework needed", color: "gold" };
  return { text: "NO-GO — fundamental issues", color: "danger" };
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
        <p className="text-[10px] font-medium text-indigo leading-none mb-1">{label}</p>
        <input 
          autoFocus
          className="w-full text-lg font-mono font-medium text-base outline-none bg-indigo-lt/30 px-1 rounded" 
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
      <p className="text-[10px] font-medium text-grey-400 leading-none mb-1 group-hover:text-indigo transition-colors">{label}</p>
      <p className="text-lg font-mono font-medium text-base group-hover:text-indigo transition-colors">
        {isCurrency && value ? formatCurrency(value) : (value || '—')}
      </p>
      {note && <p className="text-[8px] text-grey-400 mt-1">{note}</p>}
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
    <span className={`px-2.5 py-1 rounded-pill text-[10px] font-medium tracking-wider border ${colors[color] || colors.grey}`}>
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
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill ${cfg.bg} ${cfg.text} font-medium text-[9px] tracking-widest border ${cfg.border} shadow-sm`}>
      <span className="text-[11px] leading-none">{cfg.icon}</span> {driver || 'Project'}
    </span>
  );
};

// REDUNDANT SECTIONS CLEANED

// --- TAB 1: INTAKE WIZARD (ZHDUN) ---

// TAB 2: MY SUBMISSIONS

function MySubmissionsModule({ cases, onSelectCase }: { cases: UnifiedCase[], onSelectCase: (c: UnifiedCase) => void }) {
  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-card border-2 border-dashed border-grey-100 font-sans">
        <div className="w-16 h-16 bg-grey-50 rounded-pill flex items-center justify-center text-grey-200 mb-6 shadow-tiny">
          <ClipboardList size={32} />
        </div>
        <div>
          <h3 className="text-xl font-medium mb-2 text-navy">No Submissions Yet</h3>
          <p className="text-grey-400 font-medium max-w-sm">Use the Intake Wizard to start your first transformation or AI initiative.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
           <h2 className="text-3xl font-medium tracking-tight text-navy">My Initiatives</h2>
           <p className="text-grey-400 font-medium mt-1">Tracking {cases.length} active nodes</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-grey-100 p-1 rounded-pill border border-grey-200 shadow-tiny">
             <button className="px-4 py-1.5 rounded-pill bg-white text-[10px] font-medium text-navy shadow-sm">All</button>
             <button className="px-4 py-1.5 rounded-pill text-[10px] font-medium text-grey-400 hover:text-navy transition-standard">Active</button>
             <button className="px-4 py-1.5 rounded-pill text-[10px] font-medium text-grey-400 hover:text-navy transition-standard">Decided</button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 overflow-y-auto pr-2">
        {cases.map((c) => (
          <motion.div 
             key={c.id} 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             onClick={() => onSelectCase(c)}
             className={`bg-white rounded-card border border-grey-100 p-6 shadow-sm-kaizen hover:shadow-md-kaizen transition-standard group cursor-pointer border-l-4 relative overflow-hidden ${
               getStatusColor(c.status, c.decision) === 'gold' ? 'border-l-gold' :
               getStatusColor(c.status, c.decision) === 'success' ? 'border-l-success' :
               getStatusColor(c.status, c.decision) === 'danger' ? 'border-l-danger' :
               getStatusColor(c.status, c.decision) === 'indigo' ? 'border-l-indigo' :
               'border-l-grey-300'
             }`}
          >
             <div className="flex justify-between items-start mb-6">
                <Badge color={c.case_type === CaseType.AI ? 'gold' : c.case_type === CaseType.HYBRID ? 'indigo' : 'sage'}>{c.case_type}</Badge>
                <div className={`flex items-center gap-2 text-[10px] font-medium text-${getStatusColor(c.status, c.decision)}`}>
                   <div className={`w-2 h-2 rounded-pill bg-current animate-pulse`} />
                   {c.decision ? c.decision.replace(/_/g, ' ') : c.status}
                </div>
             </div>

             <h4 className="font-medium text-lg text-navy mb-3 group-hover:text-indigo transition-standard line-clamp-1">{c.project_title}</h4>
             <p className="text-xs text-grey-400 font-medium mb-6 line-clamp-3 leading-relaxed h-[4.5em]">
               "{c.case_type === CaseType.AI ? (c.initiative_description || c.problem_statement) : c.problem_statement}"
             </p>

             <div className="grid grid-cols-2 gap-4 pt-6 border-t border-grey-50">
                <div>
                   <p className="text-[8px] font-medium text-grey-300 tracking-wider mb-1">
                     Tier / Size
                   </p>
                   <p className="text-[11px] font-medium text-navy tabular-nums">
                     {TIER_NAMES[c.tier as string] || c.tier} / {c.tshirt}
                   </p>
                </div>
                <div>
                  <p className="text-[8px] font-medium text-grey-300 tracking-wider mb-1">Benefit Est.</p>
                  <p className="text-[11px] font-medium text-navy tabular-nums">
                    {c.case_type === CaseType.AI ? 'N/A' : formatCurrency(c.annual_fte_cost || 0)}
                  </p>
                </div>
                <div className="col-span-2 pt-2">
                   <p className="text-[8px] font-medium text-grey-300 tracking-wider mb-2">Strategy</p>
                   {c.strategic_driver && <BigBetBadge driver={c.strategic_driver} />}
                   {!c.strategic_driver && <p className="text-[10px] text-grey-300">No Strategic Driver</p>}
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
  const [viewingCaseId, setViewingCaseId] = useState<string | null>(null);

  const viewingCase = cases.find(c => c.id === viewingCaseId) || null;

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
        <h2 className="text-4xl font-medium text-navy tracking-tight mb-2">ZH<span className="text-indigo">DUN</span></h2>
        <p className="text-grey-400 text-[10px] font-medium tracking-[0.4em] tabular-nums">Establishing Connection Node</p>
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
          
          <h1 className="text-5xl font-medium text-navy tracking-tighter mb-3">
            ZH<span className="text-indigo">DUN</span>
          </h1>
          <p className="text-grey-400 text-[9px] font-medium tracking-[0.4em] mb-10 opacity-70">Central Operations Hub</p>
          
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
              <div className="w-6 h-6 bg-white rounded-pill flex items-center justify-center text-navy text-[10px] font-medium group-hover:scale-110 transition-transform">G</div>
              <span className="text-sm font-medium tracking-widest text-white">Authorize with Google</span>
            </motion.button>
          </div>
          
          <p className="mt-10 text-[8px] text-grey-300 font-medium tracking-[0.3em] tabular-nums">
            Enterprise Security Enforced
          </p>
        </motion.div>
        
        <div className="absolute bottom-10 text-[9px] font-medium text-grey-300 tracking-[0.5em] opacity-40 tabular-nums">
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
                  <p className="text-[11px] font-medium text-navy leading-none tracking-tight">{user.displayName}</p>
                  <button onClick={(e) => { e.stopPropagation(); authService.logout(); }} className="text-[9px] font-medium text-danger tracking-widest hover:text-danger-lt transition-standard mt-1 cursor-pointer">Disconnect</button>
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
                      className="bg-danger text-white px-6 py-3 rounded-pill font-medium text-[10px] tracking-widest shadow-lg flex items-center gap-2 whitespace-nowrap cursor-pointer"
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
                <h1 className="text-7xl font-medium text-navy tracking-tighter leading-none mb-4 uppercase">ZH<span className="text-indigo">DUN</span></h1>
                <p className="text-grey-400 font-medium text-[9px] tracking-[0.5em] opacity-80">Operational Intelligence Platform</p>
              </div>
            </div>
            <p className="text-grey-500 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
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
              </div>
              <h3 className="text-4xl font-medium text-white mb-4 tracking-tight">AI Transformation Roadmap</h3>
              <p className="text-white/60 text-lg font-medium leading-relaxed mb-10 flex-1">
                Initiate initiatives with AI assistance. A single gateway for transformation projects, AI governance.
              </p>
              <div className="flex items-center gap-4 text-white font-medium text-xs tracking-[0.3em] group-hover:translate-x-3 transition-transform">
                Initialize System <ArrowRight size={18} className="text-indigo" />
              </div>
            </motion.button>
          </div>
        </div>

        <div className="absolute bottom-12 text-[10px] font-medium text-grey-300 tracking-[0.6em] opacity-40 tabular-nums">
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
    <div className="h-screen bg-cream flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-20 bg-white/80 backdrop-blur-lg border-b border-grey-100 px-6 md:px-10 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Z" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-medium tracking-tighter text-navy flex items-center gap-2">
              ZH<span className="text-indigo">DUN</span>
            </h1>
          </div>
        </div>

        <nav className="flex gap-1.5 bg-grey-100/50 p-1.5 rounded-pill border border-grey-200/50 overflow-x-auto scrollbar-hide max-w-[50%] md:max-w-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 md:px-6 py-2 rounded-pill text-[10px] font-medium tracking-widest transition-standard shrink-0 ${
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
            <p className="text-[10px] font-medium text-navy tracking-tight leading-none mb-1">{user.displayName}</p>
            <p className="text-[9px] font-medium text-indigo tracking-widest leading-none tabular-nums">{cases.length} Nodes Active</p>
          </div>
          <div className="relative group">
            <img src={user.photoURL} alt="" className="w-10 h-10 rounded-pill border-2 border-white shadow-md cursor-pointer" />
            <div className="absolute right-0 top-full mt-2 hidden group-hover:block w-48 bg-white rounded-btn shadow-lg border border-grey-100 p-2 z-50">
              <button 
                onClick={() => authService.logout()}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-grey-50 text-xs font-medium text-danger rounded-btn transition-standard md:cursor-pointer"
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
               <MySubmissionsModule 
                 cases={cases.filter(c => c.userId === user.uid || c.requestor_email === user.email)} 
                 onSelectCase={(c) => setViewingCaseId(c.id)}
               />
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
                <AssessmentPipeline 
                  cases={cases} 
                  onUpdateCase={handleUpdateCase} 
                  onSelectDetailedCase={(c) => setViewingCaseId(c.id)}
                />
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="bg-white p-10 rounded-card border border-grey-100 shadow-lg text-center max-w-sm">
                  <ShieldCheck size={40} className="text-danger mx-auto mb-6" />
              <h3 className="text-lg font-medium text-navy mb-2">Access Restricted</h3>
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

      <CaseDetailsModal 
        isOpen={!!viewingCaseId} 
        onClose={() => setViewingCaseId(null)} 
        item={viewingCase} 
        onUpdate={handleUpdateCase}
        isAdmin={isAdmin}
        isAnalysisView={activeTab === 'pipeline'}
      />
    </div>
  );
}

// --- CASE DETAILS MODAL ---

function CaseDetailsModal({ isOpen, onClose, item, onUpdate, isAdmin, isAnalysisView }: { 
  isOpen: boolean, 
  onClose: () => void, 
  item: UnifiedCase | null,
  onUpdate: (id: string, updates: Partial<UnifiedCase>) => Promise<void>,
  isAdmin: boolean,
  isAnalysisView: boolean
}) {
  if (!item) return null;

  const isAI = item.case_type === CaseType.AI || item.case_type === CaseType.HYBRID;

    const handleDecision = async (status: ProjectStatus, decision: ProjectDecision | AIDecision | null = null) => {
    let reason = "";
    if (status === ProjectStatus.REJECTED) {
      reason = window.prompt("Please provide a reason for rejection:") || "";
    } else if (status === ProjectStatus.NEEDS_INFO) {
      reason = window.prompt("What additional information is needed?") || "";
    }

    const updates: Partial<UnifiedCase> = {
      status,
      decision: decision || (status === ProjectStatus.ACCEPTED ? (isAI ? AIDecision.APPROVED : ProjectDecision.GO) : (status === ProjectStatus.REJECTED ? (isAI ? AIDecision.REJECTED : ProjectDecision.NOGO) : (status === ProjectStatus.NEEDS_INFO ? (isAI ? AIDecision.NEEDS_INFO : ProjectDecision.HOLD) : null))),
      updatedAt: new Date().toISOString()
    };

    if (status === ProjectStatus.ACCEPTED || status === ProjectStatus.REJECTED) {
      updates.decided_at = new Date().toISOString();
    } else if (item.decided_at) {
      updates.decided_at = item.decided_at;
    }

    if (status === ProjectStatus.REJECTED) {
      updates.rejection_reason = reason;
    } else if (item.rejection_reason) {
      updates.rejection_reason = item.rejection_reason;
    }

    if (status === ProjectStatus.NEEDS_INFO) {
      updates.needs_info_details = reason;
    } else if (item.needs_info_details) {
      updates.needs_info_details = item.needs_info_details;
    }

    await onUpdate(item.id, updates);
  };

  const handleScoreChange = async (category: keyof UnifiedCase, score: number) => {
    await onUpdate(item.id, { [category]: score });
  };

  const ScoringInput = ({ label, field, value }: { label: string, field: keyof UnifiedCase, value: number }) => (
    <div className="mb-5 group/score">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[9px] font-bold text-grey-400 tracking-widest uppercase group-hover/score:text-indigo transition-colors">{label}</span>
        <span className="text-[10px] font-mono font-bold text-indigo">{value || 0}/5</span>
      </div>
      <div className="flex gap-2.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            disabled={!isAdmin}
            onClick={() => handleScoreChange(field, i)}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              i <= (value || 0)
                ? 'bg-indigo border-indigo shadow-inner scale-110'
                : 'bg-white border-grey-100 hover:border-indigo/30'
            } ${isAdmin ? 'cursor-pointer hover:scale-125' : 'cursor-default opacity-80'}`}
          />
        ))}
      </div>
    </div>
  );

  const DetailSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-grey-100">
        <div className="p-2 bg-indigo-lt text-indigo rounded shadow-tiny">
          <Icon size={18} />
        </div>
        <h4 className="text-sm font-medium text-navy tracking-widest">{title}</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );

  const DetailItem = ({ label, value, fullWidth }: { label: string, value: string | number | boolean | undefined, fullWidth?: boolean }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div className={`p-4 bg-grey-50 rounded-inner border border-grey-100 group hover:bg-white transition-all duration-300 ${fullWidth ? 'md:col-span-2' : ''}`}>
        <p className="text-[10px] font-medium text-grey-400 tracking-[0.2em] mb-1 group-hover:text-indigo transition-colors">{label}</p>
        <p className="text-sm font-medium text-navy leading-relaxed whitespace-pre-wrap">
          {typeof value === 'boolean' ? (value ? 'YES' : 'NO') : value}
        </p>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-5xl max-h-full rounded-card shadow-2xl relative z-10 flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-grey-100 flex items-start justify-between bg-white sticky top-0 z-10">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Badge color={item.case_type === CaseType.AI ? 'gold' : item.case_type === CaseType.HYBRID ? 'indigo' : 'sage'}>
                    {item.case_type} :: {item.tier}
                  </Badge>
                  <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-${getStatusColor(item.status, item.decision)}`}>
                    <div className={`w-2 h-2 rounded-pill bg-current animate-pulse`} />
                    {item.decision ? item.decision.replace(/_/g, ' ') : item.status}
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-navy tracking-tighter leading-tight uppercase">
                  {item.project_title}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-grey-100 rounded-pill transition-standard group mt-[-10px] mr-[-10px]"
              >
                <X size={24} className="text-grey-300 group-hover:text-navy" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-cream/5 font-sans">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="md:col-span-2 space-y-8">
                  <DetailSection title="The Initiative" icon={Target}>
                    <DetailItem label="Problem Statement" value={item.problem_statement} fullWidth />
                    <DetailItem label="Expected Outcome" value={item.expected_outcome} fullWidth />
                    {item.initiative_description && <DetailItem label="Initiative Description" value={item.initiative_description} fullWidth />}
                    {item.support_material_link && <DetailItem label="Support Material" value={item.support_material_link} fullWidth />}
                    {item.additional_context && <DetailItem label="Additional Context" value={item.additional_context} fullWidth />}
                  </DetailSection>

                  <DetailSection title="Strategic Alignment" icon={TrendingUp}>
                    {item.strategic_driver && <DetailItem label="Strategic Driver" value={item.strategic_driver} />}
                    <DetailItem label="Markets Affected" value={item.markets_affected} />
                    <DetailItem label="Impacted Dept." value={item.requestor_department} />
                    <DetailItem label="Requestor" value={item.requestor_name} />
                  </DetailSection>

                  {isAI && (
                    <DetailSection title="AI Governance" icon={Bot}>
                      <DetailItem label="AI Tool" value={item.ai_tool} />
                      <DetailItem label="Model Name" value={item.ai_model_name} />
                      <DetailItem label="Intended Purpose" value={item.intended_purpose} />
                      <DetailItem label="Users Scope" value={item.users_scope} />
                      <DetailItem label="Data Types" value={item.data_types} />
                      <DetailItem label="System Integrations" value={item.system_integrations} />
                      <DetailItem label="Human in Loop" value={item.human_in_loop} />
                      <DetailItem label="Regulated Process" value={item.regulated_process} />
                      <DetailItem label="External Data" value={item.ai_is_external_data} />
                      <DetailItem label="Data Subjects" value={item.ai_data_subjects} />
                      <DetailItem label="Expected Benefits" value={item.expected_benefits} fullWidth />
                    </DetailSection>
                  )}

                  {!isAI && (
                    <DetailSection title="Execution & ROI" icon={BarChart3}>
                      <DetailItem label="Est. Annual Benefit" value={item.annual_fte_cost ? formatCurrency(item.annual_fte_cost) : undefined} />
                      <DetailItem label="Est. Implementation Cost" value={item.impl_cost ? formatCurrency(item.impl_cost) : undefined} />
                      <DetailItem label="FTE Savings Est." value={item.fte_saving_est ? `${item.fte_saving_est} FTE` : undefined} />
                      <DetailItem label="Payback Period" value={item.payback_months ? `${item.payback_months} Months` : undefined} />
                      <DetailItem label="Teams Involved" value={item.teams_involved} />
                      <DetailItem label="Duration" value={item.duration} />
                      <DetailItem label="Monthly Volume" value={item.volume_per_month} />
                      <DetailItem label="Hours per Case" value={item.hours_per_case} />
                      <DetailItem label="Seniority" value={item.team_profile} />
                    </DetailSection>
                  )}
                  
                  {isAdmin && item.assessment_notes && (
                    <DetailSection title="Assessment Records" icon={FileText}>
                      <DetailItem label="Analyst Notes" value={item.assessment_notes} fullWidth />
                    </DetailSection>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Decision Hub (Admin Only and correct context) */}
                  {isAdmin && isAnalysisView && (
                    <div className="bg-navy p-8 rounded-card text-white relative overflow-hidden group shadow-xl">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-pill -mr-16 -mt-16" />
                      <p className="text-[10px] font-medium text-white/30 mb-6 uppercase tracking-widest">Decision Hub</p>
                      
                      <div className="space-y-4">
                        {item.status !== ProjectStatus.ACCEPTED && item.status !== ProjectStatus.REJECTED && (
                          <div className="grid grid-cols-1 gap-2 mb-6">
                            <button 
                              onClick={() => handleDecision(ProjectStatus.REVIEW)}
                              className="w-full py-3 bg-indigo text-white text-[10px] font-bold rounded-pill shadow-lg hover:bg-indigo-lt transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                              <Activity size={14} /> Move to Review
                            </button>
                            <button 
                              onClick={() => handleDecision(ProjectStatus.ACCEPTED)}
                              className="w-full py-3 bg-success text-white text-[10px] font-bold rounded-pill shadow-lg hover:bg-success-lt hover:text-success transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 size={14} /> Issue Go Verdict
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button 
                                onClick={() => handleDecision(ProjectStatus.REJECTED)}
                                className="py-2.5 bg-danger text-white text-[9px] font-bold rounded-pill shadow-md hover:bg-danger-lt transition-all uppercase tracking-widest"
                              >
                                Reject Node
                              </button>
                              <button 
                                onClick={() => handleDecision(ProjectStatus.NEEDS_INFO)}
                                className="py-2.5 bg-gold text-navy text-[9px] font-bold rounded-pill shadow-md hover:bg-gold-lt transition-all uppercase tracking-widest"
                              >
                                Needs Info
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center bg-white/5 p-3 rounded border border-white/10">
                          <span className="text-[9px] font-medium text-white/50 tracking-widest">Magnitude</span>
                          <span className="text-xl font-medium tabular-nums">{item.tshirt}</span>
                        </div>
                        
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded border border-white/10">
                          <span className="text-[9px] font-medium text-white/50 tracking-widest">Pipeline Node</span>
                          <span className="text-[10px] font-medium tracking-widest text-indigo-lt uppercase">{item.status}</span>
                        </div>

                        {(item.decision || item.status === ProjectStatus.ACCEPTED || item.status === ProjectStatus.REJECTED) && (
                          <div className="flex justify-between items-center bg-white/10 p-4 rounded-inner border border-white/20 shadow-inner">
                            <span className="text-[9px] font-medium text-white/50 tracking-widest uppercase">Verdict</span>
                            <span className={`text-lg font-bold uppercase ${getStatusColor(item.status, item.decision) === 'success' ? 'text-success' : 'text-danger'}`}>
                              {item.status.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      {item.decided_at && (
                        <p className="mt-6 text-[8px] font-medium text-white/20 tracking-widest text-center">Node finalized on {new Date(item.decided_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}

                  {/* Reasons Display (Always show if relevant) */}
                  {(item.rejection_reason || item.needs_info_details) && (
                    <div className="bg-white border border-grey-100 p-6 rounded-card shadow-sm border-l-4 border-l-danger">
                       <h4 className="text-[10px] font-bold text-navy mb-4 flex items-center gap-2 uppercase tracking-widest">
                         <AlertTriangle size={14} className="text-danger" /> Decision Notes
                       </h4>
                       <p className="text-sm font-medium text-navy leading-relaxed">
                         {item.status === ProjectStatus.REJECTED ? item.rejection_reason : item.needs_info_details}
                       </p>
                    </div>
                  )}

                  {/* Enhanced Scoring Layer (Admin Only) */}
                  {isAdmin && isAnalysisView && (
                    <div className="bg-white border border-grey-100 p-8 rounded-card shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo/5 rounded-pill -mr-12 -mt-12" />
                      <h4 className="text-[10px] font-bold text-navy mb-8 flex items-center gap-2 uppercase tracking-widest">
                         <Activity size={14} className="text-indigo" /> Transformation Score
                      </h4>
                      
                      <div className="space-y-2">
                        <ScoringInput label="Problem clarity & specificity" field="score_problem" value={item.score_problem} />
                        <ScoringInput label="Benefit quantification quality" field="score_benefit" value={item.score_benefit} />
                        <ScoringInput label="Strategic alignment" field="score_strategic" value={item.score_strategic} />
                        <ScoringInput label="Feasibility & resource availability" field="score_feasibility" value={item.score_feasibility} />
                        <ScoringInput label="Urgency / business risk if not done" field="score_urgency" value={item.score_urgency} />
                        <ScoringInput label="Data quality & baseline completeness" field="score_data" value={item.score_data} />
                      </div>

                      <div className="mt-8 pt-6 border-t border-grey-50">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[9px] font-bold text-grey-400 tracking-widest uppercase">Composite Index</span>
                          <div className="flex items-center gap-3">
                             <span className="text-2xl font-bold text-navy tabular-nums">{(getOverallScore(item) || 0).toFixed(1)}</span>
                             <ScoringSpheres score={getOverallScore(item) || 0} />
                          </div>
                        </div>
                        
                        <div className={`p-4 rounded-inner border bg-grey-50 flex flex-col items-center justify-center text-center`}>
                          <p className="text-[8px] font-bold text-grey-400 uppercase tracking-widest mb-1.5">Suggested Outcome</p>
                          <Badge color={getSuggestedOutcome(getOverallScore(item)).color}>
                            {getSuggestedOutcome(getOverallScore(item)).text}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-grey-50 p-6 rounded-card border border-grey-100 overflow-hidden">
                    <div className="flex items-center gap-2 mb-4">
                       <Clock size={14} className="text-indigo" />
                       <span className="text-[10px] font-medium text-navy">Timeline Details</span>
                    </div>
                    <div className="space-y-3">
                       <div>
                          <p className="text-[8px] font-medium text-grey-300">Entry Date</p>
                          <p className="text-[10px] font-medium text-navy">{new Date(item.created_at).toLocaleString()}</p>
                       </div>
                       {item.deadline && (
                         <div>
                            <p className="text-[8px] font-medium text-grey-300">Intended Deadline</p>
                            <p className="text-[10px] font-medium text-navy">{item.deadline}</p>
                         </div>
                       )}
                       {item.next_review_date && (
                         <div className="pt-2">
                            <p className="text-[8px] font-medium text-indigo">Next Scheduled Review</p>
                            <p className="text-[10px] font-medium text-indigo tabular-nums">{item.next_review_date}</p>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
            <div className="p-6 bg-grey-50 border-t border-grey-100 flex justify-end">
              <button 
                onClick={onClose}
                className="px-10 py-4 bg-navy text-white rounded-btn text-[10px] font-medium tracking-[0.3em] shadow-md-kaizen hover:bg-indigo transition-standard"
              >
                Close Viewport
              </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- TAB 1: INTAKE WIZARD ---

const ChatDisclaimer = () => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/80 backdrop-blur-sm p-6 rounded-card border border-indigo/20 shadow-sm-kaizen mb-8"
  >
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-gold-lt rounded-inner flex items-center justify-center shrink-0 border border-gold/10 shadow-tiny">
          <Rocket className="text-gold-dk" size={20} />
        </div>
        <div>
          <h4 className="font-bold text-sm text-navy mb-1">
            🚀 AI Initiatives: Build Something New
          </h4>
          <p className="text-[11px] text-grey-500 leading-relaxed font-medium">
            Choose this if your goal is to develop a new application using our internal AI tools. If you are starting a fresh project to automate a task or launch a new AI-driven service, this is the right spot.
          </p>
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-indigo-lt rounded-inner flex items-center justify-center shrink-0 border border-indigo/10 shadow-tiny">
          <Zap className="text-indigo" size={20} />
        </div>
        <div>
          <h4 className="font-bold text-sm text-navy mb-1">
            ⚙️ Optimization: Improve the Current
          </h4>
          <p className="text-[11px] text-grey-500 leading-relaxed font-medium">
            Choose this for refining or streamlining existing workflows. Whether it’s a business process or a technical system, if your goal is to make things run more smoothly or efficiently, select this category.
          </p>
        </div>
      </div>
    </div>
  </motion.div>
);

function IntakeWizard({ user, onCaseSubmit }: { user: any, onCaseSubmit: (c: UnifiedCase) => void }) {
  const [history, setHistory] = useState<Message[]>([
    { role: 'assistant', content: `Hello ${user?.displayName?.split(' ')[0] || ''}! I'm ZHDUN, your Transformation Catalyst. To get started, please select the type of initiative you'd like to intake.` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [completedCase, setCompletedCase] = useState<Partial<UnifiedCase> | null>(null);
  const [submittedCase, setSubmittedCase] = useState<UnifiedCase | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [caseSummary, setCaseSummary] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [candidateData, setCandidateData] = useState<Partial<UnifiedCase>>({});
  const [currentChoices, setCurrentChoices] = useState<{type:'single'|'multi', field:string, options:string[]} | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const WIZARD_PROMPT = `
You are ZHDUN, the strategic intake specialist for Kaizen Gaming's Transformation team.
Your job: conduct a warm, precise conversational interview to intake a new initiative.
Speak naturally. Never use bullet lists. One question at a time. Max 2-3 short sentences per message.

─── CORE BEHAVIOR (CRITICAL) ───
- BRANCHING LOGIC: You MUST branch the interview immediately based on the user's first choice: "AI initiative" vs "Optimization Project".
- STICK TO THE PATH: Once the classification is determined, follow ONLY the corresponding checklist. Never mix questions from both paths.
- DATA INTEGRITY: You MUST capture accurate and complete information. If a user provides vague, incorrect, or incomplete data, or refuses to provide information, you MUST insist politely and explain why that data is critical.
- GUIDANCE: If a user isn't sure what to write, offer help or examples based on common Kaizen patterns (e.g., automation of manual reporting, LLM-based customer support, process streamlining).
- SAVING CALCULATION: For "Optimization Project", you are STRICTLY FORBIDDEN from calculating or displaying savings until you have THREE pieces of data: volume_per_month, hours_per_case, AND team_profile. Once (and only once) all three are captured, output the signal CALCULATION:{"annual_hours":X, "fte_saving":Y, "annual_savings":Z} followed by a natural language message asking for validation.
- VALIDATION DELAY: You are STRICTLY FORBIDDEN from sending CASE_COMPLETE in the same message as the saving calculation. Wait for confirmation first.

─── CLASSIFICATION (SILENT) ───
On the first message, set the intake path:
- PROJECT: If "Optimization Project" is selected.
- AI: If "AI initiative" is selected.
- If "Not Sure" is selected, you MUST explain the difference and ask for a choice:
    - AI Initiative: Internal AI-powered applications/tools/models.
    - Optimization Project: Process improvement/automation owned by the Transformation team.

Never mention T1/T2/T3 to the user.

─── TIER SCORING (SILENT, ALL CASES) ───
Maintain a running tier_score (0–20).
Add points:
+4 if external/3rd-party tech/LLM
+4 if cross-departmental impact
+3 if Enterprise Use (Tier 3)
+2 if Department Use (Tier 2)
+1 if Personal Use (Tier 1)
+3 if >€100k projected investment/savings
+3 if PII data involved
+3 if financial/regulated data involved
+2 if integrated with production systems
+2 if used in regulated process (AML, KYC, responsibility)
+1 if >100 users in scope

Tier mapping: 0-7 = T3, 8-14 = T2, 15-20 = T1.
CRITICAL: If tier_score >= 8, capture expected_benefits before closing.

─── FIELD CHECKLIST (STRICT BRANCHING) ───

IF PATH IS "PROJECT" (Optimization Project):
1. project_title
2. requestor_department
3. markets_affected (CHOICES)
4. problem_statement
5. expected_outcome (Insist for detail)
6. volume_per_month (numeric)
7. hours_per_case (numeric)
8. team_profile (CHOICES)
9. teams_involved
10. strategic_driver (CHOICES)
11. deadline
12. support_material_link (ask at very end)

IF PATH IS "AI" (AI initiative):
1. ai_intent (CHOICES: "What are you looking to do?")
2. initiative_title (maps to project_title)
3. requestor_department
4. initiative_description
5. expected_outcome (Insist for detail)
6. intended_purpose (CHOICES)
7. users_scope (CHOICES)
8. markets_affected (CHOICES)
9. data_types (CHOICES)
10. ai_tool (CHOICES)
11. system_integrations
12. support_material_link (ask at end)
13. additional_context (ask at end: "Anything else to add?")
14. expected_benefits (ONLY if tier_score >= 8, CHOICES)

─── SUPPORT MATERIAL (CRITICAL) ───
Before closing, always ask: "Is there any support material available that supports the case? Please share the link in the chat." (field: support_material_link)

─── OTHER SELECTION ───
If "Other" is selected for purpose/benefits, ask for a description.

─── STRATEGIC DRIVER (PROJECT ONLY) ───
Focus only on alignment when asking.

─── COMPUTED FIELDS (PROJECT ONLY) ───
annual_hours = volume_per_month × hours_per_case × 12
annual_fte_cost = annual_hours × hourly_rate (based on seniority table below)
fte_saving_est = annual_hours / 1720

Seniority (Hourly Rate) table:
- Junior: €25
- Middle: €40
- Senior: €65
- Lead / Manager: €90
- Mixed: €55

Mapping for CALCULATION signal:
"annual_savings" in CALCULATION signal refers to the computed annual_fte_cost.

Strategic driver mapping:
"Hey Betano" = AI Transformation
"Shield Betano" = Risk & Governance  
"Betano Republic" = Market Expansion
"Core Betano" = Operational Excellence

─── CHOICES SIGNAL ───
Format: CHOICES:{"type":"single"|"multi","field":"fieldname","options":["Option1","Option2"...]}

Option lists:
- initial_classification: ["AI initiative","Optimization Project","Not sure"]
- markets_affected: ["Malta","Bulgaria","Romania","Czech Republic","United Kingdom","Germany","Denmark","Brazil","Mexico","Argentina","HQ","All Markets"]
- strategic_driver: ["Hey Betano","Shield Betano","Betano Republic","Core Betano"]
- data_types: ["Personal / PII","Financial Data","Customer Data","No Sensitive Data"]
- ai_tool: ["Claude (Anthropic)","Gemini","Google AI Studio","Not Sure"]
- users_scope: ["Personal Use","Department Use","Enterprise Use"]
- team_profile: ["Junior","Middle","Senior","Lead / Manager","Mixed"]
- expected_benefits: ["Cost Savings","Efficiency Gain","User Experience","Risk Mitigation","Compliance Accuracy","Other"]
- ai_intent: ["Use & learn an AI tool", "Build or automate something"]
- intended_purpose: ["Content Generation","Decision Support","Data Analysis","Process Automation","Customer Service / Chatbot","Risk & Compliance","Other"]

─── SIGNALS ───
Always append STATE:{<partial fields>} to every message.
When done, append CASE_COMPLETE:{<full JSON>} and ask to review.

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
  "teams_involved": "",
  "strategic_driver": "",
  "deadline": "",
  "annual_fte_cost": 0,
  "annual_hours": 0,
  "fte_saving_est": 0,
  "tier": "T1|T2|T3",
  "tshirt": "S|M|L|XL",
  "flags": [],
  "support_material_link": ""
}

CASE_COMPLETE JSON for AI:
{
  "project_title": "",
  "case_type": "ai",
  "ai_intent": "",
  "requestor_department": "",
  "initiative_description": "",
  "expected_outcome": "",
  "intended_purpose": "",
  "users_scope": "",
  "markets_affected": "",
  "data_types": "",
  "ai_tool": "",
  "system_integrations": "",
  "additional_context": "",
  "expected_benefits": "",
  "tier": "T1|T2|T3",
  "tier_score": 0,
  "flags": [],
  "tshirt": "S",
  "support_material_link": ""
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

  const [isResetting, setIsResetting] = useState(false);

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 600);
    setIsTyping(false);
    setHistory([
      { role: 'assistant', content: `Hello ${user?.displayName?.split(' ')[0] || ''}! I'm ZHDUN, your Transformation Catalyst. To get started, please select the type of initiative you'd like to intake.` }
    ]);
    setCandidateData({});
    setCompletedCase(null);
    setSubmittedCase(null);
    setCaseSummary('');
    setIsGeneratingSummary(false);
    setCurrentChoices({
      type: 'single',
      field: 'initial_classification',
      options: ['AI initiative', 'Optimization Project', 'Not sure']
    });
    setInput('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

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

      // Extract calculation signal if present
      let calculationData = undefined;
      const calcMatch = response.match(/CALCULATION:\s*(\{[\s\S]*?\})/);
      if (calcMatch) {
        try {
          const rawCalc = JSON.parse(calcMatch[1]);
          calculationData = {
            annualHours: rawCalc.annual_hours?.toString() || '',
            fteSaving: rawCalc.fte_saving?.toString() || '',
            annualSavings: rawCalc.annual_savings?.toString() || ''
          };
        } catch (e) {
          console.error("Calc parse err", e);
        }
      }

      // Clean the response for display - removing all operational signals and raw JSON blocks
      let cleanResponse = response
        .replace(/CASE_COMPLETE:\s*\{[\s\S]*?\}/g, '')
        .replace(/STATE:\s*\{[\s\S]*?\}/g, '')
        .replace(/CHOICES:\s*\{[\s\S]*?\}/g, '')
        .replace(/CALCULATION:\s*\{[\s\S]*?\}/g, '')
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/```[\s\S]*?```/g, '')
        // Catch any stray JSON-like blocks at the end or middle
        .replace(/\{[\s\S]*?\}/g, '')
        .trim();

      // If cleaning left it empty but we have data, use a default transition
      if (!cleanResponse && completeMatch) {
         cleanResponse = "Perfect. I've compiled the initiative node. Please review the orchestration block below.";
      }

      setHistory(prev => [...prev, { 
        role: 'assistant', 
        content: cleanResponse || "Signal received. Proceeding.",
        calculationData 
      }]);
    } catch (err) {
      setHistory(prev => [...prev, { role: 'assistant', content: "Connection severed. Node unstable." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => handleSendValue(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const submitToPipeline = async () => {
    if (!completedCase) return;

    setIsGeneratingSummary(true);
    try {
      const summaryPrompt = `Generate a punchy, professional one-liner summary (max 15 words) for this initiative: 
      Title: ${completedCase.project_title}
      Description: ${completedCase.case_type === CaseType.AI ? completedCase.initiative_description : completedCase.problem_statement}
      Expected Outcome: ${completedCase.expected_outcome}`;
      
      const summary = await callGeminiOnce(summaryPrompt);
      setCaseSummary(summary);

      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);

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

      await onCaseSubmit(finalCase);
      setSubmittedCase(finalCase);
      setHistory(prev => [...prev, { role: 'assistant', content: "Transmission confirmed. Your initiative is now in the pipeline." }]);
      setCompletedCase(null);
      setCandidateData({});
    } catch (err) {
      console.error("Summary generation or submission failed:", err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const PHASES = [
    { name: 'Identity', fields: ['project_title', 'requestor_department'] },
    { name: 'Core Vision', fields: ['problem_statement', 'expected_outcome'] },
    { name: 'Metric Baseline', fields: ['annual_fte_cost'] },
    { name: 'Strategic Fit', fields: ['strategic_driver'] },
    { name: 'Attachments', fields: ['support_material_link'] },
    { name: 'Review', fields: ['case_type'] }
  ];

  const getPhaseStatus = (phaseIdx: number) => {
    const phase = PHASES[phaseIdx];
    const completedCount = phase.fields.filter(f => candidateData[f as keyof UnifiedCase]).length;
    if (completedCount === phase.fields.length) return 'completed';
    if (phaseIdx === 0 || (PHASES[phaseIdx-1]?.fields.every(f => candidateData[f as keyof UnifiedCase]))) return 'active';
    return 'pending';
  };

  const progressPercent = (() => {
    const isAI = candidateData.case_type === CaseType.AI;
    const projectFields = ['project_title', 'requestor_department', 'markets_affected', 'problem_statement', 'expected_outcome', 'volume_per_month', 'hours_per_case', 'team_profile', 'teams_involved', 'strategic_driver', 'deadline', 'support_material_link'];
    const aiFields = ['project_title', 'ai_intent', 'requestor_department', 'initiative_description', 'expected_outcome', 'intended_purpose', 'users_scope', 'markets_affected', 'data_types', 'ai_tool', 'system_integrations', 'support_material_link', 'additional_context'];
    
    const targetFields = isAI ? aiFields : projectFields;
    const answeredCount = targetFields.filter(f => {
      const val = candidateData[f as keyof UnifiedCase];
      return val !== undefined && val !== null && val !== '' && val !== 0;
    }).length;
    
    if (answeredCount === 0) return 0;
    return Math.min(100, Math.max(5, Math.round((answeredCount / targetFields.length) * 100)));
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans h-full overflow-hidden">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col gap-4 h-full overflow-hidden">
        <div className="bg-white rounded-card border border-grey-100 p-6 shadow-sm-kaizen flex-1 flex flex-col overflow-hidden">
          <h3 className="font-bold text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-navy">
            <Activity className="text-indigo" size={14} /> Intake Rhythm
          </h3>
          <h4 className="text-[9px] font-medium text-grey-400 mb-4">Captured Nodes</h4>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
            {Object.entries(candidateData).filter(([_,v]) => v).map(([k,v]) => (
              <div key={k} className="p-3 bg-grey-50 border border-grey-100 rounded-inner flex items-center justify-between group hover:bg-white transition-standard">
                <span className="text-[9px] font-medium text-grey-400 tracking-tight truncate mr-2">{k.replace(/_/g, ' ')}</span>
                <CheckCircle2 size={12} className="text-indigo shrink-0" />
              </div>
            ))}
            {Object.keys(candidateData).length === 0 && <p className="text-[10px] text-grey-300">Awakening ZHDUN...</p>}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="lg:col-span-3 flex flex-col bg-white rounded-card border border-grey-100 shadow-sm-kaizen overflow-hidden relative">
        <div className="p-5 border-b border-grey-100 flex flex-col gap-4 bg-white/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center shadow-md overflow-hidden bg-white rounded-inner ring-1 ring-grey-100 p-1.5">
                <img src="/logo.png" alt="Z" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="font-medium text-sm tracking-tight">Zhdun Interview</h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleReset();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-pill bg-grey-50 text-grey-400 hover:bg-danger/10 hover:text-danger border border-grey-100 transition-standard text-[10px] font-medium tracking-tight shadow-sm cursor-pointer"
              >
                <RefreshCw size={12} className={isResetting ? "animate-spin-once" : ""} />
                <span>Start from the beginning</span>
              </motion.button>
              <div className="text-right hidden sm:block">
                <p className="text-[9px] font-medium text-indigo tracking-widest tabular-nums">{progressPercent}% Orchestrated</p>
              </div>
            </div>
          </div>
          
          <div className="w-full bg-grey-50 h-1.5 rounded-pill overflow-hidden border border-grey-100">
            <motion.div 
              className="bg-indigo h-full shadow-sm" 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-cream/20">
          <ChatDisclaimer />
          {history.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-pill shrink-0 flex items-center justify-center text-white font-medium text-[10px] shadow-sm ${msg.role === 'user' ? 'bg-navy' : ''}`}>
                  {msg.role === 'user' ? 'U' : <img src="/logo.png" alt="Z" className="w-6 h-6 object-contain" />}
                </div>
                <div className={`p-4 rounded-card text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-navy text-white rounded-tr-none' : 'bg-white text-navy border border-grey-100 rounded-tl-none font-medium'}`}>
                  {msg.calculationData ? (
                    <div className="space-y-5">
                      <p className="pb-2 border-b border-grey-100 font-medium text-navy/80">{msg.content}</p>
                      
                      {/* Polished Calculation Card */}
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group overflow-hidden"
                      >
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo via-indigo-lt to-success rounded-[20px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                        <div className="relative bg-white p-6 rounded-card border border-indigo/10 shadow-lg-kaizen space-y-4">
                          <div className="flex justify-between items-center pb-3 border-b border-grey-50">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-indigo-lt rounded-inner flex items-center justify-center text-indigo">
                                <Activity size={18} className="animate-pulse" />
                              </div>
                              <span className="text-[10px] font-bold text-navy uppercase tracking-[0.2em]">Savings Forecast</span>
                            </div>
                            <Badge color="indigo">Validated Estimate</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-grey-50 rounded-inner border border-grey-100 transition-all duration-300 hover:bg-white hover:border-indigo/20 hover:shadow-tiny">
                              <p className="text-[9px] font-bold text-grey-400 uppercase tracking-widest mb-1.5">Annual effort</p>
                              <div className="flex items-center gap-2">
                                <Clock size={14} className="text-indigo" />
                                <span className="font-mono font-bold text-navy text-lg tabular-nums">
                                  {msg.calculationData.annualHours} <span className="text-[10px] opacity-40 font-sans tracking-tight">hrs</span>
                                </span>
                              </div>
                            </div>
                            <div className="p-4 bg-grey-50 rounded-inner border border-grey-100 transition-all duration-300 hover:bg-white hover:border-indigo/20 hover:shadow-tiny">
                              <p className="text-[9px] font-bold text-grey-400 uppercase tracking-widest mb-1.5">FTE Equiv.</p>
                              <div className="flex items-center gap-2">
                                <Layers size={14} className="text-indigo" />
                                <span className="font-mono font-bold text-navy text-lg tabular-nums">
                                  {msg.calculationData.fteSaving} <span className="text-[10px] opacity-40 font-sans tracking-tight">FTE</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-6 mt-2 border-t-2 border-dashed border-grey-100 relative group/total">
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-[9px] font-bold text-grey-400 uppercase tracking-[0.2em] mb-2 font-black">Projected Annual Savings</p>
                                <motion.div
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className="flex items-baseline gap-2"
                                >
                                  <span className="text-4xl font-bold tracking-tighter text-navy tabular-nums">
                                    {formatCurrency(msg.calculationData.annualSavings)}
                                  </span>
                                  <span className="text-[10px] font-bold text-success uppercase tracking-widest">/ year</span>
                                </motion.div>
                              </div>
                              <div className="text-right">
                                <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-success text-white rounded-pill shadow-lg border border-success/10 text-[10px] font-bold tracking-widest">
                                  <TrendingUp size={14} /> HIGH IMPACT
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Interactive Buttons for Validation */}
                      {idx === history.length - 1 && !isTyping && !completedCase && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="bg-white/50 backdrop-blur-sm p-6 rounded-card border border-white shadow-xl-kaizen space-y-6"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-indigo text-white rounded-inner flex items-center justify-center shrink-0 shadow-lg ring-4 ring-indigo-lt">
                              <Target size={20} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-navy">Verify Optimization Node</h4>
                              <p className="text-xs text-grey-500 font-medium leading-relaxed">
                                Does this calculation accurately represent the transformation potential?
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <motion.button
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleSendValue("Yes, it's correct. Proceed with this logic.")}
                              className="bg-navy text-white py-4 px-6 rounded-btn text-[10px] font-bold uppercase tracking-[0.3em] shadow-xl hover:bg-indigo transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                              <CheckCircle2 size={18} className="text-success group-hover:scale-125 transition-transform relative z-10" /> 
                              <span className="relative z-10">Seems correct</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleSendValue("I need to adjust figures, can we review the volume or hours?")}
                              className="bg-white border-2 border-grey-100 text-grey-400 py-4 px-6 rounded-btn text-[10px] font-bold uppercase tracking-[0.3em] shadow-sm hover:border-indigo hover:text-indigo transition-all flex items-center justify-center gap-3 group"
                            >
                              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                              <span>Adjust baseline</span>
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : msg.content}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] flex gap-4">
                <div className="w-8 h-8 rounded-pill bg-white shrink-0 flex items-center justify-center text-white font-medium text-[10px] shadow-sm">
                  <img src="/logo.png" alt="Z" className="w-6 h-6 object-contain" />
                </div>
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

          {submittedCase && (
            <motion.div 
              initial={{ opacity: 0, y: 30, rotateX: 20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              className="bg-navy border-4 border-white/10 rounded-card p-10 shadow-2xl relative overflow-hidden text-white"
              style={{ perspective: '1000px' }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo/10 rounded-pill -mr-32 -mt-32 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-lt/5 rounded-pill -ml-24 -mb-24 blur-2xl" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-[10px] font-medium text-white/60 mb-2 uppercase tracking-widest">Initiative Passport</h3>
                    <h2 className="text-4xl font-medium tracking-tighter leading-none text-white">{submittedCase.project_title}</h2>
                  </div>
                  <div className="w-16 h-16 bg-white/10 rounded-inner flex items-center justify-center border border-white/20">
                    <Rocket className="text-indigo" size={32} />
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-inner p-6 mb-8 border border-white/20">
                  <p className="text-[9px] font-medium text-white/70 tracking-widest mb-3 flex items-center gap-2 uppercase">
                    <Bot size={12} className="text-indigo" /> AI Strategy Insight
                  </p>
                  <p className="text-xl font-medium leading-relaxed text-white">
                    "{caseSummary || 'Orchestrating transformation via intelligent automation.'}"
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-10 pb-8 border-b border-white/20">
                  <div>
                    <p className="text-[8px] font-medium text-white/60 mb-1 uppercase tracking-widest">Impact Radius</p>
                    <p className="text-xs font-medium font-mono tracking-tight text-white">{submittedCase.markets_affected}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-medium text-white/60 mb-1 uppercase tracking-widest">Projected ROI</p>
                    <p className="text-xs font-medium font-mono text-success-lt font-bold text-base">{submittedCase.case_type === CaseType.AI ? 'High Strategic' : formatCurrency(submittedCase.annual_fte_cost || 0)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-medium text-white/60 mb-1 uppercase tracking-widest">Status</p>
                    <p className="text-xs font-medium tracking-widest text-gold animate-pulse font-bold">IN PIPELINE</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSubmittedCase(null)}
                  className="w-full py-4 border border-white/10 text-white rounded-btn font-bold text-[10px] uppercase tracking-[0.4em] hover:bg-white hover:text-navy transition-all duration-500"
                >
                  Return to Hub
                </button>
              </div>
              
              <div className="absolute top-0 right-10 bottom-0 w-px bg-white/5" />
              <div className="absolute left-0 bottom-10 right-0 h-px bg-white/5" />
            </motion.div>
          )}

          {completedCase && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-indigo/20 rounded-card p-10 shadow-lg-kaizen"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-success-lt text-success rounded-inner shadow-sm flex items-center justify-center">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="font-medium text-navy text-2xl tracking-tighter leading-none">Review Initiative Node</h3>
                  <p className="text-[10px] font-medium text-indigo tracking-[0.3em] mt-1.5 tabular-nums">Classification: {completedCase.case_type} Protocol</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                  { label: 'Title', val: completedCase.project_title },
                  { label: 'Dept', val: completedCase.requestor_department },
                  { label: 'AI Intent', val: completedCase.ai_intent },
                  { label: 'Impact / yr', val: completedCase.case_type === CaseType.AI ? (completedCase.tier_score ? `Score: ${completedCase.tier_score}` : 'Strategic') : formatCurrency(completedCase.annual_fte_cost || 0) },
                  { label: 'Bet', val: completedCase.case_type !== CaseType.AI ? completedCase.strategic_driver : undefined },
                  { label: 'Deadline', val: completedCase.deadline },
                  { label: 'Magnitude', val: `${TIER_NAMES[completedCase.tier as string] || completedCase.tier} / ${completedCase.tshirt}` },
                  { label: 'Markets', val: completedCase.markets_affected },
                  { label: 'Outcome', val: completedCase.expected_outcome, full: true },
                  { label: 'Problem / Description', val: completedCase.case_type === CaseType.AI ? completedCase.initiative_description : completedCase.problem_statement, full: true },
                  { label: 'Benefits', val: completedCase.expected_benefits, full: true },
                  { label: 'Vol/Mo', val: completedCase.volume_per_month },
                  { label: 'Hr/Case', val: completedCase.hours_per_case },
                  { label: 'Seniority', val: completedCase.team_profile },
                  { label: 'Teams Involved', val: completedCase.teams_involved },
                  { label: 'AI Tool', val: completedCase.ai_tool },
                  { label: 'Model', val: completedCase.ai_model_name },
                  { label: 'Purpose', val: completedCase.intended_purpose },
                  { label: 'Users Scope', val: completedCase.users_scope },
                  { label: 'Data Type', val: completedCase.data_types },
                  { label: 'Integrations', val: completedCase.system_integrations },
                  { label: 'Human-in-Loop', val: completedCase.human_in_loop },
                  { label: 'Regulated', val: completedCase.regulated_process },
                  { label: 'Support Material', val: completedCase.support_material_link, full: true },
                  { label: 'Context', val: completedCase.additional_context, full: true },
                ].filter(i => i.val).map((i, idx) => (
                  <div key={idx} className={`bg-grey-50 p-5 rounded-inner border border-grey-100 ring-1 ring-white/50 group hover:bg-white transition-all duration-300 ${i.full ? 'md:col-span-2 lg:col-span-2' : ''}`}>
                    <p className="text-[8px] font-medium text-grey-400 mb-2 group-hover:text-indigo uppercase tracking-widest transition-colors">{i.label}</p>
                    <p className={`text-[11px] font-medium text-navy leading-snug ${i.full ? '' : 'truncate'}`}>{i.val || '---'}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                <button 
                  onClick={submitToPipeline}
                  disabled={isGeneratingSummary}
                  className="flex-1 bg-navy hover:bg-indigo text-white py-5 rounded-btn font-medium text-[10px] tracking-[0.4em] transition-all duration-300 shadow-lg-kaizen group disabled:opacity-50"
                >
                  <span className="flex items-center justify-center gap-3">
                    {isGeneratingSummary ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    {isGeneratingSummary ? 'Orchestrating...' : 'Commit to Pipeline'}
                  </span>
                </button>
                <button 
                  onClick={() => setCompletedCase(null)}
                  className="px-10 py-5 border-2 border-grey-100 text-grey-400 font-bold rounded-btn hover:border-navy hover:text-navy transition-standard uppercase text-[10px] tracking-widest"
                >
                  Edit Logic
                </button>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none overflow-hidden"
            >
              {/* Backglow */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.6, scale: 1.2 }}
                exit={{ opacity: 0 }}
                className="absolute w-[600px] h-[600px] bg-indigo-lt blur-[100px] rounded-full"
              />

              <motion.div
                initial={{ 
                  scale: 0.2, 
                  x: '40vw', 
                  y: '40vh', 
                  opacity: 0,
                  rotate: 45
                }}
                animate={{ 
                  scale: 1, 
                  x: 0, 
                  y: 0, 
                  opacity: 1,
                  rotate: 0,
                  transition: { 
                    type: "spring", 
                    stiffness: 70, 
                    damping: 15,
                    duration: 1.2
                  }
                }}
                exit={{ 
                  scale: 0.8, 
                  opacity: 0,
                  y: -100,
                  transition: { duration: 0.5 }
                }}
                className="flex flex-col items-center relative"
              >
                <div className="w-80 h-80 md:w-[400px] md:h-[400px] flex items-center justify-center">
                  <img 
                    src="/logo.png" 
                    alt="Zhdun" 
                    className="w-full h-full object-contain drop-shadow-[0_35px_35px_rgba(26,29,59,0.3)]" 
                  />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="text-center"
                >
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-navy flex flex-col items-center gap-2">
                    <span className="text-indigo block">Received!</span>
                    <span className="text-2xl md:text-3xl font-medium text-grey-400 tracking-widest uppercase mt-2">Thank you</span>
                  </h2>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!completedCase && (
          <div className="p-5 bg-white border-t border-grey-100 flex items-end gap-4 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send orchestrator signal..."
              className="flex-1 bg-grey-50 border border-grey-100 rounded-btn px-6 py-4 text-sm focus:ring-4 focus:ring-indigo/5 focus:border-indigo/30 transition-standard outline-none font-sans font-medium resize-none max-h-[200px]"
            />
            <button
              onClick={handleSend}
              disabled={isTyping}
              className="bg-navy text-white w-14 h-14 flex items-center justify-center rounded-btn hover:bg-indigo transition-standard disabled:opacity-50 shadow-md group border border-navy/10 shrink-0"
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

function AssessmentPipeline({ cases, onUpdateCase, onSelectDetailedCase }: { cases: UnifiedCase[], onUpdateCase: (id: string, updates: Partial<UnifiedCase>) => void, onSelectDetailedCase: (c: UnifiedCase) => void }) {
  const columns = [
    { id: ProjectStatus.PENDING, title: 'Pending review', accent: 'gold', text: 'text-gold-dk', bg: 'bg-gold-lt' },
    { id: ProjectStatus.REVIEW, title: 'In review', accent: 'indigo', text: 'text-indigo', bg: 'bg-indigo-lt' },
    { id: ProjectStatus.NEEDS_INFO, title: 'Needs Info', accent: 'gold', text: 'text-gold-dk', bg: 'bg-gold-lt' },
    { id: ProjectStatus.ACCEPTED, title: 'Accepted', accent: 'success', text: 'text-success', bg: 'bg-success-lt' },
    { id: ProjectStatus.REJECTED, title: 'Rejected', accent: 'danger', text: 'text-danger', bg: 'bg-danger-lt' },
  ];

  const handleCardClick = (c: UnifiedCase) => {
    if (c.status === ProjectStatus.PENDING) {
      onUpdateCase(c.id, { status: ProjectStatus.REVIEW });
    }
    // Open the full modal as requested
    onSelectDetailedCase(c);
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide flex-1">
        {columns.map(col => (
          <div key={col.id} className="w-[380px] shrink-0 flex flex-col bg-grey-50/50 rounded-card border border-grey-100 overflow-hidden">
            <div className={`p-4 border-b border-grey-100 flex items-center justify-between ${col.bg}`}>
              <h3 className={`font-medium text-[11px] tracking-widest ${col.text}`}>{col.title}</h3>
              <span className={`px-2 py-0.5 rounded-pill bg-white text-[10px] font-medium ${col.text} border border-grey-100 tabular-nums`}>
                {cases.filter(c => {
                  if (col.id === ProjectStatus.ACCEPTED && c.status === ProjectStatus.DECIDED) {
                    return c.decision === ProjectDecision.GO || c.decision === AIDecision.APPROVED;
                  }
                  if (col.id === ProjectStatus.REJECTED && c.status === ProjectStatus.DECIDED) {
                    return c.decision === ProjectDecision.NOGO || c.decision === AIDecision.REJECTED;
                  }
                  return c.status === col.id;
                }).length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {cases.filter(c => {
                if (col.id === ProjectStatus.ACCEPTED && c.status === ProjectStatus.DECIDED) {
                  return c.decision === ProjectDecision.GO || c.decision === AIDecision.APPROVED;
                }
                if (col.id === ProjectStatus.REJECTED && c.status === ProjectStatus.DECIDED) {
                  return c.decision === ProjectDecision.NOGO || c.decision === AIDecision.REJECTED;
                }
                return c.status === col.id;
              }).map(c => {
                const calculatedScore = getOverallScore(c);
                return (
                <motion.div
                  key={c.id}
                  layoutId={c.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  onClick={() => handleCardClick(c)}
                  className={`bg-white rounded-inner border border-grey-100 shadow-md cursor-pointer transition-standard relative overflow-hidden flex flex-col hover:border-indigo/30 hover:shadow-lg-kaizen border-l-4 ${
                    getStatusColor(c.status, c.decision) === 'gold' ? 'border-l-gold' :
                    getStatusColor(c.status, c.decision) === 'success' ? 'border-l-success' :
                    getStatusColor(c.status, c.decision) === 'danger' ? 'border-l-danger' :
                    getStatusColor(c.status, c.decision) === 'indigo' ? 'border-l-indigo' :
                    'border-l-grey-300'
                  }`}
                >
                  {/* Header Accents */}
                  <div className="h-1.5 w-full flex">
                    <div className={`flex-1 ${c.case_type === CaseType.AI ? 'bg-gold' : c.case_type === CaseType.HYBRID ? 'bg-indigo' : 'bg-sage'}`} />
                    <div className="w-1/3 bg-navy/5" />
                  </div>

                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[9px] font-medium tracking-wider ${c.case_type === CaseType.AI ? 'text-gold-dk' : 'text-indigo'}`}>
                          {c.case_type} :: {c.tier}
                        </span>
                        <h4 className="text-sm font-medium text-navy leading-tight tracking-tight line-clamp-2">
                          {c.project_title}
                        </h4>
                      </div>
                      <div className="bg-grey-50 border border-grey-100 px-2 py-1 rounded text-[10px] font-medium text-grey-400">
                        {c.tshirt}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-grey-50">
                      <div>
                        <p className="text-[8px] font-medium text-grey-300 tracking-wider mb-1">Impact</p>
                        <p className="text-[10px] font-medium text-indigo tabular-nums">
                          {c.case_type === CaseType.AI ? 'Strategic' : formatCurrency(c.annual_fte_cost || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-medium text-grey-300 tracking-wider mb-1">Outcome</p>
                        <div className="flex items-center justify-end gap-2 text-[10px] font-bold tabular-nums">
                           <span className={`text-${getSuggestedOutcome(calculatedScore).color}`}>
                             {getSuggestedOutcome(calculatedScore).text.split(' — ')[0]}
                           </span>
                           <span className="text-navy">{(calculatedScore || 0).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-grey-50">
                      <div className="flex items-center gap-1">
                        <p className="text-[8px] font-medium text-grey-300 tracking-wider">Driver:</p>
                        <p className="text-[9px] font-medium text-navy/70 truncate max-w-[100px]">{c.strategic_driver || 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight size={11} className="text-indigo/40" />
                      </div>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- TAB 3: EXECUTIVE DASHBOARD ---

function ExecutiveDashboard({ cases }: { cases: UnifiedCase[] }) {
  const goCases = cases.filter(c => c.status === ProjectStatus.ACCEPTED || c.decision === ProjectDecision.GO || c.decision === AIDecision.APPROVED);
  const decidedCases = cases.filter(c => [ProjectStatus.DECIDED, ProjectStatus.ACCEPTED, ProjectStatus.REJECTED].includes(c.status));
  
  const totalBenefit = goCases.reduce((acc, c) => acc + (parseFloat(c.annual_fte_cost as any) || 0), 0);
  const totalImplCost = goCases.reduce((acc, c) => acc + (parseFloat(c.impl_cost as any) || 0), 0);
  const roi = totalImplCost > 0 ? ((totalBenefit / totalImplCost) * 100).toFixed(0) : '0';
  const avgPayback = goCases.length > 0 ? (goCases.reduce((acc, c) => acc + (parseFloat(c.payback_months as any) || 0), 0) / goCases.length).toFixed(1) : '0';

  const killRate = decidedCases.length > 0 ? ((cases.filter(c => c.status === ProjectStatus.REJECTED || c.decision === ProjectDecision.NOGO || c.decision === AIDecision.REJECTED).length / decidedCases.length) * 100).toFixed(0) : '0';

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
        <h3 className="font-medium text-grey-400 text-[10px] mb-6">Financial Performance</h3>
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
              <p className="text-2xl font-bold text-navy tracking-tight tabular-nums">{kpi.val}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-medium text-grey-400 text-[10px] mb-6">Portfolio Velocity</h3>
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
              <p className="text-2xl font-bold text-navy tracking-tight tabular-nums">{kpi.val}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-white border border-grey-100 p-8 rounded-card shadow-sm-kaizen">
          <h3 className="font-bold text-grey-400 text-[10px] uppercase tracking-[0.2em] mb-8">Submission Funnel</h3>
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
               <h3 className="font-bold text-indigo/50 text-[10px] uppercase tracking-[0.2em] mb-8">Node Magnitude</h3>
               <div className="grid grid-cols-2 gap-4">
                  {Object.entries(tshirtMix).map(([size, count]) => (
                    <div key={size} className="bg-white/5 border border-white/10 p-4 rounded-inner flex justify-between items-center">
                       <span className="text-[9px] font-bold uppercase text-white/40 tracking-widest">{size}</span>
                       <span className="text-xl font-bold tabular-nums">{count}</span>
                    </div>
                  ))}
               </div>
             </div>
          </section>

          <section className="bg-white border border-grey-100 p-8 rounded-card shadow-sm-kaizen">
            <h3 className="font-bold text-grey-400 text-[10px] uppercase tracking-[0.2em] mb-8">Lead Catalyst Unit</h3>
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-inner bg-indigo-lt text-indigo flex items-center justify-center font-bold text-2xl shadow-sm ring-4 ring-white">
                  {topDept[0].toString().charAt(0)}
               </div>
               <div>
                  <p className="text-2xl font-bold text-navy tracking-tighter uppercase">{topDept[0]}</p>
                  <p className="text-[10px] font-bold text-grey-400 uppercase tracking-widest mt-1">{topDept[1] as number} Orchestrations Submitted</p>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
