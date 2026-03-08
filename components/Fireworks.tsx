'use client';

import { useEffect, useState } from 'react';

interface FireworksProps {
  trigger: boolean;
  duration?: number;
}

export default function Fireworks({ trigger, duration = 2000 }: FireworksProps) {
  const [show, setShow] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number; angle: number; distance: number }>>([]);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      
      // Generate random firework particles
      const newParticles: Array<{ id: number; x: number; y: number; color: string; delay: number; angle: number; distance: number }> = [];
      const colors = [
        'rgba(236, 72, 153, 1)',   // pink
        'rgba(168, 85, 247, 1)',   // purple
        'rgba(59, 130, 246, 1)',   // blue
        'rgba(251, 146, 60, 1)',   // orange
        'rgba(34, 197, 94, 1)',    // green
        'rgba(255, 215, 0, 1)',    // gold
      ];
      
      // Create multiple firework bursts at different positions (more celebratory)
      const burstPositions = [
        { x: 20, y: 25 }, { x: 50, y: 20 }, { x: 80, y: 25 },
        { x: 30, y: 45 }, { x: 50, y: 50 }, { x: 70, y: 45 },
        { x: 15, y: 70 }, { x: 50, y: 75 }, { x: 85, y: 70 },
      ];
      
      burstPositions.forEach((pos, burstIndex) => {
        const particleCount = 20 + Math.floor(Math.random() * 12); // 20-32 particles per burst
        
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3;
          const distance = 8 + Math.random() * 12;
          
          newParticles.push({
            id: burstIndex * 1000 + i,
            x: pos.x,
            y: pos.y,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: burstIndex * 150 + Math.random() * 50,
            angle: angle,
            distance: distance,
          });
        }
      });
      
      setParticles(newParticles);
      
      // Hide after duration
      const timer = setTimeout(() => {
        setShow(false);
        setParticles([]);
      }, duration);
      
      return () => clearTimeout(timer);
    } else {
      setShow(false);
      setParticles([]);
    }
  }, [trigger, duration]);

  if (!show || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden">
      {particles.map((particle) => {
        const endX = Math.cos(particle.angle) * particle.distance * 10;
        const endY = Math.sin(particle.angle) * particle.distance * 10;
        
        return (
          <div
            key={particle.id}
            className="absolute w-3 h-3 rounded-full animate-firework-explode"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: particle.color,
              boxShadow: `0 0 15px ${particle.color}, 0 0 30px ${particle.color}, 0 0 45px ${particle.color}`,
              animationDelay: `${particle.delay}ms`,
              '--end-x': `${endX}px`,
              '--end-y': `${endY}px`,
            } as React.CSSProperties & { '--end-x': string; '--end-y': string }}
          />
        );
      })}
    </div>
  );
}
