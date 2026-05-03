import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Student, Activity, Skill, Project } from '../types';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  Zap, 
  Target, 
  BookOpen, 
  Layers, 
  Award, 
  FolderLock, 
  Sparkles, 
  BrainCircuit,
  Plus,
  X,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { getTacticalAnalysis } from '../services/analysisService';

export default function Overview() {
  const { profile, role, schoolId } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecordingMarks, setIsRecordingMarks] = useState(false);
  
  // Marks Form State
  const [markForm, setMarkForm] = useState({ 
    studentId: '', 
    subject: '', 
    score: '', 
    type: 'EXAM' as 'EXAM' | 'QUIZ' | 'ASSIGNMENT' 
  });

  const [stats, setStats] = useState({
    totalStudents: 0,
    activeProjects: 0,
    avgAttendance: 92,
    topBranch: 'N/A',
    weakSubject: 'N/A'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!schoolId) return;
      
      try {
        const [studentsSnap, activitiesSnap, projectsSnap] = await Promise.all([
          getDocs(query(collection(db, 'students'), where('schoolId', '==', schoolId))),
          getDocs(query(collection(db, 'activities'), where('schoolId', '==', schoolId))),
          getDocs(query(collection(db, 'projects'), where('schoolId', '==', schoolId))),
        ]);
        
        const fetchedStudents = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        const fetchedActivities = activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
        
        setStudents(fetchedStudents);
        setActivities(fetchedActivities);

        // Branch analysis
        const branchScores: Record<string, { total: number, count: number }> = {};
        fetchedStudents.forEach(s => {
          const branch = s.branch || 'General';
          if (!branchScores[branch]) branchScores[branch] = { total: 0, count: 0 };
          const studentActs = fetchedActivities.filter(a => a.studentId === s.id);
          const avg = studentActs.length ? studentActs.reduce((acc, a) => acc + (a.score || 0), 0) / studentActs.length : 0;
          branchScores[branch].total += avg;
          branchScores[branch].count += 1;
        });

        const branchStats = Object.entries(branchScores).map(([name, data]) => ({
          name,
          avg: data.total / data.count,
          count: data.count
        })).sort((a, b) => b.avg - a.avg);

        const weakGroup = branchStats.length > 0 ? branchStats[branchStats.length - 1] : null;
        
        setStats({
          totalStudents: fetchedStudents.length,
          activeProjects: projectsSnap.size,
          avgAttendance: 92,
          topBranch: branchStats[0]?.name || 'N/A',
          weakSubject: weakGroup ? weakGroup.name : 'N/A' 
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [schoolId]);

  const handleRecordMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !markForm.studentId || !markForm.score) return;

    try {
      await addDoc(collection(db, 'activities'), {
        studentId: markForm.studentId,
        schoolId,
        name: `${markForm.type}: ${markForm.subject}`,
        type: markForm.type,
        score: parseInt(markForm.score),
        status: 'COMPLETED',
        date: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
      setIsRecordingMarks(false);
      setMarkForm({ studentId: '', subject: '', score: '', type: 'EXAM' });
      
      // Refresh local activities
      const activitiesSnap = await getDocs(query(collection(db, 'activities'), where('schoolId', '==', schoolId)));
      setActivities(activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity)));
    } catch (err) {
      console.error(err);
    }
  };

  // Comparative Data (Branch Performance)
  const branchData = Object.entries(students.reduce((acc, s) => {
    const branch = s.branch || 'Other';
    if (!acc[branch]) acc[branch] = { name: branch, students: 0, avgScore: 0 };
    acc[branch].students += 1;
    const acts = activities.filter(a => a.studentId === s.id);
    const score = acts.length ? (acts.reduce((sum, a) => sum + (a.score || 0), 0) / acts.length) : (70 + Math.random() * 15);
    acc[branch].avgScore = (acc[branch].avgScore * (acc[branch].students - 1) + score) / acc[branch].students;
    return acc;
  }, {} as Record<string, any>)).map(([_, val]) => val);

  const yearData = [
    { name: '1st Year', performance: 78, attendance: 95 },
    { name: '2nd Year', performance: 82, attendance: 88 },
    { name: '3rd Year', performance: 65, attendance: 75 },
    { name: '4th Year', performance: 91, attendance: 92 },
  ];

  const COLORS = ['#9b4dff', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={cn(
          "p-4 rounded-2xl border backdrop-blur-2xl transition-all shadow-2xl",
          theme === 'dark' ? "bg-slate-950/90 border-white/20 text-white" : "bg-white/90 border-slate-200 text-slate-800"
        )}>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 italic">{label}</p>
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || (i%2===0 ? '#8b5cf6' : '#3b82f6') }} />
               <p className="text-sm font-black italic uppercase tracking-tight">
                 {entry.name}: <span className="text-purple-500 ml-1">{entry.value.toFixed(1)}%</span>
               </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const data = {
        students: students.map(s => ({ branch: s.branch, marks: activities.filter(a => a.studentId === s.id).map(a => a.score) })),
        stats,
        activitiesCount: activities.length
      };
      const result = await getTacticalAnalysis(data);
      setAiAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(168,85,247,0.3)]" />
        <div className="space-y-1">
          <p className="font-display font-black tracking-widest text-lg uppercase italic">TRACKORA</p>
          <p className="text-[10px] uppercase font-black tracking-[0.3em] opacity-40 animate-pulse">Syncing Galaxy Data...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 italic uppercase">
            {role === 'TEACHER' ? 'INSTITUTIONAL HUB' : 'GROWTH BOARD'}
          </h1>
          <p className="text-xs uppercase font-black tracking-widest opacity-40">
            {profile?.department || 'Engineering'} | {profile?.role || 'Contributor'} | {profile?.year ? `Year ${profile.year}` : 'Faculty'}
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsRecordingMarks(true)}
            className={cn(
              "px-6 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all shadow-xl",
              theme === 'dark' ? "bg-purple-600 text-white shadow-purple-500/20 hover:bg-purple-500" : "bg-slate-900 text-white"
            )}
          >
            <Plus size={16} />
            Record Sector Marks
          </button>
          <div className={cn(
            "px-6 py-3 rounded-2xl border flex items-center gap-3 backdrop-blur-xl transition-all",
            theme === 'dark' ? "bg-white/5 border-white/10 text-white/60 shadow-[0_0_20px_rgba(168,85,247,0.05)]" : "bg-white border-slate-200"
          )}>
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-black uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className={cn(
        "p-1 rounded-3xl bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 shadow-2xl shadow-purple-500/20",
        isAnalyzing && "animate-pulse"
      )}>
        <div className={cn(
          "rounded-[22px] p-8 flex flex-col md:flex-row items-center gap-8",
          theme === 'dark' ? "bg-slate-950" : "bg-white"
        )}>
          <div className="flex-1 space-y-4">
             <div className="flex items-center gap-2">
               <Sparkles className="text-purple-500" />
               <h2 className="text-2xl font-black italic tracking-tighter uppercase">Tactical Analysis Engine</h2>
             </div>
             <p className="opacity-60 text-sm leading-relaxed font-medium">
               {aiAnalysis || "Strategic analysis engine standby. Awaiting authorization to decrypt institutional performance vectors."}
             </p>
             <button 
               onClick={runAnalysis}
               disabled={isAnalyzing}
               className="px-8 py-4 rounded-xl bg-purple-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-purple-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
             >
               {isAnalyzing ? (
                 <>
                   <BrainCircuit className="animate-spin" size={16} />
                   Analyzing Matrix...
                 </>
               ) : (
                 <>
                   <Zap size={16} />
                   Execute Analysis
                 </>
               )}
             </button>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center p-8 border-l border-white/5 gap-2 group">
             <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                <Target size={32} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Precision: 100%</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Active Students', value: stats.totalStudents, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Logged Sessions', value: stats.activeProjects, icon: FolderLock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Top Segment', value: stats.topBranch, icon: Award, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Attendance', value: `${stats.avgAttendance}%`, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "glass-card p-6 border transition-all hover:translate-y-[-4px] group border-none",
              theme === 'dark' ? "bg-white/[0.02]" : "bg-white shadow-sm"
            )}
          >
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              <stat.icon size={20} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{stat.label}</p>
            <p className="text-2xl font-black italic tracking-tighter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className={cn(
          "glass-card p-8 border-none hover:translate-y-[-4px] transition-all",
          theme === 'dark' ? "bg-white/[0.02]" : "bg-white shadow-sm"
        )}>
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-2 uppercase">
               <Layers className="text-blue-500" />
               Branch Spectrum
             </h2>
             <span className="text-[10px] font-black opacity-30 tracking-[0.2em] uppercase">Matrix View</span>
          </div>
          <div className="h-72 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <BarChart data={branchData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#ffffff05' : '#00000005'} />
                <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: theme === 'dark' ? '#ffffff40' : '#94a3b8', fontSize: 10, fontWeight: 900 }}
                />
                <Tooltip 
                   cursor={{ fill: theme === 'dark' ? '#ffffff05' : '#00000005' }}
                   content={<CustomTooltip />}
                />
                <Bar dataKey="avgScore" radius={[2, 2, 0, 0]} barSize={64}>
                  {branchData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn(
          "glass-card p-8 border-none hover:translate-y-[-4px] transition-all",
          theme === 'dark' ? "bg-white/[0.02]" : "bg-white shadow-sm"
        )}>
           <div className="flex items-center justify-between mb-8">
             <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-2 uppercase">
               <TrendingUp className="text-purple-500" />
               Temporal Growth
             </h2>
             <span className="text-[10px] font-black opacity-30 tracking-[0.2em] uppercase">Trajectory View</span>
          </div>
          <div className="h-72 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <BarChart data={yearData} margin={{ top: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#ffffff05' : '#00000005'} />
                <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: theme === 'dark' ? '#ffffff40' : '#94a3b8', fontSize: 10, fontWeight: 900 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="performance" fill="#9b4dff" radius={[2, 2, 0, 0]} barSize={40}>
                  {yearData.map((_, index) => (
                    <Cell key={`cell-year-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      <div className="grid lg:grid-cols-3 gap-8">
         <div className={cn(
           "glass-card p-10 lg:col-span-1 relative overflow-hidden group transition-all hover:scale-[1.02] border-none",
           theme === 'dark' ? "bg-[#0c0821]" : "bg-slate-900 text-white shadow-xl"
         )}>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-8 shadow-2xl group-hover:rotate-12 transition-transform">
                <AlertCircle className={theme === 'dark' ? "text-purple-400" : "text-white"} size={32} />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-4">Strategic Alert</h2>
              <p className="opacity-60 text-sm leading-relaxed mb-10 font-medium">
                Analysis suggests threshold variance in <span className="text-purple-400 font-black">{stats.weakSubject}</span> segments. 
                Immediate administrative authorization required for cluster rebalancing.
              </p>
              <button 
                onClick={() => navigate('/app/progress')}
                className="w-full py-5 rounded-2xl border-2 border-white/10 text-xs font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all shadow-xl"
              >
                Launch Metrics Panel →
              </button>
            </div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] animate-pulse" />
         </div>
         
         <div className={cn("glass-card p-8 lg:col-span-2 border-none", theme === 'dark' ? "text-white bg-white/[0.02]" : "bg-white shadow-sm")}>
            <div className="flex items-center justify-between mb-10">
              <div>
                 <h3 className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                   <Award size={24} className="text-amber-500" />
                   Elite Vanguard
                 </h3>
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mt-1">High-Efficiency Units</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {students.length > 0 ? (
                students
                  .map(s => {
                    const studentActs = activities.filter(a => a.studentId === s.id);
                    const avg = studentActs.length ? studentActs.reduce((acc, a) => acc + (a.score || 0), 0) / studentActs.length : 0;
                    return { ...s, avg };
                  })
                  .sort((a, b) => b.avg - a.avg)
                  .slice(0, 4)
                  .map((s, i) => (
                    <div key={i} className={cn(
                      "p-6 rounded-3xl border transition-all hover:translate-x-2 group relative overflow-hidden",
                      theme === 'dark' ? "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]" : "bg-slate-50 border-slate-100 shadow-sm"
                    )}>
                       <div className="flex justify-between items-start relative z-10">
                         <div>
                           <p className="text-xl font-black italic tracking-tighter uppercase leading-none group-hover:text-purple-500 transition-colors">{s.name}</p>
                           <p className="text-[9px] font-black uppercase tracking-widest opacity-40 italic mt-2">{s.branch} | Year {s.year}</p>
                         </div>
                         <div className="text-right">
                            <span className="text-lg font-black italic tracking-tighter opacity-70">
                               {s.avg ? s.avg.toFixed(0) : '0'}%
                            </span>
                         </div>
                       </div>
                    </div>
                  ))
              ) : (
                <div className="col-span-2 py-20 flex flex-col items-center justify-center opacity-20 text-center gap-4">
                   <Users size={48} />
                   <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Matrix Sync...</p>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Record Marks Modal */}
      <AnimatePresence>
        {isRecordingMarks && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className={cn(
                 "glass-card max-w-lg w-full p-10 space-y-8 relative border-none",
                 theme === 'dark' ? "bg-slate-950 shadow-2xl" : "bg-white shadow-2xl"
               )}
             >
                <button 
                  onClick={() => setIsRecordingMarks(false)}
                  className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-500/10 transition-all opacity-40 hover:opacity-100"
                >
                   <X size={20} />
                </button>

                <div>
                   <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Record Sector Output</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Sync marks with institutional trajectory.</p>
                </div>

                <form onSubmit={handleRecordMark} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Select Unit</label>
                      <select 
                        value={markForm.studentId}
                        onChange={e => setMarkForm({...markForm, studentId: e.target.value})}
                        className={cn(
                          "w-full rounded-2xl px-5 py-4 focus:outline-none border font-bold text-sm",
                          theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200"
                        )}
                        required
                      >
                         <option value="" disabled className={theme === 'dark' ? "bg-slate-900" : ""}>Identify Target...</option>
                         {students.map(s => (
                           <option key={s.id} value={s.id} className={theme === 'dark' ? "bg-slate-900" : ""}>{s.name} ({s.branch})</option>
                         ))}
                      </select>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Subject</label>
                         <input 
                           type="text" 
                           placeholder="e.g. Design Theory"
                           value={markForm.subject}
                           onChange={e => setMarkForm({...markForm, subject: e.target.value})}
                           className={cn(
                             "w-full rounded-2xl px-5 py-4 focus:outline-none border font-bold text-sm",
                             theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                           )}
                           required
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Score</label>
                         <input 
                           type="number" 
                           placeholder="90"
                           min="0"
                           max="100"
                           value={markForm.score}
                           onChange={e => setMarkForm({...markForm, score: e.target.value})}
                           className={cn(
                             "w-full rounded-2xl px-5 py-4 focus:outline-none border font-bold text-sm",
                             theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                           )}
                           required
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Session Tier</label>
                      <div className="flex gap-2">
                         {['EXAM', 'QUIZ', 'ASSIGNMENT'].map(t => (
                           <button
                             type="button"
                             key={t}
                             onClick={() => setMarkForm({...markForm, type: t as any})}
                             className={cn(
                               "flex-1 py-3 rounded-xl font-black text-[9px] border transition-all uppercase tracking-widest",
                               markForm.type === t
                                 ? (theme === 'dark' ? "bg-purple-600 border-purple-500 text-white shadow-lg" : "bg-slate-900 text-white border-slate-900")
                                 : (theme === 'dark' ? "bg-white/5 border-white/10 text-white/40" : "bg-white border-slate-200 text-slate-400")
                             )}
                           >
                             {t}
                           </button>
                         ))}
                      </div>
                   </div>

                   <button type="submit" className={cn(
                      "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95",
                      theme === 'dark' ? "bg-white text-black hover:bg-white/90" : "bg-slate-900 text-white shadow-slate-900/40"
                   )}>
                      Authorize Record Entry
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
