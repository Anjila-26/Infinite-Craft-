"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Element, CanvasElement } from "@/types";
import { generateId } from "@/lib/store";
import { soundManager } from "@/lib/sounds";

interface CanvasProps {
  canvasElements: CanvasElement[];
  elements: Element[];
  onAddElement: (element: CanvasElement) => void;
  onMoveElement: (id: string, x: number, y: number) => void;
  onRemoveElement: (id: string) => void;
  onCombineElements: (id1: string, id2: string) => void;
  // Combine a sidebar element (by element id) directly with a canvas element (by canvas id)
  onCombineSidebarWithElement: (
    sidebarElementId: string,
    canvasElementId: string
  ) => void;
  soundEnabled: boolean;
}

export default function Canvas({
  canvasElements,
  elements,
  onAddElement,
  onMoveElement,
  onRemoveElement,
  onCombineElements,
  onCombineSidebarWithElement,
  soundEnabled,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; elementX: number; elementY: number } | null>(null);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  // Get element data by id
  const getElementData = useCallback(
    (elementId: string) => {
      return elements.find((el) => el.id === elementId);
    },
    [elements]
  );

  // Find element that would be combined with
  const findCollidingElement = useCallback((draggingElement: CanvasElement) => {
    const collisionThreshold = 50;
    for (const element of canvasElements) {
      if (element.id === draggingElement.id) continue;

      const dx = Math.abs(element.x - draggingElement.x);
      const dy = Math.abs(element.y - draggingElement.y);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < collisionThreshold) {
        return element;
      }
    }
    return null;
  }, [canvasElements]);

  // Handle drop from sidebar - can drop on canvas or directly on element to combine
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Try both formats for compatibility
      let data = e.dataTransfer.getData("text/plain");
      if (!data) {
        data = e.dataTransfer.getData("element");
      }
      if (!data) return;

      try {
        const droppedElement = JSON.parse(data) as Element;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const dropX = e.clientX - rect.left;
        const dropY = e.clientY - rect.top;

        // Check if dropped on an existing element to combine
        const collisionThreshold = 60;
        for (const canvasEl of canvasElements) {
          const dx = Math.abs(canvasEl.x - dropX);
          const dy = Math.abs(canvasEl.y - dropY);
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < collisionThreshold) {
            // Dropped on an element - ask parent to combine sidebar element with this canvas element
            onCombineSidebarWithElement(droppedElement.id, canvasEl.id);
            return;
          }
        }

        // No collision - just add to canvas at drop location
        const newCanvasElement: CanvasElement = {
          id: generateId(),
          elementId: droppedElement.id,
          x: dropX,
          y: dropY,
        };

        onAddElement(newCanvasElement);
        
        if (soundEnabled && soundManager) {
          soundManager.playDrop();
        }
      } catch (err) {
        console.error("Failed to parse dropped element", err);
      }
    },
    [onAddElement, onCombineSidebarWithElement, canvasElements, soundEnabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // Handle dragging canvas elements - mouse down starts drag
  const handleElementMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    canvasElement: CanvasElement
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDraggingId(canvasElement.id);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elementX: canvasElement.x,
      elementY: canvasElement.y,
    });

    if (soundEnabled && soundManager) {
      soundManager.playPickup();
    }
  };

  // Global mouse move handler for smoother dragging
  useEffect(() => {
    if (!draggingId || !dragStart) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.mouseX;
      const deltaY = e.clientY - dragStart.mouseY;
      
      const newX = dragStart.elementX + deltaX;
      const newY = dragStart.elementY + deltaY;
      
      onMoveElement(draggingId, newX, newY);

      // Check for hover/collision with other elements
      const draggingElement = canvasElements.find((el) => el.id === draggingId);
      if (draggingElement) {
        const updatedDragging = { ...draggingElement, x: newX, y: newY };
        const collidingElement = findCollidingElement(updatedDragging);
        setHoveredElementId(collidingElement?.id || null);
      }
    };

    const handleGlobalMouseUp = () => {
      if (!draggingId) return;

      // Find current dragging element
      const draggingElement = canvasElements.find((el) => el.id === draggingId);
      if (!draggingElement) {
        setDraggingId(null);
        setDragStart(null);
        setHoveredElementId(null);
        return;
      }

      // 1) If released near sidebar edge, delete the element
      //    - On mobile: bottom sidebar → delete when near bottom of canvas
      //    - On desktop: right sidebar → delete when near right edge of canvas
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (canvasRect) {
        const isMobile = window.innerWidth < 768;
        const deleteMargin = 64; // pixels from edge

        const nearBottom = isMobile && draggingElement.y > canvasRect.height - deleteMargin;
        const nearRight = !isMobile && draggingElement.x > canvasRect.width - deleteMargin;

        if (nearBottom || nearRight) {
          onRemoveElement(draggingId);
          setDraggingId(null);
          setDragStart(null);
          setHoveredElementId(null);
          return;
        }
      }

      // 2) Otherwise, check for collision with other elements to combine
      const collidingElement = findCollidingElement(draggingElement);
      
      if (collidingElement) {
        onCombineElements(draggingId, collidingElement.id);
        setDraggingId(null);
        setDragStart(null);
        setHoveredElementId(null);
        return;
      }

      // 3) No delete or combine → just drop in place
      if (soundEnabled && soundManager) {
        soundManager.playDrop();
      }

      setDraggingId(null);
      setDragStart(null);
      setHoveredElementId(null);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [draggingId, dragStart, canvasElements, onMoveElement, onCombineElements, soundEnabled, findCollidingElement]);

  // Handle right-click to remove element
  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    onRemoveElement(id);
  };

  // Handle double-click to duplicate element
  const handleDoubleClick = (e: React.MouseEvent, canvasElement: CanvasElement) => {
    e.preventDefault();
    
    const newElement: CanvasElement = {
      id: generateId(),
      elementId: canvasElement.elementId,
      x: canvasElement.x + 30,
      y: canvasElement.y + 30,
    };
    
    onAddElement(newElement);
    
    if (soundEnabled && soundManager) {
      soundManager.playDrop();
    }
  };

  return (
    <div
      ref={canvasRef}
      className="fixed top-0 left-0 right-0 bottom-[260px] md:right-[280px] md:bottom-0 z-20"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {canvasElements.map((canvasElement) => {
        const elementData = getElementData(canvasElement.elementId);
        if (!elementData) return null;

        const isDragging = draggingId === canvasElement.id;
        const isHovered = hoveredElementId === canvasElement.id;

        return (
          <div
            key={canvasElement.id}
            className={`absolute select-none ${canvasElement.id.startsWith("new-") ? "new-element-animation" : ""}`}
            style={{
              left: canvasElement.x,
              top: canvasElement.y,
              transform: "translate(-50%, -50%)",
              zIndex: isDragging ? 1000 : isHovered ? 999 : 1,
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onMouseDown={(e) => handleElementMouseDown(e, canvasElement)}
            onContextMenu={(e) => handleContextMenu(e, canvasElement.id)}
            onDoubleClick={(e) => handleDoubleClick(e, canvasElement)}
            // Allow this element to receive drops from sidebar
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHoveredElementId(canvasElement.id);
            }}
            onDragLeave={() => {
              setHoveredElementId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setHoveredElementId(null);

              let data = e.dataTransfer.getData("text/plain");
              if (!data) data = e.dataTransfer.getData("element");
              if (!data) return;

              try {
                const droppedElement = JSON.parse(data) as Element;
                // Ask parent to combine this canvas element with the sidebar element
                onCombineSidebarWithElement(droppedElement.id, canvasElement.id);
              } catch (err) {
                console.error("Drop error:", err);
              }
            }}
          >
            <div 
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${
                isHovered 
                  ? "bg-blue-100 dark:bg-blue-900 border-2 border-blue-400 dark:border-blue-500 shadow-lg scale-110" 
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
              } ${isDragging ? "shadow-lg scale-105" : ""}`}
              style={{
                transition: isDragging ? "none" : "all 0.15s ease",
                pointerEvents: "none",
              }}
            >
              <span>{elementData.emoji}</span>
              <span className={isHovered ? "text-blue-700 dark:text-blue-300" : "text-gray-800 dark:text-gray-200"}>{elementData.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
