import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Student, Activity, Class } from '../types';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  BarChart3,
  Search,
  Users,
  Award
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function ProgressPage() {
  const { schoolId, role, profile } = useAuth();
  const { theme } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [classes, setClasses] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;
    
    const qClasses = query(collection(db, 'classes'), where('schoolId', '==', schoolId));
    const unsubscribeClasses = onSnapshot(qClasses, (snapshot) => {
      const classMap: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        classMap[doc.id] = (doc.data() as Class).name;
      });
      setClasses(classMap);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'classes');
    });

    return () => unsubscribeClasses();
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId) return;

    // Filter students by school
    const qStudents = query(collection(db, 'students'), where('schoolId', '==', schoolId));
    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students');
    });

    // Activities
    const qActivities = query(collection(db, 'activities'), where('schoolId', '==', schoolId), orderBy('date', 'desc'));
    const unsubscribeActivities = onSnapshot(qActivities, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'activities');
    });

    return () => {
      unsubscribeStudents();
      unsubscribeActivities();
    };
  }, [schoolId]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const studentStats = filteredStudents.map(student => {
    const studentActivities = activities.filter(a => a.studentId === student.id);
    const completed = studentActivities.filter(a => a.status === 'COMPLETED').length;
    const total = studentActivities.length;
    const avgScore = studentActivities.reduce((acc, curr) => acc + (curr.score || 0), 0) / (studentActivities.length || 1);
    
    return {
      ...student,
      completed,
      total,
      progress: total > 0 ? (completed / total) * 100 : 0,
      avgScore
    };
  });

  // Chart Data: Completion trends
  const chartData = activities.slice(0, 20).map(a => ({
    name: a.name.substring(0, 10),
    score: a.score || 0
  }));

  // Branch Performance Data
  const branches = [...new Set(students.map(s => s.branch || 'Other'))];
  const branchPerf = branches.map(branch => {
    const branchStudents = studentStats.filter(s => s.branch === branch);
    const avgProgress = branchStudents.reduce((acc, s) => acc + s.progress, 0) / (branchStudents.length || 1);
    return { name: branch, progress: avgProgress };
  });

  // Calculate weak areas per class
  const classPerformance = Object.entries(students.reduce((acc, s) => {
    const className = s.classId ? (classes[s.classId] || `Class ${s.classId}`) : 'Unassigned';
    if (!acc[className]) acc[className] = { totalScore: 0, count: 0 };
    const sStats = studentStats.find(sStat => sStat.id === s.id);
    acc[className].totalScore += sStats?.avgScore || 0;
    acc[className].count += 1;
    return acc;
  }, {} as Record<string, { totalScore: number, count: number }>)).map(([name, data]: [string, any]) => ({
    group: name,
    score: data.totalScore / (data.count || 1),
    studentCount: data.count
  })).sort((a, b) => a.score - b.score);

  const topClass = [...classPerformance].sort((a, b) => b.score - a.score)[0];
  const weakAreas = classPerformance.filter(g => g.score < 70).slice(0, 4);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="text-purple-500" />
            Comparative Metrics
          </h1>
          <p className="text-slate-500">Analyze performance across branches, subjects, and years.</p>
        </div>
        
        <div className="flex gap-2">
           <div className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all",
            theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
          )}>
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm w-48"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Avg. Completion', value: `${(studentStats.reduce((acc, s) => acc + s.progress, 0) / (studentStats.length || 1)).toFixed(1)}%`, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Total Activities', value: activities.length, icon: BarChart3, color: 'text-blue-500' },
          { label: 'Active Students', value: students.length, icon: Users, color: 'text-purple-500' },
          { label: 'Top Section', value: topClass?.group || 'N/A', icon: Award, color: 'text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className={cn("glass-card p-6", theme !== 'dark' && "bg-white border-slate-100")}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-500 text-sm font-medium">{stat.label}</span>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-1 gap-8">
        {/* Section Comparative Chart */}
        <div className={cn("glass-card p-6", theme !== 'dark' && "bg-white")}>
          <h2 className="text-xl font-bold mb-6">Section Comparison</h2>
          <div className="h-[300px] min-h-[300px]">
             <ResponsiveContainer width="100%" height="100%" minHeight={300}>
               <BarChart data={classPerformance} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#ffffff10' : '#00000010'} />
                 <XAxis type="number" fontSize={10} hide />
                 <YAxis dataKey="group" type="category" fontSize={10} tick={{ fill: theme === 'dark' ? '#fff' : '#000', opacity: 0.5 }} />
                 <Tooltip 
                    contentStyle={theme === 'dark' ? { backgroundColor: '#0f0c21', borderColor: '#ffffff20' } : {}}
                    itemStyle={{ color: '#fff' }}
                 />
                 <Bar dataKey="score" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers Ranking */}
        <div className={cn("lg:col-span-2 glass-card p-6", theme !== 'dark' && "bg-white")}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Student Performance Analysis</h2>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-30">Real-time Data Stream</div>
          </div>
          <div className="space-y-6">
            {studentStats.sort((a,b) => b.progress - a.progress).slice(0, 10).map((student) => (
              <div key={student.id} className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="font-bold flex items-center gap-2 group-hover:text-purple-500 transition-colors">
                      {student.name}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-black uppercase">
                        {student.branch} | {student.year} Yr
                      </span>
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-[10px] uppercase font-black tracking-widest opacity-40">
                         {student.completed}/{student.total} Activities
                      </p>
                      <p className="text-[10px] uppercase font-black tracking-widest text-purple-500">
                         Avg Score: {(student.avgScore || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-lg font-black italic tracking-tighter",
                      student.progress > 80 ? "text-green-500" : student.progress > 50 ? "text-blue-500" : "text-amber-500"
                    )}>
                      {student.progress.toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "h-1.5 w-full rounded-full overflow-hidden",
                  theme === 'dark' ? "bg-white/5" : "bg-slate-100"
                )}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${student.progress}%` }}
                    className={cn(
                      "h-full rounded-full",
                      student.progress > 80 ? "bg-green-500" : student.progress > 50 ? "bg-blue-500" : "bg-amber-500"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
                    <div className="mt-8 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
             <h3 className="font-bold mb-2 flex items-center gap-2 text-amber-500">
               <AlertCircle size={18} />
               Weakest Performing Sectors
             </h3>
             {weakAreas.length > 0 ? (
               <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {weakAreas.map((area, idx) => (
                    <div key={idx} className={cn(
                      "p-4 rounded-xl border transition-all",
                      theme === 'dark' ? "bg-white/5 border-white/5 hover:border-amber-500/30" : "bg-white border-slate-100 shadow-sm"
                    )}>
                       <p className="text-sm font-bold opacity-60 mb-1">{area.group}</p>
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] uppercase font-black tracking-widest text-amber-500/70">Critical Focus</span>
                         <span className="text-xs font-bold text-amber-500">{area.score.toFixed(0)}% Avg</span>
                       </div>
                       <div className="mt-2 text-[9px] opacity-40 italic">Analysis based on {area.studentCount} active records</div>
                    </div>
                  ))}
               </div>
             ) : (
                <div className="py-4 text-sm text-green-500 font-medium italic">
                   No immediate critical weak areas detected. All segments currently meet proficiency benchmarks.
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
