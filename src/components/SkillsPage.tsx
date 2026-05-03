import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Student, Skill } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { 
  Zap, 
  Search, 
  Plus, 
  ChevronRight, 
  Trash2, 
  Users,
  BarChart3,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';

export default function SkillsPage() {
  const { schoolId } = useAuth();
  const { theme } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [showGraph, setShowGraph] = useState(false);

  // Form state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState(50);

  useEffect(() => {
    if (!schoolId) return;

    const qStudents = query(collection(db, 'students'), where('schoolId', '==', schoolId));
    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students');
    });

    const qSkills = query(collection(db, 'skills'), where('schoolId', '==', schoolId));
    const unsubscribeSkills = onSnapshot(qSkills, (snapshot) => {
      setSkills(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Skill)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'skills');
    });

    return () => {
      unsubscribeStudents();
      unsubscribeSkills();
    };
  }, [schoolId]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !newSkillName || !schoolId) return;

    try {
      await addDoc(collection(db, 'skills'), {
        studentId: selectedStudent.id,
        schoolId,
        name: newSkillName,
        proficiency: newSkillProficiency,
        updatedAt: serverTimestamp(),
      });
      setIsAddingSkill(false);
      setNewSkillName('');
      setNewSkillProficiency(0);
    } catch (error) {
      console.error(error);
    }
  };

  const updateProficiency = async (skillId: string, delta: number) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return;
    const nextValue = Math.min(100, Math.max(0, skill.proficiency + delta));
    await updateDoc(doc(db, 'skills', skillId), { 
      proficiency: nextValue,
      updatedAt: serverTimestamp()
    });
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const studentSkills = selectedStudent ? skills.filter(s => s.studentId === selectedStudent.id) : [];
  
  // Data for the bar chart
  const graphData = studentSkills.map(s => ({
    name: s.name,
    proficiency: s.proficiency
  }));

  return (
    <div className="h-[calc(100vh-160px)] flex gap-8">
      {/* Left Pane: Student List */}
      <div className={cn(
        "w-80 flex flex-col glass-card border-none overflow-hidden",
        theme !== 'dark' && "bg-white shadow-sm"
      )}>
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Students
          </h2>
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border",
            theme === 'dark' ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
          )}>
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-sm w-full focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredStudents.map(student => (
            <button
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className={cn(
                "w-full px-6 py-4 flex items-center justify-between transition-all text-left border-b border-white/5",
                selectedStudent?.id === student.id 
                  ? (theme === 'dark' ? "bg-purple-600/20 text-purple-400 border-r-2 border-r-purple-500" : "bg-brand-primary/5 text-brand-primary border-r-2 border-r-brand-primary")
                  : "hover:bg-white/5"
              )}
            >
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-xs opacity-40">{skills.filter(s => s.studentId === student.id).length} Skills</p>
              </div>
              <ChevronRight className={cn("w-4 h-4", selectedStudent?.id === student.id ? "opacity-100" : "opacity-20")} />
            </button>
          ))}
        </div>
      </div>

      {/* Right Pane: Skill Management */}
      <div className="flex-1 overflow-y-auto pr-4">
        {selectedStudent ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{selectedStudent.name}'s Proficiency</h1>
                <p className="text-slate-500 mt-1 uppercase text-[10px] font-black tracking-widest opacity-60">Skill Metrics & Quantitative Mapping</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowGraph(!showGraph)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border",
                    showGraph
                      ? (theme === 'dark' ? "bg-purple-600 border-purple-500 text-white" : "bg-slate-900 text-white border-slate-900")
                      : (theme === 'dark' ? "bg-white/5 border-white/10 text-white/40 hover:text-white" : "bg-white border-slate-200 text-slate-500 hover:text-slate-900")
                  )}
                >
                  <BarChart3 className="w-5 h-5" />
                  {showGraph ? 'View Detailed List' : 'Proficiency Chart'}
                </button>
                <button 
                  onClick={() => setIsAddingSkill(true)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all",
                    theme === 'dark' ? "bg-white text-black hover:bg-white/90" : "bg-slate-900 text-white"
                  )}
                >
                  <Plus className="w-5 h-5" />
                  Add Skill
                </button>
              </div>
            </div>

            {/* Content Toggle: Graph vs List */}
            {showGraph ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-8 rounded-3xl border-2 border-dashed",
                  theme === 'dark' ? "border-white/5 bg-white/[0.01]" : "border-slate-100 bg-slate-50/50"
                )}
              >
                 <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={graphData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: theme === 'dark' ? '#ffffff40' : '#64748b', fontSize: 10, fontWeight: 900 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: theme === 'dark' ? '#ffffff40' : '#64748b', fontSize: 10, fontWeight: 900 }}
                          domain={[0, 100]}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#0a0a0a' : '#ffffff', 
                            borderColor: theme === 'dark' ? '#ffffff10' : '#e2e8f0',
                            borderRadius: '16px',
                            color: theme === 'dark' ? '#ffffff' : '#000000',
                            fontSize: '12px'
                          }}
                        />
                        <Bar 
                          dataKey="proficiency" 
                          radius={[8, 8, 0, 0]}
                          barSize={40}
                        >
                          {graphData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {studentSkills.map((skill) => (
                  <motion.div
                    key={skill.id}
                    layoutId={skill.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "glass-card p-6 flex flex-col gap-4 group",
                      theme !== 'dark' && "bg-white"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          theme === 'dark' ? "bg-white/5" : "bg-slate-100"
                        )}>
                          <Award className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <h3 className="font-bold">{skill.name}</h3>
                          <span className="text-[10px] uppercase tracking-widest font-black opacity-30 italic">Proficiency Tier</span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={async () => {
                           if(confirm('Delete skill?')) await deleteDoc(doc(db, 'skills', skill.id!));
                         }} className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg">
                           <Trash2 size={16} />
                         </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                         <span className="opacity-50">Proficiency</span>
                         <span className="font-bold text-purple-500">{skill.proficiency}%</span>
                      </div>
                      <div className={cn(
                        "h-2 w-full rounded-full overflow-hidden",
                        theme === 'dark' ? "bg-white/5" : "bg-slate-100"
                      )}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.proficiency}%` }}
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => updateProficiency(skill.id!, -5)}
                          className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-all", theme === 'dark' ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50")}
                        >
                          Decrease
                        </button>
                        <button 
                          onClick={() => updateProficiency(skill.id!, 5)}
                          className={cn("flex-1 py-2 rounded-xl text-xs font-bold border transition-all", theme === 'dark' ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50")}
                        >
                          Increase
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {skills.filter(s => s.studentId === selectedStudent.id).length === 0 && (
              <div className="text-center py-20 opacity-30">
                 <Zap className="w-16 h-16 mx-auto mb-4" />
                 <p className="text-xl font-bold">No skills added yet</p>
                 <p>Start by adding a skill to track proficiency levels.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <Users className="w-24 h-24 mb-4" />
            <h2 className="text-3xl font-bold">Select a Student</h2>
            <p className="max-w-xs mx-auto">Select a student from the sidebar to manage their skills and learning path.</p>
          </div>
        )}
      </div>

      {/* Add Skill Modal */}
      {isAddingSkill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "glass-card max-w-md w-full p-8 space-y-6",
              theme !== 'dark' && "bg-white"
            )}
          >
            <h2 className="text-2xl font-bold">Add New Skill</h2>
            <form onSubmit={handleAddSkill} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-40 uppercase tracking-widest">Skill Name</label>
                <input 
                  type="text" 
                  value={newSkillName}
                  onChange={e => setNewSkillName(e.target.value)}
                  className={cn("w-full px-4 py-3 rounded-xl border bg-transparent", theme === 'dark' ? "border-white/10" : "border-slate-200")}
                  placeholder="e.g. Mathematics"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-40 uppercase tracking-widest">Initial Proficiency ({newSkillProficiency}%)</label>
                <input 
                  type="range" 
                  value={newSkillProficiency}
                  onChange={e => setNewSkillProficiency(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddingSkill(false)}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all",
                    theme === 'dark' ? "border-white/10 text-white/40 hover:bg-white/5" : "border-slate-200 text-slate-400 hover:bg-slate-50"
                  )}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all shadow-xl",
                    theme === 'dark' ? "bg-purple-600 hover:bg-purple-500 shadow-purple-500/20" : "bg-slate-900 border-none shadow-slate-900/20"
                  )}
                >
                  Confirm Skill
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
