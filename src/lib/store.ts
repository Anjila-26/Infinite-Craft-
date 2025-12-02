"use client";

import { Element, CanvasElement } from "@/types";

// Initial elements
export const INITIAL_ELEMENTS: Element[] = [
  { id: "water", name: "Water", emoji: "💧", discovered: true },
  { id: "fire", name: "Fire", emoji: "🔥", discovered: true },
  { id: "wind", name: "Wind", emoji: "🌬️", discovered: true },
  { id: "earth", name: "Earth", emoji: "🌍", discovered: true },
];

// Local storage keys
const ELEMENTS_KEY = "infinite-craft-elements";
const DARK_MODE_KEY = "infinite-craft-dark-mode";
const SOUND_KEY = "infinite-craft-sound";
const DISCOVERED_KEY = "infinite-craft-discovered";

// Get elements from localStorage
export function getStoredElements(): Element[] {
  if (typeof window === "undefined") return INITIAL_ELEMENTS;
  
  try {
    const stored = localStorage.getItem(ELEMENTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with initial elements to ensure base elements exist
      const elementMap = new Map<string, Element>();
      INITIAL_ELEMENTS.forEach(el => elementMap.set(el.id, el));
      parsed.forEach((el: Element) => elementMap.set(el.id, el));
      return Array.from(elementMap.values());
    }
  } catch (e) {
    console.error("Failed to load elements from localStorage", e);
  }
  
  return INITIAL_ELEMENTS;
}

// Save elements to localStorage (with deduplication)
export function saveElements(elements: Element[]): void {
  if (typeof window === "undefined") return;
  
  try {
    // Deduplicate by ID before saving
    const elementMap = new Map<string, Element>();
    elements.forEach(el => elementMap.set(el.id, el));
    const deduplicated = Array.from(elementMap.values());
    localStorage.setItem(ELEMENTS_KEY, JSON.stringify(deduplicated));
  } catch (e) {
    console.error("Failed to save elements to localStorage", e);
  }
}

// Get discovered combinations
export function getDiscoveredCombinations(): Set<string> {
  if (typeof window === "undefined") return new Set();
  
  try {
    const stored = localStorage.getItem(DISCOVERED_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (e) {
    console.error("Failed to load discovered combinations", e);
  }
  
  return new Set();
}

// Save discovered combination
export function saveDiscoveredCombination(combination: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const discovered = getDiscoveredCombinations();
    discovered.add(combination);
    localStorage.setItem(DISCOVERED_KEY, JSON.stringify(Array.from(discovered)));
  } catch (e) {
    console.error("Failed to save discovered combination", e);
  }
}

// Get dark mode setting
export function getDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const stored = localStorage.getItem(DARK_MODE_KEY);
    if (stored !== null) {
      return stored === "true";
    }
    // Default to system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (e) {
    console.error("Failed to load dark mode setting", e);
    return false;
  }
}

// Save dark mode setting
export function saveDarkMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(DARK_MODE_KEY, String(enabled));
  } catch (e) {
    console.error("Failed to save dark mode setting", e);
  }
}

// Get sound setting
export function getSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  
  try {
    const stored = localStorage.getItem(SOUND_KEY);
    return stored !== "false";
  } catch (e) {
    console.error("Failed to load sound setting", e);
    return true;
  }
}

// Save sound setting
export function saveSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(SOUND_KEY, String(enabled));
  } catch (e) {
    console.error("Failed to save sound setting", e);
  }
}

// Clear all data
export function clearAllData(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(ELEMENTS_KEY);
    localStorage.removeItem(DISCOVERED_KEY);
  } catch (e) {
    console.error("Failed to clear data", e);
  }
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create element ID from name
export function createElementId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

