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

// Generate stars in a repeating tile pattern
// Each tile is 2000x2000 units, and we generate multiple tiles
function generateStars(count: number, tileSize: number = 2000, tilesX: number = 3, tilesY: number = 3) {
  const stars: Star[] = [];
  let starId = 0;
  
  // Generate stars for each tile
  for (let tileY = 0; tileY < tilesY; tileY++) {
    for (let tileX = 0; tileX < tilesX; tileX++) {
      const tileOffsetX = tileX * tileSize;
      const tileOffsetY = tileY * tileSize;
      
      // Generate stars within this tile (same pattern for each tile)
      for (let i = 0; i < count; i++) {
        // Use unique seed per tile to ensure different positions
        const uniqueSeed = tileX * 1000 + tileY * 10000 + i;
        // Use tile-relative position (0 to tileSize) then add tile offset
        const tileXPos = seededRandom(uniqueSeed * 2) * tileSize;
        const tileYPos = seededRandom(uniqueSeed * 3) * tileSize;
        
        const initialX = tileOffsetX + tileXPos;
        const initialY = tileOffsetY + tileYPos;
        
        // Assign one of three colors with better distribution
        const colorSeed = (uniqueSeed + Math.floor(seededRandom(uniqueSeed * 17) * 10)) % 3;
        const color: 'white' | 'gray' | 'medium' = 
          colorSeed === 0 ? 'white' : 
          colorSeed === 1 ? 'gray' : 
          'medium';
        
        stars.push({
          id: starId++,
          x: initialX,
          y: initialY,
          vx: (seededRandom(uniqueSeed * 5) - 0.5) * 0.08,
          vy: (seededRandom(uniqueSeed * 7) - 0.5) * 0.08,
          size: seededRandom(uniqueSeed * 11) * 2 + 4,
          targetX: initialX,
          targetY: initialY,
          color: color,
        });
      }
    }
  }
  
  return stars;
}

