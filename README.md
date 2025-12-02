# Infinite Craft

A Next.js clone of [Infinite Craft](https://neal.fun/infinite-craft/) by Neal Agarwal. Combine elements to discover new creations using AI-powered generation.

## Features

- 🎮 **Drag & Drop Crafting**: Drag elements onto the canvas and combine them
- 🤖 **AI-Powered Generation**: Uses Google Gemini API to generate new elements in real-time
- 💾 **Local Storage**: Your discoveries are saved in your browser
- 🌓 **Dark Mode**: Toggle between light and dark themes
- 🔊 **Sound Effects**: Audio feedback for interactions
- 🔍 **Search**: Find elements quickly in your collection

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd infinite-craft
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. **Predefined Recipes**: The game includes 250+ predefined combinations (Water + Fire = Steam, etc.)
2. **AI Generation**: When you combine elements that don't have a recipe, the game uses Google Gemini API to generate a creative new element
3. **Local Storage**: All your discovered elements are saved in your browser's localStorage
4. **Same Element Merging**: Combining two identical elements without a recipe will merge them into one

## Gameplay

- **Click** elements in the sidebar to spawn them at random positions on the canvas
- **Drag** elements from the sidebar onto the canvas
- **Drag** elements on the canvas to move them around
- **Combine** elements by dragging one onto another (they'll highlight when ready to merge)
- **Right-click** to remove an element from the canvas
- **Double-click** to duplicate an element

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Gemini API** - AI-powered element generation

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key (required for AI generation)

## License

This project is a clone/remake for educational purposes.
