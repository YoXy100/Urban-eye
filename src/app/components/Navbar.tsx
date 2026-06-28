import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Bell, Search, ChevronDown, Zap, LogOut } from "lucide-react";
import { useApp } from "../context/AppContext";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Report Issue", href: "/report" },
  { label: "City Map", href: "/map" },
  { label: "Kanban", href: "/kanban" },
  { label: "Rewards", href: "/rewards" },
  { label: "Profile", href: "/profile" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, issues, logout, theme, toggleTheme } = useApp();
  const newIssues = issues.filter((i) => i.status === "new").length;
  const isBlueSteel = theme === "blue-steel";

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Fallback avatar when user has no photo
  const avatarSrc = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? "U")}&background=1E6BE6&color=fff&size=64`;
  const displayName = user?.name ?? "User";
  const displayPoints = user?.points ?? 0;

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[rgba(5,8,22,0.92)] backdrop-blur-xl border-b border-blue-500/10 shadow-[0_4px_32px_rgba(59,130,246,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.5)]"
            >
              <Zap size={16} className="text-white fill-white" />
            </motion.div>
            <span className="text-white font-bold text-lg tracking-tight">
              Urban<span className="text-blue-400">Eye</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-blue-500/15 border border-blue-500/25"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/8 bg-white/5 text-slate-400 text-sm hover:bg-white/8 hover:text-white transition-all duration-200">
              <Search size={13} />
              <span className="hidden lg:block text-xs">Search</span>
              <kbd className="hidden lg:block text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-slate-500">⌘K</kbd>
            </button>

            {/* ── Theme Toggle Button ── */}
            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.92 }}
              title={isBlueSteel ? "Switch to Default Theme" : "Switch to Blue Steel Theme"}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300"
              style={{
                background: isBlueSteel ? "#384959" : "rgba(255,255,255,0.05)",
                color: isBlueSteel ? "#BDDDFC" : "#94a3b8",
                borderColor: isBlueSteel ? "#6A89A7" : "rgba(255,255,255,0.08)",
              }}
            >
              <span className="text-sm">{isBlueSteel ? "☀️" : "🌊"}</span>
              <span className="hidden lg:block">{isBlueSteel ? "Default" : "Blue Steel"}</span>
            </motion.button>
            {/* ─────────────────────── */}

            {/* Notifications */}
            <div className="relative" data-dropdown>
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="relative w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <Bell size={15} />
                {newIssues > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-80 bg-[#0b1020] border border-blue-500/15 rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5">
                      <p className="text-sm font-semibold text-white">Notifications</p>
                      <p className="text-xs text-slate-400 mt-0.5">{newIssues} new issues in your area</p>
                    </div>
                    {[
                      { icon: "🚨", text: "Critical: Water main leak on Oak St", time: "2m ago" },
                      { icon: "✅", text: "Your issue #i6 has been resolved", time: "1h ago" },
                      { icon: "⬆️", text: "15 people upvoted your report", time: "3h ago" },
                    ].map((n, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors">
                        <span className="text-base mt-0.5">{n.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-200 leading-relaxed">{n.text}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar + profile dropdown */}
            <div className="relative" data-dropdown>
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 pl-1 rounded-lg hover:bg-white/5 px-2 py-1 transition-all"
              >
                <img
                  src={avatarSrc}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-blue-500/40 hover:border-blue-400 transition-colors"
                />
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-white leading-none">{displayName.split(" ")[0]}</p>
                  <p className="text-[10px] text-blue-400 mt-0.5">{displayPoints.toLocaleString()} pts</p>
                </div>
                <ChevronDown
                  size={12}
                  className={`text-slate-400 hidden lg:block transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-52 bg-[#0b1020] border border-blue-500/15 rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden py-1"
                  >
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email ?? ""}</p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="text-base">👤</span>
                      View profile
                    </Link>

                    <Link
                      to="/rewards"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="text-base">🏆</span>
                      Rewards
                    </Link>

                    <div className="border-t border-white/5 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-[rgba(5,8,22,0.97)] border-t border-white/5"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-500/15 text-white border border-blue-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border mt-1"
                style={{
                  background: isBlueSteel ? "#384959" : "rgba(255,255,255,0.05)",
                  color: isBlueSteel ? "#BDDDFC" : "#94a3b8",
                  borderColor: isBlueSteel ? "#6A89A7" : "rgba(255,255,255,0.08)",
                }}
              >
                <span>{isBlueSteel ? "☀️" : "🌊"}</span>
                {isBlueSteel ? "Switch to Default Theme" : "Switch to Blue Steel Theme"}
              </button>

              {/* Mobile sign out */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all mt-2 border-t border-white/5 pt-3"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}