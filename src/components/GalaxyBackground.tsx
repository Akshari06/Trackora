import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function GalaxyBackground() {
  const { theme } = useTheme();
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: string; duration: string; delay: string }[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 0.5}px`,
      duration: `${Math.random() * 4 + 2}s`,
      delay: `${Math.random() * 5}s`,
    }));
    setStars(newStars);
  }, []);

  if (theme !== 'dark') return null;

  return (
    <div className="galaxy-bg fixed inset-0 z-[-1] pointer-events-none bg-[#030014]">
      {/* Dynamic Nebulas */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-900/10 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '10s' }} />
      <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-900/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '4s', animationDuration: '12s' }} />
      
      {/* Deep space gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent" />
      
      <div className="stars-container absolute inset-0 text-white">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star absolute bg-white rounded-full"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: 0.4,
              boxShadow: '0 0 4px rgba(255, 255, 255, 0.4)',
              animation: `twinkle ${star.duration} ease-in-out infinite`,
              animationDelay: star.delay
            } as any}
          />
        ))}
      </div>
    </div>
  );
}
