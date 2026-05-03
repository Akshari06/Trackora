import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { Student, Attendance } from '../types';
import { cn } from '../lib/utils';
import { Check, X, Minus, Save, Calendar, CheckSquare, Square, AlertTriangle, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';

export default function AttendancePage() {
  const { profile, schoolId } = useAuth();
  const { theme } = useTheme();
  const [students, setStudents] = useState<(Student & { attendancePercentage?: number })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      if (!schoolId) return;
      try {
        // Fetch students
        const q = query(collection(db, 'students'), where('schoolId', '==', schoolId));
        const snapshot = await getDocs(q);
        const studentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        
        // Fetch all attendance for percentage calculation
        const attendanceQ = query(collection(db, 'attendance'), where('schoolId', '==', schoolId));
        const attendanceSnap = await getDocs(attendanceQ);
        const allAttendance = attendanceSnap.docs.map(doc => doc.data() as Attendance);

        const studentsWithStats = studentData.map(student => {
          const studentAttendance = allAttendance.filter(a => a.studentId === student.id);
          const total = studentAttendance.length;
          const present = studentAttendance.filter(a => a.status === 'PRESENT').length;
          const percentage = total > 0 ? Math.round((present / total) * 100) : 100;
          return { ...student, attendancePercentage: percentage };
        });

        setStudents(studentsWithStats);
        
        // Initial state: all present
        const initialStates: Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'> = {};
        studentData.forEach(s => {
          if (s.id) initialStates[s.id] = 'PRESENT';
        });
        setAttendanceData(initialStates);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'students');
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [schoolId]);

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LEAVE') => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const toggleStudent = (studentId: string) => {
    const current = attendanceData[studentId];
    handleStatusChange(studentId, current === 'PRESENT' ? 'ABSENT' : 'PRESENT');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const batch = writeBatch(db);
      Object.entries(attendanceData).forEach(([studentId, status]) => {
        const attendanceRef = doc(collection(db, 'attendance'), `${studentId}_${date}`);
        batch.set(attendanceRef, {
          studentId,
          schoolId,
          date,
          status,
          recordedAt: serverTimestamp()
        });
      });
      await batch.commit();
      alert('Attendance saved successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'attendance');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const criticalCount = students.filter(s => (s.attendancePercentage || 0) < 75).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Attendance Hub</h1>
          <p className="text-xs uppercase font-black tracking-widest opacity-40 italic">Monitor and record daily consistency across the sector.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           {criticalCount > 0 && (
             <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                <AlertTriangle size={14} /> {criticalCount} Critical Units Identified
             </div>
           )}
           <div className={cn(
            "flex items-center gap-3 border px-5 py-3 rounded-2xl",
            theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
           )}>
              <Calendar className="w-4 h-4 text-purple-500" />
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="text-sm font-black uppercase tracking-widest focus:outline-none bg-transparent" 
              />
           </div>
           <button 
             onClick={handleSave}
             disabled={saving || students.length === 0}
             className={cn(
               "flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl",
               theme === 'dark' ? "bg-white text-black hover:bg-white/90 shadow-white/5" : "bg-slate-900 text-white shadow-slate-900/20"
             )}
           >
             <Save className="w-5 h-5" />
             {saving ? 'Syncing...' : 'Commit Records'}
           </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
         <div className={cn(
           "flex-1 flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all",
           theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
         )}>
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by Unit ID or Name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-sm font-bold w-full focus:outline-none"
            />
         </div>
         <div className="flex gap-4">
            <button onClick={() => students.forEach(s => s.id && handleStatusChange(s.id, 'PRESENT'))} className="text-[10px] font-black bg-green-500/10 text-green-500 border border-green-500/20 px-6 py-3 rounded-2xl hover:bg-green-500/20 transition-all uppercase tracking-widest flex items-center gap-2">
               <CheckSquare className="w-4 h-4" /> Global Present
            </button>
            <button onClick={() => students.forEach(s => s.id && handleStatusChange(s.id, 'ABSENT'))} className="text-[10px] font-black bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-3 rounded-2xl hover:bg-red-500/20 transition-all uppercase tracking-widest flex items-center gap-2">
               <X className="w-4 h-4" /> Global Absent
            </button>
         </div>
      </div>

      <div className={cn(
        "glass-card border overflow-hidden",
        theme === 'dark' ? "bg-white/[0.02] border-white/10 shadow-[0_0_20px_rgba(168,85,247,0.05)]" : "bg-white border-slate-200 shadow-sm"
      )}>
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className={cn(
                "border-b uppercase tracking-widest text-[10px] font-black italic opacity-40",
                theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"
              )}>
                <th className="px-8 py-6">Identity / Vital Signs</th>
                <th className="px-8 py-6">Sector Placement</th>
                <th className="px-8 py-6 text-center">Output Matrix</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y", theme === 'dark' ? "divide-white/5" : "divide-slate-50")}>
              {loading ? (
                <tr><td colSpan={3} className="px-8 py-20 text-center flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Retrieving Unit Logs...</p>
                </td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={3} className="px-8 py-20 text-center text-[10px] font-black uppercase tracking-widest opacity-20 italic">Search Negative. No matching units identified.</td></tr>
              ) : filteredStudents.map((student) => (
                <tr key={student.id} className={cn(
                  "transition-all cursor-pointer group",
                  theme === 'dark' ? "hover:bg-white/5" : "hover:bg-slate-50"
                )} onClick={() => student.id && toggleStudent(student.id)}>
                  <td className="px-8 py-8">
                    <div className="flex flex-col">
                       <span className="font-black italic tracking-tighter text-xl uppercase group-hover:text-purple-500 transition-colors">{student.name}</span>
                       <div className="flex items-center gap-2 mt-2">
                          <div className={cn(
                            "text-[10px] px-3 py-1 rounded-xl font-black uppercase tracking-widest italic border",
                            (student.attendancePercentage || 0) < 75 
                              ? "bg-red-500/10 text-red-500 border-red-500/20" 
                              : "bg-green-500/10 text-green-500 border-green-500/20"
                          )}>
                            {student.attendancePercentage || 0}% Consistent
                          </div>
                          {(student.attendancePercentage || 0) < 75 && (
                            <span className="flex items-center gap-1 text-red-500 text-[10px] font-black animate-pulse opacity-80 uppercase tracking-widest">
                               <AlertTriangle size={12} /> Critical Dip
                            </span>
                          )}
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <div className="flex flex-col gap-1">
                       <span className={cn("font-black text-xs uppercase tracking-widest italic", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                         {student.branch} | Year {student.year}
                       </span>
                       <span className="text-[9px] opacity-20 font-black uppercase tracking-[0.2em] italic">SN: {student.id?.slice(-8).toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-8" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-4">
                      {[
                        { id: 'PRESENT', icon: Check, activeBg: 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20 scale-110' },
                        { id: 'ABSENT', icon: X, activeBg: 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20 scale-110' },
                        { id: 'LEAVE', icon: Minus, activeBg: 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20 scale-110' }
                      ].map((status) => (
                        <button
                          key={status.id}
                          onClick={() => student.id && handleStatusChange(student.id, status.id as any)}
                          className={cn(
                            "w-12 h-12 rounded-3xl border transition-all flex items-center justify-center",
                            attendanceData[student.id!] === status.id 
                              ? status.activeBg
                              : theme === 'dark' ? "border-white/10 text-white/10 hover:border-white/20 hover:text-white/40 shadow-inner" : "border-slate-100 text-slate-200 hover:border-slate-200"
                          )}
                        >
                          <status.icon className="w-6 h-6" strokeWidth={3} />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
