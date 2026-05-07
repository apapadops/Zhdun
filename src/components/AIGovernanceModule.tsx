import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'motion/react';
import { 
  Zap, 
  Rocket, 
  ShieldCheck, 
  Home, 
  ChevronRight, 
  ArrowLeft, 
  Clock, 
  User, 
  Target, 
  PieChart, 
  Briefcase, 
  LineChart, 
  Search, 
  Download, 
  Filter, 
  Activity, 
  AlertTriangle, 
  FileText, 
  ClipboardList, 
  RefreshCw, 
  Table,
  Bot,
  Loader2,
  X,
  Plus,
  Send,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  Settings,
  Trash2,
  Check
} from 'lucide-react';
import { 
  AIGovernanceCase, 
  AIGovernanceDecision, 
  ProjectStatus, 
  Message 
} from '../types';
import { callGemini, callGeminiOnce } from '../geminiService';
import { auth } from '../firebase';
import { governanceService } from '../services/firestoreService';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const ADMIN_EMAILS = [
  'al.papadopoulos@kaizengaming.com',
  'm.chatzicharalampous@kaizengaming.com',
  'v.vlachakis@kaizengaming.com'
];

interface AIGovernanceModuleProps {
  cases: AIGovernanceCase[];
  onUpdateCases: (cases: AIGovernanceCase[]) => void;
  onBack: () => void;
}

