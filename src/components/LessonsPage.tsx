import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Lesson, Class } from '../types';
import { BookOpen, Calendar, Clock, Plus, Book, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

export default function LessonsPage() {
  const { profile, schoolId } = useAuth();
  const { theme } = useTheme();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newLesson, setNewLesson] = useState({ classId: '', topic: '', type: 'THEORY' as 'THEORY' | 'LAB', coveredTopics: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });

  useEffect(() => {
    async function fetchData() {
      if (!schoolId || !profile) return;
      try {
        // Fetch classes to select from
        const classesQ = query(collection(db, 'classes'), where('schoolId', '==', schoolId));
        const classesSnap = await getDocs(classesQ);
        const classesData = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
        setClasses(classesData);
        if (classesData.length > 0 && !newLesson.classId) {
          setNewLesson(prev => ({ ...prev, classId: classesData[0].id || '' }));
        }

        // Fetch lessons
        const lessonsQ = query(
          collection(db, 'lessons'), 
          where('schoolId', '==', schoolId),
          where('loggedBy', '==', profile.id || ''),
          orderBy('date', 'desc')
        );
        const lessonsSnap = await getDocs(lessonsQ);
        setLessons(lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [schoolId, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !schoolId) return;

    // Strict Date Validation
    const selectedDate = new Date(newLesson.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      alert("Temporal Error: Back-dating is restricted. Select current or future date.");
      return;
    }
    
    try {
      await addDoc(collection(db, 'lessons'), {
        ...newLesson,
        coveredTopics: newLesson.coveredTopics.split(',').map(t => t.trim()).filter(t => t !== ''),
        schoolId,
        loggedBy: profile.id,
        createdAt: serverTimestamp()
      });
      setShowForm(false);
      setNewLesson({ classId: classes[0]?.id || '', topic: '', type: 'THEORY', coveredTopics: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
      
      // Refresh lessons
      const lessonsQ = query(
        collection(db, 'lessons'), 
        where('schoolId', '==', schoolId),
        where('loggedBy', '==', profile.id || ''),
        orderBy('date', 'desc')
      );
      const lessonsSnap = await getDocs(lessonsQ);
      setLessons(lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson)));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'lessons');
    }
  };

  return (
    <div className={cn(
      "space-y-8 min-h-[calc(100vh-140px)] rounded-3xl transition-colors duration-300",
      theme === 'dark' ? "text-white" : "text-slate-900"
    )}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Lesson Logs</h1>
          <p className="text-xs uppercase font-black tracking-widest opacity-40">Sync classroom trajectory with institutional records.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
            showForm 
              ? theme === 'dark' ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-400"
              : theme === 'dark' ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "bg-brand-primary text-white"
          )}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Abort Entry' : 'Log New Lesson'}
        </button>
      </div>

      {showForm && (
        <div className={cn(
          "p-8 rounded-3xl border animate-in fade-in slide-in-from-top-4",
          theme === 'dark' ? "bg-white/[0.02] border-white/10 glass-card" : "bg-white border-slate-200 shadow-xl"
        )}>
           <h2 className="text-xl font-black italic tracking-tighter uppercase mb-8 flex items-center gap-2">
             <Plus className="text-purple-500" size={20} />
             Sector Output Log
           </h2>
           <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                 <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Target Sector / Class</label>
                 <div className="relative">
                   <input 
                      list="class-options"
                      value={newLesson.classId}
                      onChange={e => setNewLesson({...newLesson, classId: e.target.value})}
                      placeholder="Identify or Type Sector..."
                      className={cn(
                        "w-full rounded-2xl px-5 py-4 focus:outline-none border transition-all text-sm font-bold",
                        theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                      )}
                      required
                   />
                   <datalist id="class-options">
                      {classes.map(c => (
                        <option key={c.id} value={c.name} />
                      ))}
                      {classes.length === 0 && (
                        <option value="General Sector 1" />
                      )}
                   </datalist>
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Timestamp</label>
                 <input 
                   type="date" 
                   value={newLesson.date}
                   min={format(new Date(), 'yyyy-MM-dd')}
                   onChange={e => setNewLesson({...newLesson, date: e.target.value})}
                   className={cn(
                    "w-full rounded-2xl px-5 py-4 border transition-all text-sm font-bold",
                    theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                   )}
                   required
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Session Type</label>
                 <div className="flex gap-2">
                    {['THEORY', 'LAB'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewLesson({ ...newLesson, type: t as any })}
                        className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                          newLesson.type === t 
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                            : theme === 'dark' ? 'bg-white/5 border border-white/10 text-white/40' : 'bg-white border border-slate-200 text-slate-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                 <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Detailed Spectrum (Comma Separated)</label>
                 <input 
                   type="text" 
                   value={newLesson.coveredTopics}
                   onChange={e => setNewLesson({...newLesson, coveredTopics: e.target.value})}
                   placeholder="e.g. Loops, Arrays, Sorting"
                   className={cn(
                    "w-full rounded-2xl px-5 py-4 border transition-all text-sm font-bold",
                    theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
                   )}
                 />
              </div>
              <div className="md:col-span-2 space-y-3">
                 <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Core Objective</label>
                 <input 
                   type="text" 
                   value={newLesson.topic}
                   onChange={e => setNewLesson({...newLesson, topic: e.target.value})}
                   placeholder="e.g. Sequential Logic Design"
                   className={cn(
                    "w-full rounded-2xl px-5 py-4 border transition-all text-sm font-bold",
                    theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
                   )}
                   required
                 />
              </div>
              <div className="md:col-span-2 space-y-3">
                 <label className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Log Observations (Optional)</label>
                 <textarea 
                   value={newLesson.notes}
                   onChange={e => setNewLesson({...newLesson, notes: e.target.value})}
                   placeholder="Document notable performance dips or breakthrough moments..."
                   className={cn(
                    "w-full rounded-2xl px-5 py-4 h-32 resize-none border transition-all text-sm font-bold",
                    theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
                   )}
                 />
              </div>
              <div className="md:col-span-2 flex justify-end gap-4">
                 <button 
                   type="button" 
                   onClick={() => setShowForm(false)}
                   className={cn(
                     "px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all",
                     theme === 'dark' ? "border-white/10 text-white/40 hover:bg-white/5" : "border-slate-200 text-slate-400 hover:bg-slate-50"
                   )}
                 >
                   Back
                 </button>
                 <button type="submit" className={cn(
                   "px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl",
                   theme === 'dark' ? "bg-white text-black hover:bg-white/90" : "bg-slate-900 text-white"
                 )}>Commit Log Entry</button>
              </div>
           </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Retrieving Sector Logs...</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className={cn(
            "p-32 flex flex-col items-center gap-6 text-center border-2 border-dashed rounded-3xl opacity-20",
            theme === 'dark' ? "border-white/10" : "border-slate-200"
          )}>
             <BookOpen className="w-16 h-16" />
             <p className="text-xl font-black italic tracking-tighter uppercase">No Trajectory Logged</p>
          </div>
        ) : (
          lessons.map((lesson) => (
            <div key={lesson.id} className={cn(
               "glass-card p-8 flex flex-col md:flex-row md:items-center gap-8 group transition-all hover:translate-x-2",
               theme === 'dark' ? "border-white/10 bg-white/[0.02]" : "bg-white border-slate-200 shadow-sm"
            )}>
               <div className={cn(
                 "w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center transition-transform group-hover:rotate-6 shadow-inner",
                 theme === 'dark' ? "bg-white/5 text-purple-400" : "bg-slate-50 text-brand-primary"
               )}>
                  <BookOpen className="w-8 h-8 md:w-10 md:h-10" />
               </div>
               <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                     <span className={cn(
                       "text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest italic border",
                       theme === 'dark' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-slate-100 text-brand-primary border-slate-200"
                     )}>
                        {classes.find(c => c.id === lesson.classId)?.name || 'General Sector'}
                     </span>
                     {lesson.type && (
                       <span className={cn(
                         "text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-widest border",
                         lesson.type === 'LAB' 
                           ? (theme === 'dark' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-600 border-amber-100")
                           : (theme === 'dark' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-600 border-blue-100")
                       )}>
                        {lesson.type}
                       </span>
                     )}
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-30 italic">
                        <Calendar className="w-3 h-3" />
                        {lesson.date}
                     </div>
                  </div>
                  <h3 className={cn(
                    "text-xl font-black italic tracking-tighter uppercase mb-3",
                    theme === 'dark' ? "text-white" : "text-slate-900"
                  )}>{lesson.topic}</h3>
                  {lesson.coveredTopics && lesson.coveredTopics.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                       {lesson.coveredTopics.map((t, idx) => (
                         <span key={idx} className={cn(
                           "text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-wider",
                           theme === 'dark' ? "bg-white/5 text-white/30" : "bg-slate-100 text-slate-500 text-opacity-60"
                         )}>#{t}</span>
                       ))}
                    </div>
                  )}
                  {lesson.notes && <p className="text-xs font-medium text-slate-500 italic opacity-60 leading-relaxed border-l-2 border-purple-500/20 pl-4">{lesson.notes}</p>}
               </div>
               <button className="opacity-0 group-hover:opacity-100 p-4 hover:bg-red-500/10 rounded-2xl text-slate-400 hover:text-red-500 transition-all">
                  <Trash2 className="w-5 h-5 transition-transform hover:scale-125" />
               </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
