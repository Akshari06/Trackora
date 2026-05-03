import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, createTeacherProfile, createStudentProfile } from '../hooks/useAuth';
import { ArrowRight, School, User, GraduationCap, Briefcase, UserPlus, Mail, Building2, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import GalaxyBackground from './GalaxyBackground';

type Role = 'TEACHER' | 'STUDENT';

export default function Onboarding() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  // Teacher fields
  const [teacherName, setTeacherName] = useState(user?.displayName || '');
  const [schoolName, setSchoolName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [department, setDepartment] = useState('');
  const [teacherRole, setTeacherRole] = useState('');

  // Student fields
  const [studentName, setStudentName] = useState(user?.displayName || '');
  const [studentAge, setStudentAge] = useState('');
  const [studentGender, setStudentGender] = useState('Male');
  const [studentBranch, setStudentBranch] = useState('CSE');
  const [studentYear, setStudentYear] = useState('1st');
  const [schoolIdToJoin, setSchoolIdToJoin] = useState(''); 
  const [skills, setSkills] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !role) return;
    
    setLoading(true);
    try {
      if (role === 'TEACHER') {
        if (!teacherName || !schoolName) throw new Error('Missing fields');
        await createTeacherProfile(user, teacherName, schoolName, department, teacherRole, institutionName);
      } else {
        if (!studentName || !schoolIdToJoin) throw new Error('Missing fields');
        await createStudentProfile(user, {
          name: studentName,
          age: parseInt(studentAge),
          gender: studentGender,
          branch: studentBranch,
          year: studentYear,
          schoolId: schoolIdToJoin,
          skillsToLearn: skills.split(',').map(s => s.trim()).filter(s => s),
        });
      }
      navigate('/app');
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-6 relative overflow-hidden",
      theme === 'dark' ? "bg-[#030014]" : "bg-brand-secondary"
    )}>
      <GalaxyBackground />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "glass-card max-w-2xl w-full p-8 md:p-12 relative z-10 transition-all",
          theme === 'dark' ? "text-white" : "bg-white text-slate-900 border-slate-200"
        )}
      >
        <div className="flex items-center gap-2 mb-8">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold",
            theme === 'dark' ? "bg-purple-600 neon-border" : "bg-brand-primary"
          )}>P</div>
          <span className={cn(
            "font-display text-xl font-bold tracking-tight uppercase",
            theme === 'dark' && "neon-text"
          )}>TRACKORA</span>
        </div>

        {!role ? (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Welcome to Trackora</h1>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">To personalize your experience, please select your role below.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <button 
                onClick={() => setRole('TEACHER')}
                className={cn(
                  "p-8 rounded-3xl border-2 transition-all text-left flex flex-col gap-4 group",
                  theme === 'dark' 
                    ? "bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-white/10" 
                    : "bg-white border-slate-200 hover:border-brand-primary/50 hover:bg-slate-50"
                )}
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-500 transition-transform group-hover:scale-110">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">I'm a Teacher</h3>
                  <p className="text-sm text-slate-500 mt-1">Manage students, track progress, and use AI features.</p>
                </div>
              </button>

              <button 
                onClick={() => setRole('STUDENT')}
                className={cn(
                  "p-8 rounded-3xl border-2 transition-all text-left flex flex-col gap-4 group",
                  theme === 'dark' 
                    ? "bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-white/10" 
                    : "bg-white border-slate-200 hover:border-brand-primary/50 hover:bg-slate-50"
                )}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 transition-transform group-hover:scale-110">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">I'm a Student</h3>
                  <p className="text-sm text-slate-500 mt-1">Track your progress, view skills, and collaborate.</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <button 
              type="button"
              onClick={() => setRole(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
            >
              ← Back to role selection
            </button>

            <div className="space-y-6">
              <h1 className="text-3xl font-bold">
                {role === 'TEACHER' ? 'Set up your Classroom' : 'Create Student Profile'}
              </h1>

              {role === 'TEACHER' ? (
                <>
                  <div className="space-y-4">
                    <label className="text-sm font-bold opacity-60 flex items-center gap-2">
                       <User size={16} /> Name
                    </label>
                    <input 
                      type="text" 
                      value={teacherName} 
                      onChange={e => setTeacherName(e.target.value)}
                      placeholder="Your Full Name"
                      className={cn(
                        "w-full px-6 py-4 rounded-2xl border bg-transparent focus:outline-none focus:ring-2",
                        theme === 'dark' ? "border-white/10 focus:ring-purple-500" : "border-slate-200 focus:ring-brand-primary"
                      )}
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-bold opacity-60 flex items-center gap-2">
                       <School size={16} /> School Name
                    </label>
                    <input 
                      type="text" 
                      value={schoolName} 
                      onChange={e => setSchoolName(e.target.value)}
                      placeholder="e.g. St. Peters High"
                      className={cn(
                        "w-full px-6 py-4 rounded-2xl border bg-transparent focus:outline-none focus:ring-2",
                        theme === 'dark' ? "border-white/10 focus:ring-purple-500" : "border-slate-200 focus:ring-brand-primary"
                      )}
                      required
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-bold opacity-60 flex items-center gap-2">
                       <Building2 size={16} /> Institution (Optional)
                    </label>
                    <input 
                      type="text" 
                      value={institutionName} 
                      onChange={e => setInstitutionName(e.target.value)}
                      placeholder="e.g. Literacy Foundation"
                      className={cn(
                        "w-full px-6 py-4 rounded-2xl border bg-transparent focus:outline-none focus:ring-2",
                        theme === 'dark' ? "border-white/10 focus:ring-purple-500" : "border-slate-200 focus:ring-brand-primary"
                      )}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <label className="text-sm font-bold opacity-60">Department</label>
                      <input 
                        type="text" 
                        value={department} 
                        onChange={e => setDepartment(e.target.value)}
                        placeholder="e.g. Computer Science"
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border bg-transparent focus:outline-none focus:ring-2",
                          theme === 'dark' ? "border-white/10 focus:ring-purple-500" : "border-slate-200 focus:ring-brand-primary"
                        )}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-bold opacity-60">Role</label>
                      <input 
                        type="text" 
                        value={teacherRole} 
                        onChange={e => setTeacherRole(e.target.value)}
                        placeholder="e.g. Professor"
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border bg-transparent focus:outline-none focus:ring-2",
                          theme === 'dark' ? "border-white/10 focus:ring-purple-500" : "border-slate-200 focus:ring-brand-primary"
                        )}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <label className="text-sm font-bold opacity-60">Full Name</label>
                      <input 
                        type="text" 
                        value={studentName} 
                        onChange={e => setStudentName(e.target.value)}
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border bg-transparent focus:outline-none focus:ring-2",
                          theme === 'dark' ? "border-white/10 focus:ring-blue-500" : "border-slate-200 focus:ring-brand-primary"
                        )}
                        required
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-bold opacity-60">Year</label>
                      <select 
                        value={studentYear} 
                        onChange={e => setStudentYear(e.target.value)}
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border bg-transparent focus:outline-none focus:ring-2",
                          theme === 'dark' ? "border-white/10 focus:ring-blue-500" : "border-slate-200 focus:ring-brand-primary"
                        )}
                      >
                        <option value="1st">1st Year</option>
                        <option value="2nd">2nd Year</option>
                        <option value="3rd">3rd Year</option>
                        <option value="4th">4th Year</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <label className="text-sm font-bold opacity-60">Branch</label>
                      <input 
                        type="text" 
                        value={studentBranch} 
                        onChange={e => setStudentBranch(e.target.value)}
                        placeholder="e.g. CSE, ECE"
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border bg-transparent focus:outline-none focus:ring-2",
                          theme === 'dark' ? "border-white/10 focus:ring-blue-500" : "border-slate-200 focus:ring-brand-primary"
                        )}
                        required
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-bold opacity-60">Age</label>
                      <input 
                        type="number" 
                        value={studentAge} 
                        onChange={e => setStudentAge(e.target.value)}
                        className={cn(
                          "w-full px-6 py-4 rounded-2xl border bg-transparent focus:outline-none focus:ring-2",
                          theme === 'dark' ? "border-white/10 focus:ring-blue-500" : "border-slate-200 focus:ring-brand-primary"
                        )}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-bold opacity-60">Skills (Comma separated)</label>
                    <input 
                      type="text" 
                      value={skills} 
                      onChange={e => setSkills(e.target.value)}
                      placeholder="e.g. DSA, Web Dev, Python"
                      className={cn(
                        "w-full px-6 py-4 rounded-2xl border bg-transparent focus:outline-none focus:ring-2",
                        theme === 'dark' ? "border-white/10 focus:ring-blue-500" : "border-slate-200 focus:ring-brand-primary"
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-sm font-bold opacity-60">School ID to Join</label>
                    <input 
                      type="text" 
                      value={schoolIdToJoin} 
                      onChange={e => setSchoolIdToJoin(e.target.value)}
                      placeholder="Ask your teacher for the School ID"
                      className={cn(
                        "w-full px-6 py-4 rounded-2xl border bg-transparent focus:outline-none focus:ring-2",
                        theme === 'dark' ? "border-white/10 focus:ring-blue-500" : "border-slate-200 focus:ring-brand-primary"
                      )}
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all mt-8",
                theme === 'dark' 
                  ? "bg-white text-black shadow-lg" 
                  : "bg-slate-900 text-white shadow-lg"
              )}
            >
              {loading ? 'Processing...' : (
                <>
                  Complete Onboarding
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
