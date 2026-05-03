import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { Project, Student } from '../types';
import { 
  FolderLock, 
  Plus, 
  Trash2, 
  Edit2, 
  ExternalLink, 
  Users, 
  Clock, 
  CheckCircle2,
  X,
  Code
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ProjectsPage() {
  const { schoolId, role } = useAuth();
  const { theme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    techStack: '',
    status: 'ONGOING' as const,
    studentIds: [] as string[]
  });

  useEffect(() => {
    if (!schoolId) return;

    const q = query(collection(db, 'projects'), where('schoolId', '==', schoolId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    const fetchStudents = async () => {
      const snap = await getDocs(query(collection(db, 'students'), where('schoolId', '==', schoolId)));
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    };
    fetchStudents();

    return () => unsubscribe();
  }, [schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'projects'), {
        ...formData,
        techStack: formData.techStack.split(',').map(s => s.trim()).filter(s => s),
        schoolId,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setFormData({ name: '', description: '', techStack: '', status: 'ONGOING', studentIds: [] });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ONGOING' ? 'COMPLETED' : 'ONGOING';
    await updateDoc(doc(db, 'projects', id), { status: newStatus });
  };

  const deleteProject = async (id: string) => {
    if (confirm('Delete this project?')) {
      await deleteDoc(doc(db, 'projects', id));
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderLock className="text-purple-500" />
            Engineering Projects
          </h1>
          <p className="opacity-50">Manage development cycles and student collaborations.</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-purple-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
          >
            <Plus size={18} />
            New Project
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <motion.div 
            layout
            key={project.id}
            className={cn(
              "glass-card p-6 border group flex flex-col h-full",
              theme === 'dark' ? "border-white/10" : "bg-white border-slate-200"
            )}
          >
            <div className="flex justify-between items-start mb-4">
               <div className={cn(
                 "p-3 rounded-2xl",
                 project.status === 'COMPLETED' ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
               )}>
                 {project.status === 'COMPLETED' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
               </div>
               {role === 'TEACHER' && (
                 <button onClick={() => deleteProject(project.id!)} className="p-2 opacity-0 group-hover:opacity-100 text-red-500 transition-opacity">
                   <Trash2 size={16} />
                 </button>
               )}
            </div>

            <h3 className="text-xl font-bold mb-2">{project.name}</h3>
            <p className="text-sm opacity-60 mb-6 line-clamp-2 md:line-clamp-none h-12 md:h-auto">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {project.techStack.map((tech, i) => (
                <span key={i} className="px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                  {tech}
                </span>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
               <div className="flex -space-x-2">
                 {project.studentIds.slice(0, 3).map((sid, i) => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-purple-600 flex items-center justify-center text-[10px] font-bold">
                     {students.find(s => s.id === sid)?.name?.[0] || 'S'}
                   </div>
                 ))}
                 {project.studentIds.length > 3 && (
                   <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                     +{project.studentIds.length - 3}
                   </div>
                 )}
               </div>

               <button 
                onClick={() => toggleStatus(project.id!, project.status)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  project.status === 'COMPLETED' ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                )}
               >
                 {project.status}
               </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.form
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onSubmit={handleSubmit}
              className={cn(
                "relative w-full max-w-lg glass-card p-8 border",
                theme === 'dark' ? "border-white/10" : "bg-white"
              )}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">New Project</h2>
                <button type="button" onClick={() => setIsModalOpen(false)}><X /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-40 mb-2 block">Project Name</label>
                  <input 
                    required 
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-40 mb-2 block">Description</label>
                  <textarea 
                    required 
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-40 mb-2 block">Tech Stack (comma separated)</label>
                  <input 
                    type="text"
                    value={formData.techStack}
                    onChange={e => setFormData({ ...formData, techStack: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-40 mb-2 block">Assign Students</label>
                  <select 
                    multiple
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none h-32"
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const values = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                      setFormData({ ...formData, studentIds: values });
                    }}
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id} className="p-2 text-sm">{s.name} ({s.branch})</option>
                    ))}
                  </select>
                  <p className="text-[10px] opacity-40 mt-1">Hold Ctrl/Cmd to select multiple students.</p>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className={cn(
                      "flex-1 py-4 rounded-xl border font-bold uppercase tracking-widest transition-all",
                      theme === 'dark' ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/10" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    Back
                  </button>
                  <button className="flex-[2] py-4 rounded-xl bg-purple-600 text-white font-bold uppercase tracking-widest shadow-lg shadow-purple-500/20 active:scale-95 transition-all">
                    Launch Project
                  </button>
                </div>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
