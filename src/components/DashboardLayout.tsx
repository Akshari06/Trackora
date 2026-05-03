import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Notification, Exam } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  BookOpen, 
  LogOut, 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  TrendingUp, 
  Zap, 
  Inbox,
  FolderLock,
  Menu,
  X,
  Database,
  Calendar,
  ChevronLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import GalaxyBackground from './GalaxyBackground';
import AIChatbot from './AIChatbot';

export default function DashboardLayout() {
  const { profile, user, schoolId, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!schoolId) return;

    // In a real app, we'd fetch from a notifications collection.
    // Here we'll derive some system notifications + fetch real exams as notifications
    const fetchAlerts = async () => {
      try {
        const examsBaseQ = collection(db, 'exams');
        let examsQ;
        
        if (role === 'STUDENT' && profile?.classId) {
          examsQ = query(examsBaseQ, where('schoolId', '==', schoolId), where('classId', '==', profile.classId), where('status', '==', 'UPCOMING'), orderBy('date', 'asc'), limit(5));
        } else {
          examsQ = query(examsBaseQ, where('schoolId', '==', schoolId), where('status', '==', 'UPCOMING'), orderBy('date', 'asc'), limit(5));
        }

        const examsSnap = await getDocs(examsQ);
        const upcomingExams = examsSnap.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            title: 'Upcoming Exam',
            message: `${data.subject} Exam scheduled on ${data.date}`,
            type: 'EXAM' as const,
            date: data.date,
            read: false,
            link: '/app/progress'
          };
        });

        setNotifications(upcomingExams);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAlerts();
  }, [schoolId, profile, role]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Board', path: '/app' },
    { icon: Users, label: 'Students', path: '/app/students' },
    { icon: TrendingUp, label: 'Metrics', path: '/app/progress' },
    { icon: Zap, label: 'Skills', path: '/app/skills' },
    { icon: FolderLock, label: 'Projects', path: '/app/projects' },
    { icon: BookOpen, label: 'Lessons', path: '/app/lessons' },
    { icon: CalendarCheck, label: 'Attendance', path: '/app/attendance' },
    { icon: Database, label: 'Engine', path: '/app/database' },
  ];

  return (
    <div className={cn("min-h-screen flex flex-col md:flex-row", theme === 'dark' ? "text-white" : "text-slate-900")}>
      <GalaxyBackground />
      <AIChatbot />
      
      {/* Mobile Header */}
      <header className={cn(
        "md:hidden h-16 px-4 border-b flex items-center justify-between sticky top-0 z-[60] transition-all",
        theme === 'dark' ? "bg-black/40 backdrop-blur-md border-white/10" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">T</div>
          <span className="font-display font-black tracking-tighter text-lg uppercase italic">TRACKORA</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-xl">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-xl">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar (Desktop & Mobile Overlay) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 border-r flex flex-col transition-all duration-300 transform md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        theme === 'dark' ? "bg-black/60 backdrop-blur-2xl border-white/10" : "bg-white border-slate-200"
      )}>
        <div className="p-8 pb-4">
          <div className="flex items-center gap-2 mb-10 hidden md:flex">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold",
              theme === 'dark' ? "bg-purple-600 shadow-lg shadow-purple-500/50" : "bg-brand-primary"
            )}>T</div>
            <span className={cn(
              "font-display text-xl font-black tracking-tight uppercase italic",
              theme === 'dark' && "text-white neon-text"
            )}>TRACKORA</span>
          </div>
          
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm uppercase tracking-wide",
                  theme === 'dark' 
                    ? "text-white/40 hover:bg-white/5 hover:text-white" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  isActive && (
                    theme === 'dark'
                      ? "bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                      : "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                  )
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className={cn(
          "mt-auto p-8 border-t space-y-4",
          theme === 'dark' ? "border-white/10" : "border-slate-100"
        )}>
          <div className="flex items-center gap-3 p-2 group">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden border transition-transform group-hover:scale-110",
              theme === 'dark' ? "bg-white/10 border-white/20" : "bg-slate-100 border-slate-200"
            )}>
               {user?.photoURL ? <img src={user.photoURL} alt="" /> : (profile?.name?.[0] || 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-bold truncate", theme === 'dark' ? "text-white" : "text-slate-900")}>{profile?.name}</p>
              <p className={cn("text-[10px] uppercase font-black tracking-widest opacity-40 truncate")}>{user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest",
              theme === 'dark' ? "text-white/40 hover:bg-red-500/10 hover:text-red-400" : "text-slate-600 hover:bg-red-50 hover:text-red-600"
            )}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen pb-20 md:pb-0 md:ml-72",
      )}>
        {/* Desktop Top Navbar */}
        <header className={cn(
          "hidden md:flex h-20 border-b sticky top-0 z-40 px-8 items-center justify-between transition-all duration-300",
          theme === 'dark' ? "bg-black/20 backdrop-blur-md border-white/10" : "bg-white/80 backdrop-blur-md border-slate-200"
        )}>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(-1)}
              className={cn(
                "p-2 rounded-xl border flex items-center gap-2 transition-all group",
                theme === 'dark' ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-slate-50"
              )}
            >
              <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Back</span>
            </button>
            <div className={cn(
              "flex items-center gap-4 px-4 py-2 rounded-2xl w-80 border transition-all",
              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"
            )}>
               <Search className="w-4 h-4 text-slate-400" />
               <input 
                type="search" 
                placeholder="Search matrix..." 
                className={cn(
                  "bg-transparent border-none text-sm w-full focus:outline-none",
                  theme === 'dark' ? "text-white placeholder:text-white/20" : "text-slate-900"
                )} 
               />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button
                onClick={toggleTheme}
                className={cn(
                  "w-10 h-10 rounded-2xl border flex items-center justify-center transition-all",
                  theme === 'dark' ? "bg-white/5 border-white/10 text-white hover:bg-white/10 shadow-[0_0_15px_rgba(168,85,247,0.1)]" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
             >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>
             
             <button className={cn(
                "w-10 h-10 rounded-2xl border flex items-center justify-center transition-all relative group",
                theme === 'dark' ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
             )}>
                <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900 group-hover:scale-110 transition-transform" />
                )}
                <div className="absolute top-full right-0 mt-2 w-72 glass-card p-4 opacity-0 group-hover:opacity-100 pointer-events-none translate-y-2 group-hover:translate-y-0 transition-all z-50">
                  <p className="text-[10px] uppercase font-black tracking-widest mb-3 opacity-40">System Relay Alerts</p>
                  <div className="space-y-2">
                    {notifications.length === 0 ? (
                       <p className="text-[10px] italic opacity-40 py-4 text-center">No active alerts from the sector.</p>
                    ) : notifications.map(notif => (
                      <button 
                        key={notif.id} 
                        onClick={() => notif.link && navigate(notif.link)}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border transition-all hover:scale-[1.02]",
                          theme === 'dark' ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                        )}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className={cn(
                            "font-bold uppercase italic tracking-tighter text-[9px]",
                            notif.type === 'EXAM' ? "text-purple-400" : (notif as any).type === 'ATTENDANCE' ? "text-red-400" : "opacity-80"
                          )}>{notif.title}</p>
                          <span className="text-[8px] opacity-30 font-bold">{notif.date.split('T')[0]}</span>
                        </div>
                        <p className="text-[10px] opacity-60 leading-tight">{notif.message}</p>
                      </button>
                    ))}
                  </div>
                </div>
             </button>

             <button 
                onClick={handleLogout}
                className={cn(
                  "flex items-center gap-3 px-6 py-2.5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border",
                  theme === 'dark' ? "bg-white/5 border-white/10 text-white hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400" : "bg-white border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-100 hover:text-red-600 shadow-sm"
                )}
             >
                <LogOut className="w-4 h-4" />
                Logout
             </button>
          </div>
        </header>
        
        <div className="p-4 md:p-8">
           <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 h-16 border-t flex items-center justify-around px-2 z-50 transition-all",
        theme === 'dark' ? "bg-black/60 backdrop-blur-2xl border-white/10" : "bg-white border-slate-200"
      )}>
        {navItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/app' && location.pathname === '/app/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                isActive 
                  ? "text-purple-500 scale-110" 
                  : "text-slate-500"
              )}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
