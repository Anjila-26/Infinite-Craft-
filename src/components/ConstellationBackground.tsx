"use client";

import { useEffect, useState, useRef } from "react";
import { animate } from "animejs";

interface Star {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  targetX: number;
  targetY: number;
  color: 'white' | 'gray' | 'medium';
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
    // Random positions across the screen
    const initialX = seededRandom(i * 2) * 100;
    const initialY = seededRandom(i * 3) * 100;
    
      // Assign one of three colors with better distribution
      // Use a combination of index and random seed for more even distribution
      const colorSeed = (i + Math.floor(seededRandom(i * 17) * 10)) % 3;
      const color: 'white' | 'gray' | 'medium' = 
        colorSeed === 0 ? 'white' : 
        colorSeed === 1 ? 'gray' : 
        'medium';
      
      stars.push({
      id: i,
      x: initialX,
      y: initialY,
      // Ensure velocities are varied and not too small - range from -0.015 to 0.015
      vx: (seededRandom(i * 5) - 0.5) * 0.03,
      vy: (seededRandom(i * 7) - 0.5) * 0.03,
      size: seededRandom(i * 11) * 2 + 4, // Smaller dots: 4-6px
      targetX: initialX,
      targetY: initialY,
      color: color,
    });
  }
  
  return stars;
}

export default function ConstellationBackground() {
  const [stars] = useState<Star[]>(() => generateStars(60)); // More dots: 60
  const starsRef = useRef<Star[]>(stars);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const linesRef = useRef<Map<number, SVGLineElement>>(new Map());
  const lineIdCounterRef = useRef(0);
  const animationRefs = useRef<Set<any>>(new Set());
  const lineAnimationsRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    starsRef.current = stars;
  }, [stars]);

  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const starElements = Array.from(container.querySelectorAll('.star-floating')) as HTMLElement[];
    
    // Continuous animation loop for stars
    let animationFrameId: number;
    let lastUpdateTime = performance.now();
    
    const animateStars = (currentTime: number) => {
      const deltaTime = Math.min(currentTime - lastUpdateTime, 100); // Cap deltaTime to prevent large jumps
      lastUpdateTime = currentTime;
      
      // Update star positions continuously
      starsRef.current.forEach((star, index) => {
        // Calculate new position based on velocity (normalize to ~60fps)
        let newX = star.x + star.vx * (deltaTime / 16.67);
        let newY = star.y + star.vy * (deltaTime / 16.67);
        let newVx = star.vx;
        let newVy = star.vy;

        // Bounce off edges with proper boundary handling
        if (newX < 0) {
          newX = 0;
          newVx = Math.abs(star.vx); // Ensure positive velocity
        } else if (newX > 100) {
          newX = 100;
          newVx = -Math.abs(star.vx); // Ensure negative velocity
        }
        
        if (newY < 0) {
          newY = 0;
          newVy = Math.abs(star.vy); // Ensure positive velocity
        } else if (newY > 100) {
          newY = 100;
          newVy = -Math.abs(star.vy); // Ensure negative velocity
        }

        // Update star data
        starsRef.current[index] = {
          ...star,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          targetX: newX,
          targetY: newY,
        };

        // Update DOM position smoothly
        const element = starElements[index];
        if (element) {
          element.style.left = `${newX}%`;
          element.style.top = `${newY}%`;
        }
      });

      animationFrameId = requestAnimationFrame(animateStars);
    };

    // Start continuous animation
    animationFrameId = requestAnimationFrame(animateStars);

    // Update lines continuously using requestAnimationFrame for smooth updates
    let lastLineUpdate = 0;
    const lineUpdateInterval = 100; // Update lines every 100ms
    
    const updateLines = (timestamp: number) => {
      if (timestamp - lastLineUpdate < lineUpdateInterval) {
        requestAnimationFrame(updateLines);
        return;
      }
      lastLineUpdate = timestamp;

      const currentStars = starsRef.current;
      const activeLines = new Map<string, { x1: number; y1: number; x2: number; y2: number; opacity: number }>();
      const connectionDistance = 12; // Connection distance for lines

      for (let i = 0; i < currentStars.length; i++) {
        for (let j = i + 1; j < currentStars.length; j++) {
          const dx = currentStars[i].x - currentStars[j].x;
          const dy = currentStars[i].y - currentStars[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = 1 - distance / connectionDistance;
            const lineKey = `${i}-${j}`;
            activeLines.set(lineKey, {
              x1: currentStars[i].x,
              y1: currentStars[i].y,
              x2: currentStars[j].x,
              y2: currentStars[j].y,
              opacity: opacity * 0.4, // Line opacity based on distance
            });
          }
        }
      }

      // Remove lines that are no longer active
      const linesToRemove: number[] = [];
      linesRef.current.forEach((lineElement, lineId) => {
        const lineKey = lineElement.getAttribute('data-line-key');
        if (!lineKey || !activeLines.has(lineKey)) {
          linesToRemove.push(lineId);
          // Cancel existing animation if any
          const existingAnim = lineAnimationsRef.current.get(lineKey);
          if (existingAnim && typeof existingAnim.pause === 'function') {
            existingAnim.pause();
          }
          lineAnimationsRef.current.delete(lineKey);
          // Remove line immediately
          lineElement.remove();
        }
      });
      linesToRemove.forEach((id) => linesRef.current.delete(id));

      // Update existing lines or create new ones
      activeLines.forEach((lineData, lineKey) => {
        let lineElement: SVGLineElement | undefined;
        
        // Find existing line with this key
        linesRef.current.forEach((el) => {
          if (el.getAttribute('data-line-key') === lineKey) {
            lineElement = el;
          }
        });

        if (lineElement) {
          // Update line positions directly for smooth real-time updates
          lineElement.setAttribute('x1', `${lineData.x1}%`);
          lineElement.setAttribute('y1', `${lineData.y1}%`);
          lineElement.setAttribute('x2', `${lineData.x2}%`);
          lineElement.setAttribute('y2', `${lineData.y2}%`);
          lineElement.setAttribute('opacity', String(lineData.opacity));
        } else {
          // Create new line immediately
          const newLineId = lineIdCounterRef.current++;
          const newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          newLine.setAttribute('x1', `${lineData.x1}%`);
          newLine.setAttribute('y1', `${lineData.y1}%`);
          newLine.setAttribute('x2', `${lineData.x2}%`);
          newLine.setAttribute('y2', `${lineData.y2}%`);
          newLine.setAttribute('opacity', String(lineData.opacity));
          newLine.setAttribute('data-line-key', lineKey);
          newLine.setAttribute('class', 'stroke-gray-400 dark:stroke-gray-600');
          newLine.setAttribute('stroke-width', '1.5'); // Thicker lines
          svg.appendChild(newLine);
          linesRef.current.set(newLineId, newLine);
        }
      });

      // Schedule next update
      requestAnimationFrame(updateLines);
    };

    // Start line updates - call immediately first, then continue with requestAnimationFrame
    updateLines(performance.now());
    requestAnimationFrame(updateLines);

    return () => {
      // Cleanup animations
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      animationRefs.current.forEach((anim) => {
        if (anim && typeof anim.pause === 'function') {
          anim.pause();
        }
      });
      animationRefs.current.clear();
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Constellation lines */}
      <svg ref={svgRef} className="absolute inset-0 w-full h-full" />

      {/* Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className={`star-floating star-${star.color}`}
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