export default function AIGovernanceModule({ cases, onUpdateCases, onBack }: AIGovernanceModuleProps) {
  const [activeTab, setActiveTab] = useState<'wizard' | 'pipeline' | 'registry'>('wizard');
  const [selectedCase, setSelectedCase] = useState<AIGovernanceCase | null>(null);
  const [isLogoutMenuOpen, setIsLogoutMenuOpen] = useState(false);

  const user = auth?.currentUser;
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  const tabs = [
    { id: 'wizard', label: 'Intake', icon: <Rocket size={14} /> },
    ...(isAdmin ? [
      { id: 'pipeline', label: 'Pipeline', icon: <ClipboardList size={14} /> },
      { id: 'registry', label: 'Registry', icon: <Table size={14} /> },
    ] : [])
  ];

  useEffect(() => {
    // If current tab is restricted and user is not admin, fall back to wizard
    if (!isAdmin && (activeTab === 'pipeline' || activeTab === 'registry')) {
      setActiveTab('wizard');
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const setupSubscription = () => {
      unsubscribe = governanceService.subscribeToCases((newCases: AIGovernanceCase[]) => {
        onUpdateCases(newCases);
      });
    };

    const authUnsubscribe = (auth && onAuthStateChanged) ? onAuthStateChanged(auth, (user: any) => {
      if (user) {
        setupSubscription();
      } else {
        unsubscribe();
        onUpdateCases([]);
      }
    }) : () => {};

    return () => {
      if (authUnsubscribe) authUnsubscribe();
      unsubscribe();
    };
  }, [onUpdateCases]);

  const handleCaseSubmit = async (newCase: AIGovernanceCase) => {
    await governanceService.saveCase(newCase);
  };

  const handleDecision = async (id: string, updates: Partial<AIGovernanceCase>) => {
    await governanceService.updateCase(id, updates);
  };

  return (
    <div className="min-h-screen h-[100dvh] flex flex-col overflow-hidden bg-surface text-slate-900 font-sans">
      {/* Navigation Header */}
      <header className="h-auto md:h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 md:px-10 py-4 md:py-0 flex flex-col md:flex-row items-center justify-between shrink-0 gap-6 sticky top-0 z-50">
        <div className="flex items-center justify-between w-full md:w-auto gap-8">
          <div className="flex items-center gap-5 md:gap-8">
            <button 
              onClick={onBack}
              className="p-3 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-400 rounded-2xl transition-all shadow-sm group"
            >
              <Home size={20} className="group-hover:scale-110 transition-transform" />
            </button>
            <div className="w-[1px] h-10 bg-slate-100" />
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Z" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black italic tracking-tighter text-slate-900 leading-none">ZH<span className="text-teal">DUN</span> <span className="text-slate-300 not-italic">AI</span></h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mt-1.5">Governance Engine</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-1.5 bg-slate-100/50 p-1.5 rounded-[2rem] border border-slate-200/50 w-full md:w-auto overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-teal shadow-xl shadow-slate-900/5 border border-slate-100' 
                  : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              <span className="opacity-80">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4 md:gap-8">
          {user ? (
            <div className="relative">
              <div 
                onClick={() => {
                  if (window.innerWidth < 640) {
                    setIsLogoutMenuOpen(!isLogoutMenuOpen);
                  }
                }}
                className="flex items-center gap-4 bg-white/70 backdrop-blur-xl p-2 sm:pl-6 rounded-[2rem] border border-white/50 shadow-xl cursor-pointer md:cursor-default relative z-10"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-slate-900 uppercase leading-none tracking-tight">{user.displayName}</p>
                  <button onClick={(e) => { e.stopPropagation(); signOut(auth); }} className="text-[9px] font-black text-red uppercase tracking-widest hover:text-red-dk transition-colors mt-1 cursor-pointer">Disconnect</button>
                </div>
                <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-2xl border-2 border-white shadow-md active:scale-95 transition-transform" />
              </div>

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
                        signOut(auth);
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
          ) : (
            <button 
              onClick={() => {
                if (!auth) return;
                signInWithPopup(auth, new GoogleAuthProvider());
              }}
              className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 cursor-pointer"
            >
              System Access
            </button>
          )}
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'wizard' && (
          <AIGovernanceWizard user={user} onComplete={(newCase) => {
            handleCaseSubmit(newCase);
            setActiveTab('pipeline');
          }} />
        )}
        {activeTab === 'pipeline' && (
          <AIGovernancePipeline 
            cases={cases} 
            onUpdateCases={onUpdateCases}
            onSelectCase={setSelectedCase}
          />
        )}
        {activeTab === 'registry' && (
          <AIGovernanceRegistry 
            cases={cases.filter(c => c.registry_status === 'active')} 
            onSelectCase={setSelectedCase}
          />
        )}

        {/* Selected Case Detail Panel */}
        <AnimatePresence>
          {selectedCase && (
            <AIGovernanceDetailPanel 
              caseData={selectedCase} 
              onClose={() => setSelectedCase(null)}
              onUpdate={(updated) => {
                handleDecision(updated.id, updated);
                setSelectedCase(updated);
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function AIGovernanceWizard({ user, onComplete }: { user: any, onComplete: (newCase: AIGovernanceCase) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hello ${user?.displayName?.split(' ')[0] || ''}! Welcome. To help you register your AI initiative, let's start with the basics. What's the name of this initiative and which team are you from?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [completedCase, setCompletedCase] = useState<Partial<AIGovernanceCase> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const capturedFields = useMemo(() => {
    if (!completedCase) return [];
    const fields = [
      'requestor_name', 'requestor_department', 'initiative_title', 
      'users_scope', 'data_types', 'ai_tool', 'system_integrations', 'human_in_loop'
    ];
    return fields.filter(f => !!completedCase[f as keyof typeof completedCase]);
  }, [completedCase]);

  const progress = Math.min(100, Math.round((capturedFields.length / 8) * 100));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const systemPrompt = `
You are ZHDUN, Kaizen Gaming's AI governance architect. Your job is to facilitate a high-precision intake for new AI initiatives. You are calm, efficient, and thorough.

RULES — follow these without exception:
- You are ZHDUN.
- Maximum 2 sentences per message. Never write more.
- One question per message. Never ask two things at once.
- No bullet points, no headers, no numbered lists in your messages.
- Plain language only. Never say "system integration", "LLM", "data residency", or any technical governance term.
- When something risky comes up, say one short flagging sentence and move on. Do not explain, do not alarm.
- Follow the question order exactly. Do not add extra questions.
- Track what has been collected. Never re-ask.

QUESTION ORDER:
Q1: Name, department, initiative title
Q2: What it does + who uses it
Q3: Data type (offer the bracketed options inline)
Q4: AI tool
Q5: System connections
Q6: Human oversight
Q7 (conditional): Only if Q3 answer includes AML / KYC / RG / payments / financial reporting

KAIZEN CONTEXT YOU MUST KNOW SILENTLY (never explain these to the requestor unless they ask):
- Approved AI tools: Gemini and Claude Enterprise ONLY. Anything else is flagged.
- Regulated processes (auto Tier 3): AML monitoring, KYC verification, Responsible Gambling (RG), payment processing, financial reporting.
- Data sensitivity order (low to high): Public → Internal business → Player/behavioural → Financial/payment → AML/KYC
- Tier 1 = personal use, auto-approved, no sensitive data, no integrations. Tier 2 = team or department level, internal data, limited connections, approved tools. Tier 3 = cross-divisional or customer-facing, sensitive or regulated data, heavy integrations, or unapproved tools.

TIER SCORING (compute silently — never share the score with the requestor):
Use type: personal=0, team tool=1, automated workflow=2, new app=2, customer-facing=+2
Data: public=0, internal=1, player/behavioural=2, financial/payment=3, AML/KYC=4 (auto T3)
Regulated process: no=0, yes=4 (auto T3)
Human oversight: always=0, sometimes=1, never=3
System connections: none=0, limited=1, heavy=2
AI tool: Gemini or Claude Enterprise=0, other=4 (auto T3)
Scope: just me=0, team=1, department=1, multi-dept=2, company-wide=3, customers=3

Tier result: 0-4 = T1, 5-10 = T2, 11+ or any auto T3 signal = T3

WHEN ALL QUESTIONS ARE DONE:
Tell the requestor their tier in one sentence. Use this exact language:
- T1: "This looks like a Tier 1 initiative — it will be auto-approved, you're good to go."
- T2: "This is a Tier 2 initiative — the Transformation Team will review it and come back to you shortly."
- T3: "This is a Tier 3 initiative — it will go through a full governance review. The team will be in touch."

Then on a new line output exactly:
CASE_COMPLETE:{"requestor_name":"","requestor_department":"","initiative_title":"","initiative_description":"","use_type":"","users_scope":"","data_types":"","system_integrations":"","ai_tool":"","human_in_loop":"","regulated_process":"","intended_purpose":"","markets_affected":"","bias_risk":"","strategic_driver":"","deadline":"","additional_context":"","tier":"T2","tier_score":6,"flags":[]}

FLAGS array: include a short string for each risk signal — unapproved tool, regulated process touched, no human oversight, sensitive data, heavy integrations. Keep each flag under 8 words. If no risks, leave array empty.

Only output CASE_COMPLETE after Q6 (or Q7 if triggered). Do not output it earlier.
`;

      const aiResponse = await callGemini(systemPrompt, [...messages, { role: 'user', content: userMsg }]);
      
      if (aiResponse.includes('CASE_COMPLETE:')) {
        const [text, jsonStr] = aiResponse.split('CASE_COMPLETE:');
        setMessages(prev => [...prev, { role: 'assistant', content: text.trim() }]);
        try {
          const parsed = JSON.parse(jsonStr);
          setCompletedCase(parsed);
        } catch (e) {
          console.error("Failed to parse wizard result", e);
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble processing that right now. Could you please try again?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const submitCase = () => {
    if (!completedCase) return;
    const finalCase: AIGovernanceCase = {
      ...completedCase as AIGovernanceCase,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      decided_at: null,
      approved_date: '',
      next_review_date: '',
      status: ProjectStatus.PENDING,
      decision: null,
      registry_status: 'pending',
      dpo_approved: false,
      security_approved: false,
      architecture_approved: false,
      assessment_notes: '',
      requestor_name: user?.displayName || (completedCase as any).requestor_name,
      requestor_email: user?.email,
    };
    onComplete(finalCase);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 md:gap-8 p-4 md:p-8 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden order-2 lg:order-1">
        <header className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-sm md:text-lg font-black tracking-tight italic text-slate-900">AI Governance <span className="font-light">Intake Wizard</span></h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse" />
              <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Security Vector Analysis Active</p>
            </div>
          </div>
          <div className="text-right">
             <div className="flex items-center gap-3 justify-end mb-1">
               <span className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase tracking-widest">{progress}%</span>
               <div className="w-20 md:w-32 h-1 md:h-1.5 bg-slate-200 rounded-full overflow-hidden">
                 <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-teal" />
               </div>
             </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[90%] md:max-w-[80%] flex gap-3 md:gap-4 ${msg.role === 'assistant' ? '' : 'flex-row-reverse'}`}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  msg.role === 'assistant' 
                    ? 'bg-slate-50 border-slate-200 text-teal' 
                    : 'bg-teal border-transparent text-white'
                }`}>
                  {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className={`p-4 md:p-5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                  msg.role === 'assistant' 
                    ? 'bg-slate-100 text-slate-800 rounded-tl-none shadow-sm' 
                    : 'bg-slate-900 text-white rounded-tr-none shadow-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
               <div className="flex gap-4 items-center pl-10 md:pl-14">
                 <div className="flex gap-1.5">
                   {[0, 1, 2].map(d => (
                     <motion.div 
                       key={d} 
                       animate={{ scale: [1, 1.2, 1] }} 
                       transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                       className="w-1 md:w-1.5 h-1 md:h-1.5 bg-teal-500 rounded-full" 
                     />
                   ))}
                 </div>
                 <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Analyzing input...</span>
               </div>
            </div>
          )}
          {completedCase && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="pt-6">
              <div className="bg-white border-2 border-teal-600 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] hidden sm:block text-teal-900">
                  <ShieldCheck size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <div className={`px-4 md:px-5 py-1.5 md:py-2 rounded-xl text-white font-black text-[9px] md:text-xs uppercase tracking-widest shadow-lg ${
                      completedCase.tier === 'T1' ? 'bg-green' : completedCase.tier === 'T2' ? 'bg-orange' : 'bg-red'
                    }`}>
                      {completedCase.tier} Result
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-black italic tracking-tight text-slate-900">Assessment Ready</h3>
                      <p className="text-[10px] md:text-xs text-slate-400 font-medium leading-none">Review summary before submission</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mb-6 md:mb-8">
                    <div>
                       <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-70">Initiative</p>
                       <p className="text-xs md:text-sm font-bold text-slate-900">{completedCase.initiative_title}</p>
                    </div>
                    <div>
                       <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-70">AI Asset</p>
                       <p className="text-xs md:text-sm font-bold text-slate-900 uppercase">{completedCase.ai_tool}</p>
                    </div>
                    <div>
                       <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-70">Data Residency</p>
                       <p className="text-xs md:text-sm font-bold text-slate-900 uppercase">{completedCase.data_types}</p>
                    </div>
                    <div>
                       <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-70">Scope</p>
                       <p className="text-xs md:text-sm font-bold text-slate-900">{completedCase.markets_affected}</p>
                    </div>
                  </div>

                  <button 
                    onClick={submitCase}
                    className="w-full py-4 bg-teal hover:bg-teal-dk text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-teal/20 flex items-center justify-center gap-2 group"
                  >
                    Register Asset <ArrowLeft size={16} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200">
          <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 p-1 shadow-sm focus-within:border-teal/50 transition-all">
            <input 
              className="flex-1 bg-transparent px-4 md:px-5 py-2.5 md:py-3 text-xs md:text-sm focus:outline-none placeholder-slate-300 text-slate-900"
              placeholder={completedCase ? "Submission ready below" : "Answer the AI's question..."}
              value={input}
              disabled={!!completedCase || isTyping}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <motion.button 
              onClick={handleSend}
              disabled={!input.trim() || !!completedCase || isTyping}
              className="w-10 h-10 md:w-12 md:h-12 bg-teal hover:bg-teal-dk text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-30 shadow-lg shadow-teal/10"
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      </div>

      <aside className="w-full lg:w-72 flex flex-col sm:flex-row lg:flex-col gap-4 md:gap-6 order-1 lg:order-2">
        <div className="flex-1 lg:flex-none bg-white rounded-[2rem] border border-slate-200 p-4 md:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-teal/5 blur-2xl rounded-full" />
          <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 md:mb-6 flex items-center gap-2">
            <Activity size={12} className="text-teal" /> Intake Vector
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-3 space-y-0 lg:space-y-4">
             {[
               { id: 'requestor_name', label: 'Name' },
               { id: 'requestor_department', label: 'Dept' },
               { id: 'initiative_title', label: 'Initiative' },
               { id: 'users_scope', label: 'Users' },
               { id: 'data_types', label: 'Data' },
               { id: 'ai_tool', label: 'Asset' },
               { id: 'system_integrations', label: 'Integrations' },
               { id: 'human_in_loop', label: 'Oversight' },
             ].map((f) => {
               const isCaptured = capturedFields.includes(f.id);
               return (
                 <div key={f.id} className="flex items-center gap-2 md:gap-3">
                   <div className={`w-4 h-4 md:w-5 md:h-5 rounded-lg flex items-center justify-center transition-all ${isCaptured ? 'bg-teal text-white shadow-sm' : 'bg-slate-50 text-slate-200'}`}>
                     {isCaptured ? <Check size={10} strokeWidth={4} /> : <div className="w-1 h-1 bg-current rounded-full" />}
                   </div>
                   <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isCaptured ? 'text-slate-900' : 'text-slate-300'}`}>{f.label}</span>
                 </div>
               );
             })}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 p-4 md:p-6 shadow-xl relative overflow-hidden flex flex-col">
           <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
             <ShieldCheck size={12} className="text-teal" /> Governance Sync
           </h3>
           <div className="space-y-4">
              {[
                { name: 'Initial Intake', fields: ['requestor_name', 'requestor_department', 'initiative_title'] },
                { name: 'Impact Scope', fields: ['initiative_description', 'users_scope'] },
                { name: 'Risk Assessment', fields: ['data_types', 'ai_tool', 'system_integrations'] },
                { name: 'Final Review', fields: ['human_in_loop', 'tier'] },
              ].map((phase, idx) => {
                const completedCount = phase.fields.filter(f => capturedFields.includes(f) || (completedCase && (completedCase as any)[f])).length;
                const isCompleted = completedCount === phase.fields.length;
                const isActive = !isCompleted && (idx === 0 || phase.fields.filter(f => capturedFields.includes(f)).length > 0);

                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full transition-all ${isCompleted ? 'bg-teal' : isActive ? 'bg-teal-dk ring-4 ring-teal-lt' : 'bg-slate-100'}`} />
                    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-slate-900' : isCompleted ? 'text-teal' : 'text-slate-300'}`}>
                      {phase.name}
                    </span>
                  </div>
                );
              })}
           </div>
        </div>
      </aside>
    </div>
  );
}

function AIGovernancePipeline({ cases, onUpdateCases, onSelectCase }: { 
  cases: AIGovernanceCase[], 
  onUpdateCases: (cases: AIGovernanceCase[]) => void,
  onSelectCase: (c: AIGovernanceCase) => void
}) {
  const columns = [
    { id: 'pending', title: 'Pending', status: ProjectStatus.PENDING, accent: 'bg-orange', text: 'text-orange-dk', bg: 'bg-orange-lt' },
    { id: 'review', title: 'In Review', status: ProjectStatus.REVIEW, accent: 'bg-teal', text: 'text-teal-dk', bg: 'bg-teal-lt' },
    { id: 'decided', title: 'Decided', status: ProjectStatus.DECIDED, accent: 'bg-slate-400', text: 'text-slate-700', bg: 'bg-slate-100' },
  ];

  const handleCardClick = (c: AIGovernanceCase) => {
    if (c.status === ProjectStatus.PENDING) {
      const updated = { ...c, status: ProjectStatus.REVIEW };
      onUpdateCases(cases.map(item => item.id === c.id ? updated : item));
      onSelectCase(updated);
    } else {
      onSelectCase(c);
    }
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 md:p-8 flex gap-6 md:gap-8 bg-[#F8FAFC] scrollbar-hide">
      {columns.map(col => (
        <div key={col.id} className="min-w-[320px] md:min-w-[400px] flex-1 flex flex-col h-full bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className={`flex justify-between items-center p-6 border-b border-slate-100 ${col.bg}`}>
            <h3 className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${col.text} flex items-center gap-2`}>
              <span className={`w-2 h-2 rounded-full ${col.accent}`} />
              {col.title}
            </h3>
            <span className="bg-white px-3 py-1 rounded-lg text-[10px] font-black border border-slate-200 text-slate-500 shadow-sm">
              {cases.filter(c => c.status === col.status).length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-hide">
            {cases.filter(c => c.status === col.status).map(c => (
              <motion.div
                key={c.id}
                layoutId={c.id}
                onClick={() => handleCardClick(c)}
                whileHover={{ y: -4, shadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-md hover:border-teal/30 transition-all cursor-pointer group relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white ${
                    c.tier === 'T1' ? 'bg-green' : c.tier === 'T2' ? 'bg-orange' : 'bg-red'
                  }`}>
                    {c.tier}
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    {c.requestor_department}
                  </div>
                </div>

                <h4 className="text-slate-900 font-black text-sm mb-2 group-hover:text-teal transition-colors leading-tight italic tracking-tight">{c.initiative_title}</h4>
                
                <div className="space-y-4 mb-6">
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
                    {c.initiative_description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset</p>
                      <p className="text-[10px] font-bold text-slate-700 truncate">{c.ai_tool}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Data</p>
                      <p className="text-[10px] font-bold text-slate-700 truncate">{c.data_types}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                      {c.requestor_name?.split(' ').map(n => n[0]).join('') || '??'}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-900 leading-none">{c.requestor_name}</p>
                      <p className="text-[8px] font-bold text-slate-400 leading-none mt-0.5 uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {c.flags.length > 0 && (
                    <div className="bg-orange-lt text-orange-dk px-2 py-1 rounded-lg flex items-center gap-1.5 border border-orange-dk/10 shadow-sm animate-pulse">
                      <AlertTriangle size={12} />
                      <span className="text-[10px] font-black">{c.flags.length}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AIGovernanceRegistry({ cases, onSelectCase }: { 
  cases: AIGovernanceCase[],
  onSelectCase: (c: AIGovernanceCase) => void
}) {
  const [search, setSearch] = useState('');
  
  const filtered = cases.filter(c => 
    c.initiative_title.toLowerCase().includes(search.toLowerCase()) ||
    c.requestor_name.toLowerCase().includes(search.toLowerCase()) ||
    c.requestor_department.toLowerCase().includes(search.toLowerCase()) ||
    c.ai_tool.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ['Initiative', 'Owner', 'Department', 'Tier', 'AI Tool', 'Data Type', 'Users', 'Markets', 'Approved Date', 'Next Review'];
    const rows = filtered.map(c => [
      c.initiative_title,
      c.requestor_name,
      c.requestor_department,
      c.tier,
      c.ai_tool,
      c.data_types,
      c.users_scope,
      c.markets_affected,
      c.approved_date,
      c.next_review_date
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kaizen_ai_registry_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-hidden p-4 md:p-10 flex flex-col bg-[#F8FAFC]">
      <div className="mb-8 md:mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
           <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter text-slate-900 leading-none">AI Asset Registry</h2>
           <p className="text-[10px] md:text-xs text-slate-400 font-black tracking-[0.2em] uppercase mt-2">Verified Enterprise Inventory</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
           <div className="relative flex-1 lg:w-96 group">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal transition-colors" />
             <input 
               className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal/10 focus:border-teal/50 focus:outline-none transition-all placeholder-slate-300 shadow-sm"
               placeholder="Search by initiative, owner, or tool..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           <button 
             onClick={exportCSV}
             className="flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 whitespace-nowrap"
           >
             <Download size={14} /> Export Dataset
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8 md:mb-12">
          {[
            { label: 'Registered Assets', value: cases.length, color: 'text-teal', icon: <Activity size={12} /> },
            { label: 'Tier 1 (Low)', value: cases.filter(c => c.tier === 'T1').length, color: 'text-green', icon: <ShieldCheck size={12} /> },
            { label: 'Tier 2 (Mid)', value: cases.filter(c => c.tier === 'T2').length, color: 'text-orange', icon: <RefreshCw size={12} /> },
            { label: 'Tier 3 (High)', value: cases.filter(c => c.tier === 'T3').length, color: 'text-red', icon: <Target size={12} /> },
            { label: 'Pending Audit', value: 2, color: 'text-slate-400', icon: <Clock size={12} /> },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
               <div className={`absolute top-0 right-0 w-12 h-12 rounded-bl-full opacity-5 transition-transform group-hover:scale-110 ${stat.color.replace('text', 'bg')}`} />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                 {stat.icon} {stat.label}
               </p>
               <p className={`text-3xl font-black italic tracking-tighter ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
      </div>

      <div className="flex-1 overflow-hidden bg-white rounded-[2.5rem] border border-slate-200 flex flex-col shadow-xl">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Initiative Details</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner / Dept</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Class</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Framework</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Profile</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr 
                  key={c.id} 
                  onClick={() => onSelectCase(c)}
                  className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="px-10 py-7">
                    <p className="text-[13px] font-black text-slate-900 group-hover:text-teal transition-colors leading-tight italic">{c.initiative_title}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{c.strategic_driver}</p>
                  </td>
                  <td className="px-8 py-7">
                    <p className="text-[12px] font-black text-slate-900">{c.requestor_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{c.requestor_department}</p>
                  </td>
                  <td className="px-6 py-7">
                    <div className="flex justify-center">
                      <span className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-sm ${
                        c.tier === 'T1' ? 'bg-green-500' : c.tier === 'T2' ? 'bg-amber-500' : 'bg-red-500'
                      }`}>
                        {c.tier}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-teal" />
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{c.ai_tool}</span>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <span className="text-[11px] font-bold text-slate-500 line-clamp-1 italic">"{c.data_types}"</span>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-slate-300" />
                      <span className="text-[11px] font-black text-slate-600">{c.approved_date}</span>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-2">
                       <div className="relative">
                         <span className="absolute inset-0 bg-teal-400 rounded-full animate-ping opacity-20" />
                         <span className="relative block w-2 h-2 bg-teal-500 rounded-full" />
                       </div>
                       <span className="text-[10px] font-black text-teal uppercase tracking-widest">Registered</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
               <Search size={32} />
             </div>
             <h3 className="text-lg font-black text-slate-900 italic uppercase">No assets identified</h3>
             <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Adjust your search parameters</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AIGovernanceDetailPanel({ caseData, onClose, onUpdate }: { 
  caseData: AIGovernanceCase, 
  onClose: () => void,
  onUpdate: (c: AIGovernanceCase) => void 
}) {
  const [isScoring, setIsScoring] = useState(false);
  const [assessmentText, setAssessmentText] = useState(caseData.assessment_notes || '');
  const [localCase, setLocalCase] = useState(caseData);

  useEffect(() => {
    setLocalCase(caseData);
    setAssessmentText(caseData.assessment_notes || '');
  }, [caseData]);

  const handleUpdate = (updates: Partial<AIGovernanceCase>) => {
    const updated = { ...localCase, ...updates };
    setLocalCase(updated);
    onUpdate(updated);
  };

  const runAIAssessment = async () => {
    setIsScoring(true);
    const prevText = assessmentText;
    try {
      const prompt = `
You are a senior AI governance reviewer at Kaizen Gaming's Transformation Team. Review this AI initiative intake and provide:

1. Tier confirmation — confirm the tier is correct based on the signals, or flag if it should be higher/lower and why.
2. Key risks — identify the top 2-3 governance risks in plain language.
3. Recommended decision — Approve / Needs more info / Reject — with a clear 2-3 sentence reason.
4. Conditions or questions — top 2-3 things to clarify or require before approval.

Kaizen's approved tools: Gemini and Claude Enterprise only.
Regulated processes (always Tier 3): AML, KYC, RG, payments, financial reporting.
Tier 1 = personal use, auto-approved. Tier 2 = divisional, light review. Tier 3 = enterprise, full governance.

Plain text only. No markdown headers or bullet symbols.

CASE DATA:
Initiative: ${localCase.initiative_title}
Description: ${localCase.initiative_description}
Tier: ${localCase.tier}
Tool: ${localCase.ai_tool}
Data: ${localCase.data_types}
Markets: ${localCase.markets_affected}
Integrations: ${localCase.system_integrations}
Human Loop: ${localCase.human_in_loop}
Regulated: ${localCase.regulated_process}
Bias: ${localCase.bias_risk}
`;
      const assessment = await callGeminiOnce(prompt);
      const newText = prevText ? `${prevText}\n\n--- AI ASSESSMENT (${new Date().toLocaleDateString()}) ---\n${assessment}` : `--- AI ASSESSMENT (${new Date().toLocaleDateString()}) ---\n${assessment}`;
      setAssessmentText(newText);
      handleUpdate({ assessment_notes: newText });
    } catch (err) {
      console.error(err);
    } finally {
      setIsScoring(false);
    }
  };

  const finalizeDecision = (decision: AIGovernanceDecision) => {
    const today = new Date().toISOString().split('T')[0];
    let nextReview = '';
    
    if (decision === AIGovernanceDecision.APPROVED) {
      const date = new Date();
      if (localCase.tier === 'T3') date.setMonth(date.getMonth() + 6);
      else date.setFullYear(date.getFullYear() + 1);
      nextReview = date.toISOString().split('T')[0];
    }

    handleUpdate({
      decision,
      status: ProjectStatus.DECIDED,
      approved_date: decision === AIGovernanceDecision.APPROVED ? today : '',
      next_review_date: nextReview,
      registry_status: decision === AIGovernanceDecision.APPROVED ? 'active' : 'pending',
      decided_at: new Date().toISOString()
    });
    onClose();
  };

  const getBigBetBadge = (driver: string) => {
    const configs: any = {
      'Hey Betano': { color: 'text-orange', bg: 'bg-orange-lt', icon: '🤖' },
      'Shield Betano': { color: 'text-blue', bg: 'bg-blue-lt', icon: '🛡' },
      'Betano Republic': { color: 'text-purple', bg: 'bg-purple-lt', icon: '🌍' },
      'Core Betano': { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '⚡' },
    };
    const c = configs[driver] || configs['Core Betano'];
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 ${c.bg} border border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest ${c.color}`}>
        {c.icon} {driver}
      </span>
    );
  };

  const getRiskColor = (key: string, value: string) => {
    const val = (value || '').toLowerCase();
    
    if (key === 'ai_tool') {
      return ['gemini', 'claude enterprise'].includes(val) ? 'text-teal bg-teal-lt border-teal-dk/10' : 'text-red bg-red-lt border-red-dk/10';
    }
    if (key === 'data_types') {
      if (val.includes('pii') || val.includes('financial') || val.includes('aml')) return 'text-red bg-red-lt border-red-dk/10';
      if (val.includes('internal')) return 'text-orange bg-orange-lt border-orange-dk/10';
      return 'text-teal bg-teal-lt border-teal-dk/10';
    }
    if (key === 'human_in_loop') {
      if (val === 'always') return 'text-teal bg-teal-lt border-teal-dk/10';
      if (val === 'sometimes') return 'text-orange bg-orange-lt border-orange-dk/10';
      return 'text-red bg-red-lt border-red-dk/10';
    }
    if (key === 'regulated_process') {
      return val === 'no' ? 'text-teal bg-teal-lt border-teal-dk/10' : 'text-red bg-red-lt border-red-dk/10';
    }
    return 'text-slate-400 bg-slate-50 border-slate-100';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex flex-col p-4 md:p-12 items-center justify-center overflow-hidden font-sans"
    >
      <div className="w-full max-w-7xl bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-full ring-1 ring-slate-200/50">
        {/* Header Section */}
        <div className="bg-white p-8 md:p-12 border-b border-slate-100 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <button 
                onClick={onClose}
                className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-[1.5rem] transition-all border border-slate-200 group shadow-sm"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                   <span className={`px-4 py-1 text-[10px] font-black rounded-xl uppercase tracking-widest border ${
                     localCase.tier === 'T1' ? 'bg-green-50 text-green-600 border-green-100' : localCase.tier === 'T2' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                   }`}>
                     {localCase.tier} Criticality
                   </span>
                   {getBigBetBadge(localCase.strategic_driver)}
                   {localCase.decision && (
                     <span className={`px-4 py-1 text-[10px] font-black rounded-xl uppercase tracking-widest border ${
                       localCase.decision === AIGovernanceDecision.APPROVED ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-red-50 text-red-600 border-red-100'
                     }`}>
                       {localCase.decision}
                     </span>
                   )}
                </div>
                <h2 className="text-2xl md:text-5xl font-black italic tracking-tighter text-slate-900 leading-none">{localCase.initiative_title || "Untitled AI initiative"}</h2>
                <div className="flex items-center gap-3 mt-4 text-slate-400">
                  <User size={14} className="text-teal" />
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">{localCase.requestor_name} <span className="mx-2 text-slate-200">|</span> {localCase.requestor_department}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex gap-10 lg:mr-8 lg:pr-10 lg:border-r border-slate-100 items-center">
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Risk Score</p>
                   <p className="text-2xl md:text-4xl font-black italic tracking-tighter text-slate-900 leading-none">{localCase.tier_score}<span className="text-sm font-normal text-slate-200 ml-1">/ 20</span></p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Status</p>
                   <div className="flex items-center gap-2 justify-end">
                     <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                     <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-teal-600 italic">{localCase.status}</p>
                   </div>
                </div>
              </div>

              <div className="flex gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => finalizeDecision(AIGovernanceDecision.REJECTED)}
                  className="flex-1 sm:flex-none px-6 py-4 bg-white hover:bg-red-lt text-red rounded-3xl text-[10px] font-black uppercase tracking-widest border border-red-dk/10 transition-all shadow-sm"
                >
                  Reject
                </button>
                <button 
                  onClick={() => finalizeDecision(AIGovernanceDecision.APPROVED)}
                  className="flex-1 sm:flex-none px-10 py-4 bg-slate-900 hover:bg-teal text-white rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10"
                >
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-hide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14">
            
            {/* Analysis Column */}
            <div className="lg:col-span-8 space-y-12">
              <section>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                   <Activity size={12} className="text-teal" /> Executive Summary
                </h3>
                <div className="bg-slate-50 p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
                  <p className="text-sm md:text-xl font-medium text-slate-800 leading-relaxed italic mb-10 tracking-tight">
                    "{localCase.initiative_description}"
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-70">Primary UseCase</p>
                      <p className="text-xs md:text-sm font-black text-slate-900 uppercase italic leading-tight">{localCase.use_type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-70">User Scope</p>
                      <p className="text-xs md:text-sm font-black text-slate-900 uppercase italic leading-tight">{localCase.users_scope}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-70">Regulatory Domain</p>
                      <p className="text-xs md:text-sm font-black text-slate-900 uppercase italic leading-tight">{localCase.regulated_process}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                   <ShieldCheck size={12} className="text-teal" /> Technical Risk Vectors
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    { label: 'AI Platform', val: localCase.ai_tool, key: 'ai_tool' },
                    { label: 'Data Residency', val: localCase.data_types, key: 'data_types' },
                    { label: 'Oversight Model', val: localCase.human_in_loop, key: 'human_in_loop' },
                    { label: 'External Systems', val: localCase.system_integrations, key: 'integrations' },
                    { label: 'Market Scope', val: localCase.markets_affected, key: 'markets' },
                    { label: 'Bias & Ethics', val: localCase.bias_risk, key: 'bias' },
                  ].map((item, i) => (
                    <div key={i} className={`p-6 rounded-[2rem] border transition-all shadow-sm ${getRiskColor(item.key, item.val)}`}>
                       <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mb-2 leading-none">{item.label}</p>
                       <p className="text-[10px] md:text-xs font-black uppercase tracking-widest leading-tight">{item.val}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Assessment Column */}
            <div className="lg:col-span-4 space-y-12">
              <section className="flex flex-col h-full bg-slate-50 rounded-[3rem] p-8 border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <PieChart size={12} className="text-teal-600" /> Review Control
                  </h3>
                  <button 
                    onClick={runAIAssessment}
                    disabled={isScoring}
                    className="flex items-center gap-3 px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl shadow-slate-900/10"
                  >
                    {isScoring ? <Loader2 size={12} className="animate-spin" /> : <Bot size={14} />}
                    Generate Audit
                  </button>
                </div>

                {localCase.tier === 'T3' && (
                  <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-8 mb-8">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-6 flex items-center gap-3 justify-center">
                      <ShieldCheck size={16} /> Tier 3 Mandates
                    </p>
                    <div className="space-y-3">
                      {[
                        { label: 'DPO privacy assessment', field: 'dpo_approved' },
                        { label: 'Cloud security audit', field: 'security_approved' },
                        { label: 'Architecture sync', field: 'architecture_approved' },
                      ].map((check, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleUpdate({ [check.field as any]: !localCase[check.field as keyof AIGovernanceCase] })}
                          className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all cursor-pointer group ${
                            localCase[check.field as keyof AIGovernanceCase] ? 'bg-teal-600 border-teal-600' : 'bg-white border-slate-100'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all ${
                            localCase[check.field as keyof AIGovernanceCase] ? 'bg-white border-white text-teal-600' : 'border-slate-200 bg-transparent text-transparent'
                          }`}>
                            <Check size={12} strokeWidth={4} />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest transition-colors leading-tight ${
                             localCase[check.field as keyof AIGovernanceCase] ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'
                          }`}>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col flex-1 gap-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Governance Log</p>
                  <textarea 
                    className="flex-1 bg-white border border-slate-100 rounded-[2.5rem] p-8 text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500/50 resize-none scrollbar-hide shadow-inner leading-relaxed placeholder-slate-200"
                    value={assessmentText}
                    onChange={(e) => {
                      setAssessmentText(e.target.value);
                      handleUpdate({ assessment_notes: e.target.value });
                    }}
                    placeholder="Capture review findings, compliance gaps, and specialized approval conditions..."
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
        
        {/* Footer Metadata Section */}
        <div className="bg-slate-50/50 p-6 px-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-slate-300 gap-6 shrink-0">
           <div className="flex flex-wrap gap-8 items-center justify-center md:justify-start">
              <div>
                 <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-50">Reference Hash</p>
                 <p className="text-[11px] font-mono font-black text-slate-400 uppercase">SYS-{caseData.id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="w-[1px] h-6 bg-slate-100 hidden md:block" />
              <div>
                 <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-50">Authentication Timestamp</p>
                 <p className="text-[11px] font-mono font-black text-slate-400">{new Date(caseData.created_at).toLocaleString()}</p>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] italic text-slate-400">Shield Governance v5.0 Secured</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

