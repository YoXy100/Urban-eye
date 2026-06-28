// ThemeToggle.tsx
// Drop this component anywhere in your Navbar

import { useApp } from "../context/AppContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useApp();
  const isBlueSteel = theme === "blue-steel";

  return (
    <button
      onClick={toggleTheme}
      title={isBlueSteel ? "Switch to Default Theme" : "Switch to Blue Steel Theme"}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-300"
      style={{
        background: isBlueSteel ? "#384959" : "#f3f3f5",
        color: isBlueSteel ? "#BDDDFC" : "#030213",
        borderColor: isBlueSteel ? "#6A89A7" : "rgba(0,0,0,0.1)",
      }}
    >
      {/* Sun icon for default, Moon/wave icon for blue-steel */}
      <span style={{ fontSize: "16px" }}>
        {isBlueSteel ? "☀️" : "🌊"}
      </span>
      <span>{isBlueSteel ? "Default" : "Blue Steel"}</span>
    </button>
  );
}