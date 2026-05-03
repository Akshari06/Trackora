import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Teacher, Student } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Teacher | Student | null;
  role: 'TEACHER' | 'STUDENT' | null;
  loading: boolean;
  schoolId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  schoolId: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Teacher | Student | null>(null);
  const [role, setRole] = useState<'TEACHER' | 'STUDENT' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Try teacher first
        const teacherDoc = await getDoc(doc(db, 'teachers', user.uid));
        if (teacherDoc.exists()) {
          setProfile({ id: teacherDoc.id, ...teacherDoc.data() } as Teacher);
          setRole('TEACHER');
        } else {
          // Try student
          const studentDoc = await getDoc(doc(db, 'students', user.uid));
          if (studentDoc.exists()) {
            setProfile({ id: studentDoc.id, ...studentDoc.data() } as Student);
            setRole('STUDENT');
          } else {
            setProfile(null);
            setRole(null);
          }
        }
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      role,
      loading, 
      schoolId: profile?.schoolId || null 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export async function createTeacherProfile(user: User, name: string, schoolName: string, department?: string, role?: string, institutionName?: string) {
  const schoolsRef = collection(db, 'schools');
  const schoolDocRef = doc(schoolsRef);
  await setDoc(schoolDocRef, {
    name: schoolName,
    subscriptionTier: 'FREE',
    createdAt: serverTimestamp(),
  });

  const teacherRef = doc(db, 'teachers', user.uid);
  const teacherData: Teacher = {
    schoolId: schoolDocRef.id,
    name: name,
    email: user.email || '',
    department,
    role,
    institutionName,
    isAdmin: true,
    createdAt: serverTimestamp(),
  };
  await setDoc(teacherRef, teacherData);
  
  return { schoolId: schoolDocRef.id, profile: teacherData };
}

export async function createStudentProfile(user: User, data: Partial<Student> & { schoolId: string }) {
  const studentRef = doc(db, 'students', user.uid);
  const studentData: Student = {
    schoolId: data.schoolId,
    classId: data.classId || 'unassigned',
    name: data.name || user.displayName || 'Anonymous Student',
    email: user.email || '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    age: data.age,
    gender: data.gender,
    branch: data.branch,
    year: data.year,
    skillsToLearn: data.skillsToLearn || [],
    skillsOffered: data.skillsOffered || [],
  } as Student;

  await setDoc(studentRef, studentData);
  return { schoolId: data.schoolId, profile: studentData };
}
