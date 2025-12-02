"use client";

import { useEffect, useState, useRef } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
}

// Seeded random number generator for consistent initial positions
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate initial star positions with random velocities
function generateStars(count: number) {
  const stars: Star[] = [];
  
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: seededRandom(i * 2) * 100,
      y: seededRandom(i * 3) * 100,
      vx: (seededRandom(i * 5) - 0.5) * 0.005,
      vy: (seededRandom(i * 7) - 0.5) * 0.005,
      size: seededRandom(i * 11) * 2 + 2.5,
    });
  }
  
  return stars;
}

export default function ConstellationBackground() {
  const [stars, setStars] = useState<Star[]>(() => generateStars(120));
  const [lines, setLines] = useState<Line[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      // Throttle to ~60fps for smoother rendering
      if (deltaTime < 16) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      setStars((prevStars) => {
        const newStars = prevStars.map((star) => {
          let newX = star.x + star.vx;
          let newY = star.y + star.vy;
          let newVx = star.vx;
          let newVy = star.vy;

          // Bounce off edges
          if (newX <= 0 || newX >= 100) {
            newVx = -star.vx;
            newX = newX <= 0 ? 0 : 100;
          }
          if (newY <= 0 || newY >= 100) {
            newVy = -star.vy;
            newY = newY <= 0 ? 0 : 100;
          }

          return {
            ...star,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
          };
        });

        // Calculate lines between nearby stars
        const newLines: Line[] = [];
        const connectionDistance = 12;

        for (let i = 0; i < newStars.length; i++) {
          for (let j = i + 1; j < newStars.length; j++) {
            const dx = newStars[i].x - newStars[j].x;
            const dy = newStars[i].y - newStars[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
              const opacity = 1 - distance / connectionDistance;
              newLines.push({
                x1: newStars[i].x,
                y1: newStars[i].y,
                x2: newStars[j].x,
                y2: newStars[j].y,
                opacity: opacity * 0.3,
              });
            }
          }
        }

        setLines(newLines);
        return newStars;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Constellation lines */}
      <svg className="absolute inset-0 w-full h-full">
        {lines.map((line, index) => (
          <line
            key={index}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            className="stroke-gray-400 dark:stroke-gray-600"
            strokeWidth="0.5"
            opacity={line.opacity}
          />
        ))}
      </svg>

      {/* Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="star-floating"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
        />
      ))}
    </div>
  );
}

