"use client";

import { useState, useEffect, useCallback } from "react";
import { Element, CanvasElement } from "@/types";
import {
  getStoredElements,
  saveElements,
  getDarkMode,
  saveDarkMode,
  getSoundEnabled,
  saveSoundEnabled,
  generateId,
  createElementId,
} from "@/lib/store";
import { soundManager } from "@/lib/sounds";
import ConstellationBackground from "./ConstellationBackground";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Canvas from "./Canvas";
import ClearModal from "./ClearModal";

export default function Game() {
  const [elements, setElements] = useState<Element[]>([]);
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize state from localStorage
  useEffect(() => {
    setMounted(true);
    setElements(getStoredElements());
    setDarkMode(getDarkMode());
    setSoundEnabled(getSoundEnabled());
  }, []);

  // Update dark mode class on document
  useEffect(() => {
    if (!mounted) return;
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode, mounted]);

  // Update sound manager
  useEffect(() => {
    if (soundManager) {
      soundManager.setEnabled(soundEnabled);
    }
  }, [soundEnabled]);

  // Toggle dark mode
  const handleToggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const newValue = !prev;
      saveDarkMode(newValue);
      return newValue;
    });
  }, []);

  // Toggle sound
  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      saveSoundEnabled(newValue);
      return newValue;
    });
  }, []);

  // Add element to canvas
  const handleAddElement = useCallback((element: CanvasElement) => {
    setCanvasElements((prev) => [...prev, element]);
  }, []);

  // Move element on canvas
  const handleMoveElement = useCallback((id: string, x: number, y: number) => {
    setCanvasElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, x, y } : el))
    );
  }, []);

  // Remove element from canvas
  const handleRemoveElement = useCallback((id: string) => {
    setCanvasElements((prev) => prev.filter((el) => el.id !== id));
  }, []);

  // Delete element from discovered elements (sidebar)
  const handleDeleteElement = useCallback((elementId: string) => {
    // Don't delete base elements
    const baseElements = ["water", "fire", "wind", "earth"];
    if (baseElements.includes(elementId)) return;

    setElements((prev) => {
      const updated = prev.filter((el) => el.id !== elementId);
      saveElements(updated);
      return updated;
    });

    // Also remove from canvas
    setCanvasElements((prev) => prev.filter((el) => el.elementId !== elementId));

    if (soundEnabled && soundManager) {
      soundManager.playDrop();
    }
  }, [soundEnabled]);

  // Combine two elements
  const handleCombineElements = useCallback(
    async (id1: string, id2: string) => {
      const el1 = canvasElements.find((el) => el.id === id1);
      const el2 = canvasElements.find((el) => el.id === id2);

      if (!el1 || !el2) return;

      const elementData1 = elements.find((el) => el.id === el1.elementId);
      const elementData2 = elements.find((el) => el.id === el2.elementId);

      if (!elementData1 || !elementData2) return;

      try {
        const response = await fetch("/api/craft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            element1: elementData1.name,
            element2: elementData2.name,
          }),
        });

        const data = await response.json();

        if (data.result === "Nothing") {
          // Failed combination - if same elements, merge into one
          if (el1.elementId === el2.elementId) {
            const newX = (el1.x + el2.x) / 2;
            const newY = (el1.y + el2.y) / 2;
            
            setCanvasElements((prev) => {
              const filtered = prev.filter((el) => el.id !== id1 && el.id !== id2);
              return [...filtered, { ...el1, x: newX, y: newY }];
            });
            
            if (soundEnabled && soundManager) {
              soundManager.playCombine();
            }
          } else {
            if (soundEnabled && soundManager) {
              soundManager.playError();
            }
          }
          return;
        }

        // Calculate position for new element (average of combined elements)
        const newX = (el1.x + el2.x) / 2;
        const newY = (el1.y + el2.y) / 2;

        // Check if this is a new element
        const newElementId = createElementId(data.result);
        
        setElements((prev) => {
          // Check if already exists in current state
          const existingElement = prev.find((el) => el.id === newElementId);
          if (existingElement) {
            // Already exists, don't add duplicate
            if (soundEnabled && soundManager) {
              soundManager.playCombine();
            }
            return prev;
          }
          
          // New element discovered!
          const newElement: Element = {
            id: newElementId,
            name: data.result,
            emoji: data.emoji,
            discovered: true,
            isFirstDiscovery: true,
          };

          if (soundEnabled && soundManager) {
            soundManager.playDiscovery();
          }
          
          const updated = [...prev, newElement];
          saveElements(updated);
          return updated;
        });

        // Remove combined elements and add new one
        setCanvasElements((prev) => {
          const filtered = prev.filter((el) => el.id !== id1 && el.id !== id2);
          const newCanvasElement: CanvasElement = {
            id: `new-${generateId()}`,
            elementId: newElementId,
            x: newX,
            y: newY,
          };
          return [...filtered, newCanvasElement];
        });
      } catch (error) {
        console.error("Failed to combine elements", error);
        if (soundEnabled && soundManager) {
          soundManager.playError();
        }
      }
    },
    [canvasElements, elements, soundEnabled]
  );

  // Combine a sidebar element directly with a canvas element (drag from menu onto canvas item)
  const handleCombineSidebarWithElement = useCallback(
    async (sidebarElementId: string, canvasElementId: string) => {
      const targetCanvasEl = canvasElements.find((el) => el.id === canvasElementId);
      if (!targetCanvasEl) return;

      const elementData1 = elements.find((el) => el.id === sidebarElementId);
      const elementData2 = elements.find((el) => el.id === targetCanvasEl.elementId);

      if (!elementData1 || !elementData2) return;

      try {
        const response = await fetch("/api/craft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            element1: elementData1.name,
            element2: elementData2.name,
          }),
        });

        const data = await response.json();

        if (data.result === "Nothing") {
          // Failed combination - if same elements, keep single element on canvas
          if (sidebarElementId === targetCanvasEl.elementId) {
            if (soundEnabled && soundManager) {
              soundManager.playCombine();
            }
          } else {
            if (soundEnabled && soundManager) {
              soundManager.playError();
            }
          }
          return;
        }

        // Position for new element: same as target canvas element
        const newX = targetCanvasEl.x;
        const newY = targetCanvasEl.y;

        // Check if this is a new element
        const newElementId = createElementId(data.result);

        setElements((prev) => {
          const existingElement = prev.find((el) => el.id === newElementId);
          if (existingElement) {
            if (soundEnabled && soundManager) {
              soundManager.playCombine();
            }
            return prev;
          }

          const newElement: Element = {
            id: newElementId,
            name: data.result,
            emoji: data.emoji,
            discovered: true,
            isFirstDiscovery: true,
          };

          if (soundEnabled && soundManager) {
            soundManager.playDiscovery();
          }

          const updated = [...prev, newElement];
          saveElements(updated);
          return updated;
        });

        // Replace target canvas element with the new one
        setCanvasElements((prev) => {
          const filtered = prev.filter((el) => el.id !== canvasElementId);
          const newCanvasElement: CanvasElement = {
            id: `new-${generateId()}`,
            elementId: newElementId,
            x: newX,
            y: newY,
          };
          return [...filtered, newCanvasElement];
        });
      } catch (error) {
        console.error("Failed to combine sidebar and canvas elements", error);
        if (soundEnabled && soundManager) {
          soundManager.playError();
        }
      }
    },
    [canvasElements, elements, soundEnabled]
  );

  // Clear canvas
  const handleClearCanvas = useCallback(() => {
    setShowClearModal(true);
  }, []);

  const confirmClearCanvas = useCallback(() => {
    setCanvasElements([]);
    setShowClearModal(false);
  }, []);

  // Handle click on sidebar element - spawn at random position
  const handleElementClick = useCallback(
    (element: Element) => {
      // Generate random position within visible canvas area (accounting for sidebar on right)
      const canvasWidth = window.innerWidth - 280; // Subtract sidebar width
      const canvasHeight = window.innerHeight;
      
      // Add some padding from edges
      const padding = 80;
      const x = padding + Math.random() * (canvasWidth - 2 * padding);
      const y = padding + Math.random() * (canvasHeight - 2 * padding);

      const newCanvasElement: CanvasElement = {
        id: generateId(),
        elementId: element.id,
        x,
        y,
      };

      handleAddElement(newCanvasElement);

      if (soundEnabled && soundManager) {
        soundManager.playDrop();
      }
    },
    [handleAddElement, soundEnabled]
  );

  // Don't render until mounted (to avoid hydration issues)
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <ConstellationBackground />
      
      <Header
        darkMode={darkMode}
        soundEnabled={soundEnabled}
        onToggleDarkMode={handleToggleDarkMode}
        onToggleSound={handleToggleSound}
        onClearCanvas={handleClearCanvas}
      />

      <Canvas
        canvasElements={canvasElements}
        elements={elements}
        onAddElement={handleAddElement}
        onMoveElement={handleMoveElement}
        onRemoveElement={handleRemoveElement}
        onCombineElements={handleCombineElements}
        onCombineSidebarWithElement={handleCombineSidebarWithElement}
        soundEnabled={soundEnabled}
      />

      <Sidebar 
        elements={elements} 
        onElementClick={handleElementClick}
        onDeleteElement={handleDeleteElement}
      />

      <ClearModal
        isOpen={showClearModal}
        onConfirm={confirmClearCanvas}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
}