export default function ConstellationBackground() {
  const tileSize = 2000; // Size of each repeating tile
  // Generate a smaller base pattern that repeats seamlessly
  // The modulo wrapping will make it appear infinite
  const tilesX = 5; // Number of tiles horizontally (covers 10,000px base pattern)
  const tilesY = 5; // Number of tiles vertically (covers 10,000px base pattern)
  const starsPerTile = 50; // Stars per tile (reduced for performance)
  
  // Use lazy initialization to prevent blocking
  const [stars] = useState<Star[]>(() => {
    return generateStars(starsPerTile, tileSize, tilesX, tilesY);
  });
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

    // Wait for stars to be rendered before starting animation
    const getStarElements = () => {
      return Array.from(container.querySelectorAll('.star-floating')) as HTMLElement[];
    };
    
    // Store tile dimensions for use in animation
    const totalWidth = tileSize * tilesX;
    const totalHeight = tileSize * tilesY;
    
    // Continuous animation loop for stars
    let animationFrameId: number;
    let lastUpdateTime = performance.now();
    
    const animateStars = (currentTime: number) => {
      const deltaTime = Math.min(currentTime - lastUpdateTime, 100); // Cap deltaTime to prevent large jumps
      lastUpdateTime = currentTime;
      
      // Get star elements fresh each frame (in case DOM changes)
      const starElements = getStarElements();
      
      // Update star positions continuously
      starsRef.current.forEach((star, index) => {
        // Calculate new position based on velocity (normalize to ~60fps)
        let newX = star.x + star.vx * (deltaTime / 16.67);
        let newY = star.y + star.vy * (deltaTime / 16.67);
        let newVx = star.vx;
        let newVy = star.vy;

        // Wrap around edges for infinite scrolling using modulo
        // This creates seamless tiling
        newX = ((newX % totalWidth) + totalWidth) % totalWidth;
        newY = ((newY % totalHeight) + totalHeight) % totalHeight;

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

        // Update DOM position smoothly (convert to pixels)
        const element = starElements[index];
        if (element) {
          element.style.left = `${newX}px`;
          element.style.top = `${newY}px`;
        }
      });

      animationFrameId = requestAnimationFrame(animateStars);
    };
    
    // Start animation after a small delay to ensure DOM is ready
    const startTimeout = setTimeout(() => {
      animationFrameId = requestAnimationFrame(animateStars);
    }, 100);

    // Animation will start after timeout

    // Update lines continuously using requestAnimationFrame for smooth updates
    let lastLineUpdate = 0;
    const lineUpdateInterval = 300; // Update lines every 300ms (slower for better performance)
    
    const updateLines = (timestamp: number) => {
      if (timestamp - lastLineUpdate < lineUpdateInterval) {
        requestAnimationFrame(updateLines);
        return;
      }
      lastLineUpdate = timestamp;

      const currentStars = starsRef.current;
      const activeLines = new Map<string, { x1: number; y1: number; x2: number; y2: number; opacity: number }>();
      const connectionDistance = 150; // Connection distance for lines (in pixels, increased for pixel coordinates)
      const connectionDistanceSq = connectionDistance * connectionDistance; // Use squared distance to avoid sqrt

      // Optimize: only check nearby stars (within connectionDistance * 2)
      const checkRadius = connectionDistance * 1.5; // Reduced check radius for better performance
      const checkRadiusSq = checkRadius * checkRadius;

      // Further optimization: limit the number of connections per star
      const maxConnectionsPerStar = 5;
      const starConnections = new Map<number, number>();

      for (let i = 0; i < currentStars.length; i++) {
        if (starConnections.get(i) && starConnections.get(i)! >= maxConnectionsPerStar) continue;
        
        for (let j = i + 1; j < currentStars.length; j++) {
          if (starConnections.get(j) && starConnections.get(j)! >= maxConnectionsPerStar) continue;
          
          const dx = currentStars[i].x - currentStars[j].x;
          const dy = currentStars[i].y - currentStars[j].y;
          
          // Quick check: skip if definitely too far (using squared distance)
          const distSq = dx * dx + dy * dy;
          if (distSq > checkRadiusSq) continue;
          
          // Check direct distance
          let distance = Math.sqrt(distSq);
          
          // Skip wrapped distance check for performance (only check if very close)
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
            
            // Track connections per star
            starConnections.set(i, (starConnections.get(i) || 0) + 1);
            starConnections.set(j, (starConnections.get(j) || 0) + 1);
          }
        }
      }

      // Remove lines that are no longer active
      const linesToRemove: number[] = [];
      linesRef.current.forEach((lineElement, lineId) => {
        const lineKeyAttr = lineElement.getAttribute('data-line-key');
        if (!lineKeyAttr || !activeLines.has(lineKeyAttr)) {
          linesToRemove.push(lineId);
          // Cancel existing animation if any
          const existingAnim = lineAnimationsRef.current.get(lineKeyAttr ?? '');
          if (existingAnim && typeof existingAnim.pause === 'function') {
            existingAnim.pause();
          }
          if (lineKeyAttr) {
            lineAnimationsRef.current.delete(lineKeyAttr);
          }
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
          // Update line positions directly for smooth real-time updates (convert to pixels)
          lineElement.setAttribute('x1', `${lineData.x1}`);
          lineElement.setAttribute('y1', `${lineData.y1}`);
          lineElement.setAttribute('x2', `${lineData.x2}`);
          lineElement.setAttribute('y2', `${lineData.y2}`);
          lineElement.setAttribute('opacity', String(lineData.opacity));
        } else {
          // Create new line immediately
          const newLineId = lineIdCounterRef.current++;
          const newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          newLine.setAttribute('x1', `${lineData.x1}`);
          newLine.setAttribute('y1', `${lineData.y1}`);
          newLine.setAttribute('x2', `${lineData.x2}`);
          newLine.setAttribute('y2', `${lineData.y2}`);
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
      clearTimeout(startTimeout);
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

  const totalWidth = tileSize * tilesX;
  const totalHeight = tileSize * tilesY;
  
  // Make the container very large for infinite scrolling
  // Stars will repeat seamlessly using modulo wrapping
  const infiniteWidth = 100000; // Large enough to feel infinite
  const infiniteHeight = 100000; // Large enough to feel infinite

  return (
    <div 
      ref={containerRef} 
      className="absolute pointer-events-none z-0"
      style={{
        width: `${infiniteWidth}px`,
        height: `${infiniteHeight}px`,
        top: 0,
        left: 0,
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent ${tileSize}px,
          transparent ${tileSize}px
        )`,
      }}
    >
      {/* Constellation lines */}
      <svg 
        ref={svgRef} 
        className="absolute w-full h-full"
        style={{
          width: `${infiniteWidth}px`,
          height: `${infiniteHeight}px`,
        }}
      />

      {/* Stars - use CSS transforms for infinite tiling effect */}
      {stars.map((star) => (
        <div
          key={star.id}
          className={`star-floating star-${star.color}`}
          style={{
            left: `${star.x}px`,
            top: `${star.y}px`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            // Create infinite tiling effect using CSS
            position: 'absolute',
          }}
        />
      ))}
    </div>
  );
}

