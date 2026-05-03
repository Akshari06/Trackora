import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Student } from '../types';
import { Plus, Search, MoreVertical, UserPlus, Trash2, Edit2, Users, MapPin, Hash, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

export default function StudentsPage() {
  const { schoolId, profile } = useAuth();
  const { theme } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [newStudent, setNewStudent] = useState({ 
    name: '', 
    classId: '', 
    rollNo: '',
    section: '',
    branch: 'CSE',
    year: '1st',
    parentPhone: '',
    age: '',
    gender: 'Other'
  });

  useEffect(() => {
    if (!schoolId) return;
    
    const q = query(collection(db, 'students'), where('schoolId', '==', schoolId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'students');
    });

    return () => unsubscribe();
  }, [schoolId]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;
    
    try {
      await addDoc(collection(db, 'students'), {
        ...newStudent,
        age: newStudent.age ? parseInt(newStudent.age) : null,
        schoolId,
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        skillsToLearn: [],
        skillsOffered: []
      });
      setShowModal(false);
      setNewStudent({ 
        name: '', 
        classId: '', 
        rollNo: '',
        section: '',
        branch: 'CSE',
        year: '1st',
        parentPhone: '', 
        age: '', 
        gender: 'Other' 
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'students');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    // Standard confirm is blocked in sandboxed iframes.
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.id) return;

    try {
      const studentRef = doc(db, 'students', editingStudent.id);
      await updateDoc(studentRef, {
        name: editingStudent.name,
        rollNo: editingStudent.rollNo,
        classId: editingStudent.classId,
        section: editingStudent.section,
        branch: editingStudent.branch,
        year: editingStudent.year,
        age: editingStudent.age,
        gender: editingStudent.gender,
        parentPhone: editingStudent.parentPhone
      });
      setShowEditModal(false);
      setEditingStudent(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `students/${editingStudent.id}`);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.classId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Students</h1>
          <p className="opacity-50">Manage student records, demographics, and skills.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 active:scale-95",
            theme === 'dark' ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "bg-slate-900 text-white"
          )}
        >
          <UserPlus className="w-5 h-5" />
          Add Student
        </button>
      </div>

      <div className={cn(
        "glass-card border overflow-hidden",
        theme === 'dark' ? "border-white/10" : "bg-white border-slate-200"
      )}>
        <div className={cn(
          "p-4 border-b flex items-center justify-between",
          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-slate-50 shadow-sm border-slate-100"
        )}>
           <div className={cn(
             "relative w-72 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
             theme === 'dark' ? "bg-white/5 border-white/10 focus-within:border-purple-500/50" : "bg-white border-slate-200"
           )}>
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search students..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none text-sm focus:outline-none" 
              />
           </div>
           <div className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] px-4">
              Total Count: {students.length}
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={cn(
                "border-b transition-colors",
                theme === 'dark' ? "border-white/5 bg-white/[0.02]" : "border-slate-100 bg-slate-50/50"
              )}>
                <th className="px-8 py-4 text-[10px] font-black opacity-40 uppercase tracking-widest">Name</th>
                <th className="px-8 py-4 text-[10px] font-black opacity-40 uppercase tracking-widest">Age/Gender</th>
                <th className="px-8 py-4 text-[10px] font-black opacity-40 uppercase tracking-widest">Class</th>
                <th className="px-8 py-4 text-[10px] font-black opacity-40 uppercase tracking-widest">Enrollment</th>
                <th className="px-8 py-4 text-[10px] font-black opacity-40 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-black opacity-40 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center opacity-30 italic">Syncing with database...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-20">
                     <Users className="w-12 h-12" />
                     <p className="font-bold">No students found.</p>
                  </div>
                </td></tr>
              ) : filteredStudents.map((student) => (
                <tr key={student.id} className={cn(
                  "transition-all group",
                  theme === 'dark' ? "hover:bg-white/5 text-white/80" : "hover:bg-slate-50 text-slate-700"
                )}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                         "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border",
                         theme === 'dark' ? "bg-white/5 border-white/10" : "bg-slate-100"
                       )}>
                         {student.name[0]}
                       </div>
                       <div>
                         <span className="font-bold block">{student.name}</span>
                         <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">{student.rollNo || 'No USN'}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                       <span className="font-medium">{student.age || '—'} Yrs</span>
                       <span className="text-[10px] opacity-40 uppercase font-black">{student.gender || 'Other'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 font-medium">
                    <div className="flex flex-col">
                       <span>{student.classId}</span>
                       <span className="text-[9px] opacity-40 uppercase font-black">{student.branch} | {student.year} Yr | Sec {student.section}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs opacity-50 font-mono">{student.enrollmentDate}</td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider",
                      student.status === 'ACTIVE' 
                        ? (theme === 'dark' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-green-50 text-green-600 border border-green-200") 
                        : "bg-slate-100 text-slate-400"
                    )}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => {
                          setEditingStudent(student);
                          setShowEditModal(true);
                        }}
                        className={cn(
                        "p-2 rounded-xl transition-all",
                        theme === 'dark' ? "hover:bg-white/10 text-white/50 hover:text-white" : "hover:bg-slate-100"
                      )}><Edit2 className="w-4 h-4" /></button>
                      <button 
                        onClick={() => student.id && handleDeleteStudent(student.id)}
                        className="p-2 hover:bg-red-500/10 rounded-xl text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={cn(
                "relative rounded-3xl shadow-2xl w-full max-w-lg p-8 md:p-10 z-10",
                theme === 'dark' ? "glass-card text-white border-white/20" : "bg-white text-slate-900 border-none"
              )}
            >
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <UserPlus size={24} className="text-purple-500" />
                Register New Student
              </h2>
              <form onSubmit={handleAddStudent} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest flex items-center gap-2">
                        <UserCircle size={12} /> Full Name
                      </label>
                      <input 
                        type="text" 
                        value={newStudent.name}
                        onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                        required
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2",
                          theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-purple-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                        )}
                        placeholder="Student Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest flex items-center gap-2">
                        <Hash size={12} /> Roll No / USN
                      </label>
                      <input 
                        type="text" 
                        value={newStudent.rollNo}
                        onChange={e => setNewStudent({...newStudent, rollNo: e.target.value})}
                        required
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2",
                          theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-purple-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                        )}
                        placeholder="e.g. 1RV21CS001"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Branch</label>
                      <select
                        value={newStudent.branch}
                        onChange={e => setNewStudent({...newStudent, branch: e.target.value})}
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2",
                          theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-purple-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                        )}
                      >
                         {['CSE', 'ISE', 'ECE', 'ME', 'CV', 'EEE', 'AI&ML'].map(b => (
                           <option key={b} value={b}>{b}</option>
                         ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Year</label>
                      <select
                        value={newStudent.year}
                        onChange={e => setNewStudent({...newStudent, year: e.target.value})}
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2",
                          theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-purple-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                        )}
                      >
                         {['1st', '2nd', '3rd', '4th'].map(y => (
                           <option key={y} value={y}>{y} Yr</option>
                         ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Section</label>
                      <input 
                        type="text" 
                        value={newStudent.section}
                        onChange={e => setNewStudent({...newStudent, section: e.target.value})}
                        placeholder="e.g. A"
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2 text-center",
                          theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-purple-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest flex items-center gap-2">
                         <Hash size={12} /> Age
                      </label>
                      <input 
                        type="number" 
                        value={newStudent.age}
                        onChange={e => setNewStudent({...newStudent, age: e.target.value})}
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2",
                          theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-purple-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                        )}
                        placeholder="Years"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Gender</label>
                      <select
                        value={newStudent.gender}
                        onChange={e => setNewStudent({...newStudent, gender: e.target.value})}
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2",
                          theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-purple-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                        )}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-40 uppercase tracking-widest flex items-center gap-2">
                       <MapPin size={12} /> Class Group
                    </label>
                    <input 
                      type="text" 
                      value={newStudent.classId}
                      onChange={e => setNewStudent({...newStudent, classId: e.target.value})}
                      required
                      className={cn(
                        "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2",
                        theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-purple-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                      )}
                      placeholder="e.g. CSE - 5th Sem"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className={cn(
                    "flex-1 py-4 rounded-2xl font-bold border transition-all",
                    theme === 'dark' ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"
                  )}>Cancel</button>
                  <button type="submit" className={cn(
                    "flex-1 py-4 rounded-2xl font-bold text-white transition-all shadow-xl",
                    theme === 'dark' ? "bg-purple-600 hover:bg-purple-500" : "bg-slate-900"
                  )}>Register Student</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {showEditModal && editingStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowEditModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={cn(
                "relative rounded-3xl shadow-2xl w-full max-w-lg p-8 md:p-10 z-10",
                theme === 'dark' ? "glass-card text-white border-white/20" : "bg-white text-slate-900 border-none"
              )}
            >
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Edit2 size={24} className="text-blue-500" />
                Update Student Matrix
              </h2>
              <form onSubmit={handleUpdateStudent} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Full Name</label>
                      <input 
                        type="text" 
                        value={editingStudent.name}
                        onChange={e => setEditingStudent({...editingStudent, name: e.target.value})}
                        required
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2",
                          theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-blue-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Roll No</label>
                      <input 
                        type="text" 
                        value={editingStudent.rollNo}
                        onChange={e => setEditingStudent({...editingStudent, rollNo: e.target.value})}
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2",
                          theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-blue-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Branch</label>
                      <select
                        value={editingStudent.branch}
                        onChange={e => setEditingStudent({...editingStudent, branch: e.target.value})}
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2",
                          theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-blue-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                        )}
                      >
                         {['CSE', 'ISE', 'ECE', 'ME', 'CV', 'EEE', 'AI&ML'].map(b => (
                           <option key={b} value={b}>{b}</option>
                         ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Year</label>
                       <select
                        value={editingStudent.year}
                        onChange={e => setEditingStudent({...editingStudent, year: e.target.value})}
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2",
                          theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-blue-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                        )}
                      >
                         {['1st', '2nd', '3rd', '4th'].map(y => (
                           <option key={y} value={y}>{y} Yr</option>
                         ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Section</label>
                      <input 
                        type="text" 
                        value={editingStudent.section}
                        onChange={e => setEditingStudent({...editingStudent, section: e.target.value})}
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2 text-center",
                          theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-blue-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Age</label>
                      <input 
                        type="number" 
                        value={editingStudent.age || ''}
                        onChange={e => setEditingStudent({...editingStudent, age: e.target.value ? parseInt(e.target.value) : 0})}
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2",
                          theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-blue-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Gender</label>
                      <select
                        value={editingStudent.gender}
                        onChange={e => setEditingStudent({...editingStudent, gender: e.target.value})}
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2",
                          theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-blue-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                        )}
                      >
                         <option value="Male">Male</option>
                         <option value="Female">Female</option>
                         <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                   <div className="space-y-2">
                    <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">Class Group</label>
                    <input 
                      type="text" 
                      value={editingStudent.classId}
                      onChange={e => setEditingStudent({...editingStudent, classId: e.target.value})}
                      required
                      className={cn(
                        "w-full px-6 py-4 rounded-2xl border transition-all focus:outline-none focus:ring-2",
                        theme === 'dark' ? "bg-white/5 border-white/10 focus:ring-blue-500" : "bg-slate-50 border-slate-200 focus:ring-brand-primary"
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className={cn(
                    "flex-1 py-4 rounded-2xl font-bold border transition-all",
                    theme === 'dark' ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"
                  )}>Cancel</button>
                  <button type="submit" className={cn(
                    "flex-1 py-4 rounded-2xl font-bold text-white transition-all shadow-xl bg-blue-600 hover:bg-blue-500"
                  )}>Update Entry</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
