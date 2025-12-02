export interface Element {
  id: string;
  name: string;
  emoji: string;
  discovered: boolean;
  isFirstDiscovery?: boolean;
}

export interface CanvasElement {
  id: string;
  elementId: string;
  x: number;
  y: number;
}

export interface CraftResult {
  result: string;
  emoji: string;
  isNew: boolean;
}

export interface GameState {
  elements: Element[];
  canvasElements: CanvasElement[];
  darkMode: boolean;
  soundEnabled: boolean;
}

