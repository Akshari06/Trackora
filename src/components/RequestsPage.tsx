import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { SkillRequest, Student } from '../types';
import { 
  Inbox, 
  Plus, 
  MessageSquare, 
  Handshake, 
  Zap, 
  Search,
  CheckCircle2,
  X,
  Target
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function RequestsPage() {
  const { schoolId, profile, user } = useAuth();
  const { theme } = useTheme();
  const [requests, setRequests] = useState<SkillRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    skillName: '',
    type: 'NEED_HELP' as const,
    description: ''
  });

  useEffect(() => {
    if (!schoolId) return;

    const q = query(collection(db, 'skillRequests'), where('schoolId', '==', schoolId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SkillRequest)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'skillRequests');
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
      await addDoc(collection(db, 'skillRequests'), {
        ...formData,
        schoolId,
        studentId: user?.uid,
        studentName: profile?.name || 'Anonymous',
        status: 'OPEN',
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setFormData({ skillName: '', type: 'NEED_HELP', description: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const closeRequest = async (id: string) => {
    await updateDoc(doc(db, 'skillRequests', id), { status: 'CLOSED' });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Handshake className="text-purple-500" />
            Skill Exchange
          </h1>
          <p className="opacity-50">Exchange knowledge and find project collaborators.</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 rounded-2xl bg-purple-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
        >
          <Plus size={18} />
          New Listing
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.filter(r => r.status !== 'CLOSED').sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map((request) => (
          <motion.div 
            layout
            key={request.id}
            className={cn(
              "glass-card p-6 border group relative overflow-hidden",
              theme === 'dark' ? "border-white/10" : "bg-white border-slate-200"
            )}
          >
            <div className="flex items-center gap-4 mb-6">
               <div className={cn(
                 "w-12 h-12 rounded-2xl flex items-center justify-center",
                 request.type === 'NEED_HELP' ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
               )}>
                 {request.type === 'NEED_HELP' ? <Zap size={24} /> : <Target size={24} />}
               </div>
               <div>
                  <h3 className="font-bold">{request.skillName}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    {request.type === 'NEED_HELP' ? 'Needs Help' : 'Offering Help'}
                  </p>
               </div>
            </div>

            <p className="text-sm opacity-60 mb-8 min-h-[40px]">
              {request.description || `Looking for ${request.skillName} ${request.type === 'NEED_HELP' ? 'mentorship' : 'opportunities'}...`}
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold">
                   {request.studentName[0]}
                </div>
                <span className="text-xs font-bold">{request.studentName}</span>
              </div>
              
              {request.studentId === user?.uid ? (
                <button 
                  onClick={() => closeRequest(request.id!)}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              ) : (
                <button className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-purple-600 text-white shadow-lg shadow-purple-500/20 active:scale-95 transition-all">
                  Connect
                </button>
              )}
            </div>

            {/* Background Accent */}
            <div className={cn(
              "absolute -top-10 -right-10 w-24 h-24 blur-[40px] opacity-20 transition-all group-hover:scale-150",
              request.type === 'NEED_HELP' ? "bg-red-500" : "bg-green-500"
            )} />
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
                <h2 className="text-2xl font-bold italic tracking-tighter">CREATE LISTING</h2>
                <button type="button" onClick={() => setIsModalOpen(false)}><X /></button>
              </div>

              <div className="space-y-6">
                 <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-40 mb-2 block">Listing Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'NEED_HELP', label: 'Need Help', icon: Zap },
                      { id: 'OFFER_HELP', label: 'Offer Help', icon: Target }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.id as any })}
                        className={cn(
                          "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                          formData.type === type.id 
                            ? "bg-purple-600/20 border-purple-500 text-purple-400" 
                            : "bg-white/5 border-white/10 opacity-40 hover:opacity-100"
                        )}
                      >
                        <type.icon size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-40 mb-2 block">Subject / Skill</label>
                  <input 
                    required 
                    type="text"
                    value={formData.skillName}
                    onChange={e => setFormData({ ...formData, skillName: e.target.value })}
                    placeholder="e.g. Data Structures, React, PCB Design"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-purple-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-widest opacity-40 mb-2 block">Short Description</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Briefly explain what you need or what you can offer..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-purple-500/50"
                  />
                </div>

                <button className="w-full py-4 rounded-xl bg-purple-600 text-white font-bold uppercase tracking-widest shadow-lg shadow-purple-500/20 active:scale-95 transition-all">
                  Post Listing
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
