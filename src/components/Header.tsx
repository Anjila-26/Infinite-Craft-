"use client";

interface HeaderProps {
  darkMode: boolean;
  soundEnabled: boolean;
  onToggleDarkMode: () => void;
  onToggleSound: () => void;
  onClearCanvas: () => void;
}

export default function Header({
  darkMode,
  soundEnabled,
  onToggleDarkMode,
  onToggleSound,
  onClearCanvas,
}: HeaderProps) {
  return (
    <>
      {/* Top header with logo and title - stops before sidebar */}
      <header className="fixed top-0 left-0 right-[280px] flex items-start justify-between px-5 py-4 z-50">
        {/* Logo - top left */}
        <a
          href="#"
          className="text-xl font-bold tracking-tight text-black dark:text-white"
          style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
        >
          <span className="italic">NEAL</span><span className="text-gray-400 dark:text-gray-500">.</span>FUN
        </a>

        {/* Title - top right */}
        <div className="text-right">
          <div
            className="text-3xl font-light tracking-wide text-gray-600 dark:text-gray-300"
            style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
          >
            <span className="text-gray-300 dark:text-gray-600">|</span>nfinite
          </div>
          <div
            className="text-2xl font-semibold tracking-wide text-gray-900 dark:text-white -mt-1"
            style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
          >
            Craft
          </div>
        </div>
      </header>

      {/* Bottom left controls */}
      <div className="fixed bottom-4 left-4 flex items-center gap-1 z-50">
        {/* Dark mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="icon-btn"
          title={darkMode ? "Light mode" : "Dark mode"}
        >
          {darkMode ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>

        {/* Clear canvas button */}
        <button
          onClick={onClearCanvas}
          className="icon-btn"
          title="Clear canvas"
        >
          <svg
            className="w-5 h-5"
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

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className="icon-btn"
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
