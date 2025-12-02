"use client";

import { useState, useMemo } from "react";
import { Element } from "@/types";

interface SidebarProps {
  elements: Element[];
  onElementClick: (element: Element) => void;
  onDeleteElement: (elementId: string) => void;
}

type SortMode = "discoveries" | "time";

export default function Sidebar({ elements, onElementClick, onDeleteElement }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("discoveries");
  const [sortAscending, setSortAscending] = useState(true);

  const filteredElements = useMemo(() => {
    if (!searchQuery.trim()) return elements;
    const query = searchQuery.toLowerCase();
    return elements.filter(
      (el) =>
        el.name.toLowerCase().includes(query) ||
        el.emoji.includes(query)
    );
  }, [elements, searchQuery]);

  const sortedElements = useMemo(() => {
    const baseElementOrder = ["water", "fire", "wind", "earth"];
    
    let sorted = [...filteredElements];
    
    if (sortMode === "discoveries") {
      sorted.sort((a, b) => {
        const aBaseIndex = baseElementOrder.indexOf(a.id);
        const bBaseIndex = baseElementOrder.indexOf(b.id);
        const aIsBase = aBaseIndex !== -1;
        const bIsBase = bBaseIndex !== -1;
        
        if (aIsBase && bIsBase) return aBaseIndex - bBaseIndex;
        if (aIsBase && !bIsBase) return -1;
        if (!aIsBase && bIsBase) return 1;
        return a.name.localeCompare(b.name);
      });
    } else {
      sorted.sort((a, b) => {
        const aBaseIndex = baseElementOrder.indexOf(a.id);
        const bBaseIndex = baseElementOrder.indexOf(b.id);
        const aIsBase = aBaseIndex !== -1;
        const bIsBase = bBaseIndex !== -1;
        
        if (aIsBase && bIsBase) return aBaseIndex - bBaseIndex;
        if (aIsBase && !bIsBase) return -1;
        if (!aIsBase && bIsBase) return 1;
        return 0;
      });
    }
    
    return sortAscending ? sorted : [...sorted].reverse();
  }, [filteredElements, sortMode, sortAscending]);

  const handleElementClick = (element: Element) => {
    if (deleteMode) {
      const baseElements = ["water", "fire", "wind", "earth"];
      if (!baseElements.includes(element.id)) {
        onDeleteElement(element.id);
      }
    } else {
      onElementClick(element);
    }
  };

  return (
    <div 
      className="fixed top-0 right-0 bottom-0 w-[280px] z-40 flex flex-col"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderLeft: '1px solid var(--border-color)'
      }}
    >
      {/* Elements grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-wrap gap-2">
          {sortedElements.map((element) => {
            const isBaseElement = ["water", "fire", "wind", "earth"].includes(element.id);
            const deleteHighlight = deleteMode && !isBaseElement;
            
            return (
              <div
                key={element.id}
                role="button"
                tabIndex={0}
                draggable={!deleteMode}
                onDragStart={(e) => {
                  if (deleteMode) {
                    e.preventDefault();
                    return;
                  }
                  // Use text/plain for better browser compatibility
                  e.dataTransfer.setData("text/plain", JSON.stringify(element));
                  e.dataTransfer.effectAllowed = "all";
                }}
                onClick={(e) => {
                  // Don't trigger click if this was a drag
                  if (e.detail === 0) return;
                  handleElementClick(element);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleElementClick(element);
                  }
                }}
                className={`element cursor-grab active:cursor-grabbing hover:scale-105 transition-transform ${deleteMode && isBaseElement ? "opacity-50 cursor-not-allowed" : ""}`}
                style={deleteHighlight ? {
                  backgroundColor: '#fee2e2',
                  borderColor: '#fca5a5'
                } : undefined}
              >
                <span className="text-base pointer-events-none">{element.emoji}</span>
                <span className="pointer-events-none" style={deleteHighlight ? { color: '#dc2626' } : undefined}>
                  {element.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom bar with tabs */}
      <div 
        className="flex items-center"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderTop: '1px solid var(--border-color)'
        }}
      >
        <button
          onClick={() => setSortMode("discoveries")}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-xs font-medium transition-colors
            ${sortMode === "discoveries" ? "text-blue-500" : ""}`}
          style={sortMode === "discoveries" ? { backgroundColor: 'rgba(59, 130, 246, 0.1)' } : undefined}
        >
          <span>✨</span>
          <span>Discoveries</span>
        </button>
        
        <button
          onClick={() => setSortMode("time")}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-xs font-medium transition-colors
            ${sortMode === "time" ? "text-blue-500" : ""}`}
          style={sortMode === "time" ? { backgroundColor: 'rgba(59, 130, 246, 0.1)' } : undefined}
        >
          <span>🕐</span>
          <span>Time</span>
        </button>

        <button
          onClick={() => setSortAscending(!sortAscending)}
          className="px-3 py-2.5 transition-colors"
          style={{ borderLeft: '1px solid var(--border-color)' }}
          title={sortAscending ? "Sort descending" : "Sort ascending"}
        >
          <svg 
            className={`w-4 h-4 transition-transform ${sortAscending ? "" : "rotate-180"}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        <button
          onClick={() => setDeleteMode(!deleteMode)}
          className={`px-3 py-2.5 transition-colors ${deleteMode ? "text-red-500" : ""}`}
          style={{ 
            borderLeft: '1px solid var(--border-color)',
            backgroundColor: deleteMode ? 'rgba(239, 68, 68, 0.1)' : undefined
          }}
          title={deleteMode ? "Exit delete mode" : "Delete items"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder={`Search (${elements.length}) items...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input text-sm"
          />
        </div>
      </div>
    </div>
  );
}
