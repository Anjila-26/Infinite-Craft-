"use client";

import { useState, useMemo, useRef } from "react";
import { Element } from "@/types";

interface SidebarProps {
  elements: Element[];
  onElementClick: (element: Element) => void;
  onDeleteElement: (elementId: string) => void;
  // Mobile: custom touch drag-drop from sidebar to canvas
  onTouchDropFromSidebar?: (element: Element, clientX: number, clientY: number) => void;
}

type SortMode = "time" | "name" | "emoji" | "length" | "random";

export default function Sidebar({
  elements,
  onElementClick,
  onDeleteElement,
  onTouchDropFromSidebar,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("time");
  const [sortAscending, setSortAscending] = useState(true);
  const [touchDrag, setTouchDrag] = useState<{
    element: Element;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const lastDragTimeRef = useRef(0);

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
    let sorted = [...filteredElements];

    switch (sortMode) {
      case "time":
        // Keep discovery order (array order)
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "emoji":
        sorted.sort((a, b) => a.emoji.localeCompare(b.emoji));
        break;
      case "length":
        sorted.sort((a, b) => a.name.length - b.name.length);
        break;
      case "random":
        sorted.sort(() => Math.random() - 0.5);
        break;
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
      className="fixed inset-x-0 bottom-0 h-[220px] z-40 flex flex-col md:top-0 md:right-0 md:bottom-0 md:left-auto md:w-[280px] md:h-auto"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderTop: '1px solid var(--border-color)',
      }}
    >
      {/* Elements grid */}
      <div className="flex-1 overflow-y-auto p-3 pb-1">
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
                onClick={() => {
                  // Avoid ghost click right after a drag
                  if (Date.now() - lastDragTimeRef.current < 300) return;
                  handleElementClick(element);
                }}
                onTouchStart={(e) => {
                  if (deleteMode || !onTouchDropFromSidebar) return;
                  const touch = e.touches[0];
                  if (!touch) return;
                  setTouchDrag({
                    element,
                    x: touch.clientX,
                    y: touch.clientY,
                    moved: false,
                  });
                }}
                onTouchMove={(e) => {
                  if (!touchDrag || !onTouchDropFromSidebar) return;
                  const touch = e.touches[0];
                  if (!touch) return;
                  // Prevent scrolling when actually dragging
                  e.preventDefault();
                  setTouchDrag((prev) => {
                    if (!prev || prev.element.id !== element.id) return prev;
                    const dx = touch.clientX - prev.x;
                    const dy = touch.clientY - prev.y;
                    const moved = prev.moved || Math.hypot(dx, dy) > 4;
                    return {
                      element: prev.element,
                      x: touch.clientX,
                      y: touch.clientY,
                      moved,
                    };
                  });
                }}
                onTouchEnd={() => {
                  if (!touchDrag || !onTouchDropFromSidebar) {
                    setTouchDrag(null);
                    return;
                  }
                  if (touchDrag.moved) {
                    // Perform drop to canvas
                    onTouchDropFromSidebar(touchDrag.element, touchDrag.x, touchDrag.y);
                    lastDragTimeRef.current = Date.now();
                  } else {
                    // Treat as a tap
                    handleElementClick(element);
                  }
                  setTouchDrag(null);
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

      {/* Bottom bar with tabs + sort + delete */}
      <div
        className="relative flex items-center text-[11px]"
        style={{
          backgroundColor: "var(--sidebar-bg)",
          borderTop: "1px solid var(--border-color)",
        }}
      >
        {/* Discoveries label / button */}
        <button
          className="px-2 py-2 font-medium text-blue-500"
          style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
        >
          Discoveries
        </button>

        {/* Sort by menu trigger */}
        <div className="flex-1">
          <details className="relative">
            <summary
              className="flex items-center justify-center gap-1 px-2 py-2 cursor-pointer list-none select-none"
            >
              <span className="inline-flex items-center gap-1">
                <span className="text-[11px]">
                  {sortMode === "time" && "⏱"}
                  {sortMode === "name" && "A"}
                  {sortMode === "emoji" && "☺"}
                  {sortMode === "length" && "✎"}
                  {sortMode === "random" && "?"}
                </span>
                <span>
                  {sortMode === "time" && "Sort by time"}
                  {sortMode === "name" && "Sort by name"}
                  {sortMode === "emoji" && "Sort by emoji"}
                  {sortMode === "length" && "Sort by length"}
                  {sortMode === "random" && "Sort by random"}
                </span>
              </span>
              <svg
                className={`w-3 h-3 transform ${sortAscending ? "" : "rotate-180"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="absolute bottom-full mb-1 left-2 right-2 rounded-xl border bg-white text-[11px] shadow-lg dark:bg-[#111111] dark:border-[#272727]">
              <button
                className="flex w-full items-center gap-1 px-2 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  setSortMode("time");
                  (document.activeElement as HTMLElement | null)?.blur();
                }}
              >
                <span className="text-[11px]">
                  ⏱
                </span>
                <span>Sort by time</span>
              </button>
              <button
                className="flex w-full items-center gap-1 px-2 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  setSortMode("name");
                  (document.activeElement as HTMLElement | null)?.blur();
                }}
              >
                <span className="text-[11px]">
                  A
                </span>
                <span>Sort by name</span>
              </button>
              <button
                className="flex w-full items-center gap-1 px-2 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  setSortMode("emoji");
                  (document.activeElement as HTMLElement | null)?.blur();
                }}
              >
                <span className="text-[11px]">
                  ☺
                </span>
                <span>Sort by emoji</span>
              </button>
              <button
                className="flex w-full items-center gap-1 px-2 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  setSortMode("length");
                  (document.activeElement as HTMLElement | null)?.blur();
                }}
              >
                <span className="text-[11px]">
                  ✎
                </span>
                <span>Sort by length</span>
              </button>
              <button
                className="flex w-full items-center gap-1 px-2 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  setSortMode("random");
                  (document.activeElement as HTMLElement | null)?.blur();
                }}
              >
                <span className="text-[11px]">
                  ?
                </span>
                <span>Sort by random</span>
              </button>
            </div>
          </details>
        </div>

        {/* Asc / desc toggle */}
        <button
          onClick={() => setSortAscending(!sortAscending)}
          className="px-2 py-2"
          style={{ borderLeft: "1px solid var(--border-color)" }}
          title={sortAscending ? "Sort descending" : "Sort ascending"}
        >
          <svg
            className={`w-4 h-4 transition-transform ${
              sortAscending ? "" : "rotate-180"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>

        {/* Delete mode toggle */}
        <button
          onClick={() => setDeleteMode(!deleteMode)}
          className={`px-2 py-2 text-[11px] transition-colors ${
            deleteMode ? "text-red-500" : ""
          }`}
          style={{
            borderLeft: "1px solid var(--border-color)",
            backgroundColor: deleteMode
              ? "rgba(239, 68, 68, 0.1)"
              : undefined,
          }}
          title={deleteMode ? "Exit delete mode" : "Delete items"}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
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

      {/* Mobile drag ghost */}
      {touchDrag && touchDrag.moved && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: touchDrag.x,
            top: touchDrag.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="element">
            <span className="text-base pointer-events-none">{touchDrag.element.emoji}</span>
            <span className="pointer-events-none">{touchDrag.element.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}
