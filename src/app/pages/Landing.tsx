import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, useInView } from "motion/react";
import { ArrowRight, MapPin, TrendingUp, Shield, Users, Zap, BarChart3, Globe, ChevronRight, Star, Menu, X } from "lucide-react";
import ParticleCanvas from "../components/ParticleCanvas";
import { useApp } from "../context/AppContext";

function useCountUp(target: number, duration = 2000, trigger = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, trigger]);
  return count;
}

function StatCard({ value, label, suffix = "", prefix = "" }: { value: number; label: string; suffix?: string; prefix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useCountUp(value, 2000, inView);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="text-4xl md:text-5xl font-bold text-white tracking-tight">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-slate-400 text-sm mt-2 font-medium">{label}</div>
    </motion.div>
  );
}

const FEATURES = [
  { icon: MapPin, color: "#3b82f6", title: "Precise Location Reporting", description: "Pin exact issue locations on an interactive city map. Every report is geotagged with precise coordinates for faster dispatch." },
  { icon: TrendingUp, color: "#10b981", title: "Real-Time Progress Tracking", description: "Watch your reports move through the resolution pipeline with live status updates and transparent timelines." },
  { icon: Shield, color: "#8b5cf6", title: "Civic Intelligence", description: "AI-powered issue classification and priority scoring ensures the most critical problems get addressed first." },
  { icon: Users, color: "#06b6d4", title: "Community Amplification", description: "Upvote issues your neighbors care about. Collective voices create measurable government accountability." },
  { icon: BarChart3, color: "#f59e0b", title: "Data-Driven Governance", description: "Executive dashboards give city managers real-time analytics to allocate resources and measure performance." },
  { icon: Zap, color: "#ef4444", title: "Reward & Recognition", description: "Earn civic points, unlock badges, and rise through the leaderboard as you help build a better city." },
];

const TESTIMONIALS = [
  { quote: "Urban Eye completely transformed how our city handles citizen requests. Response time dropped by 60% in the first month.", name: "Mayor Patricia Collins", role: "City of Westfield", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=60&h=60&fit=crop&auto=format", stars: 5 },
  { quote: "Finally, a civic platform that feels like it was built in this decade. The interface is gorgeous and incredibly intuitive.", name: "Carlos Mendez", role: "Urban Planning Director", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&auto=format", stars: 5 },
  { quote: "Reported a pothole Monday, it was fixed by Thursday. This kind of accountability was unimaginable two years ago.", name: "Jessica Park", role: "Resident, Downtown District", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&auto=format", stars: 5 },
];

// ── Theme Toggle button (shared style for desktop + mobile) ──────────────────
function LandingThemeToggle({ isBlueSteel, toggleTheme, compact = false }: {
  isBlueSteel: boolean; toggleTheme: () => void; compact?: boolean;
}) {
  if (compact) {
    return (
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
    );
  }
  return (
    <button
      onClick={toggleTheme}
      title={isBlueSteel ? "Switch to Default Theme" : "Switch to Blue Steel Theme"}
      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300"
      style={{
        background: isBlueSteel ? "#384959" : "rgba(255,255,255,0.05)",
        color: isBlueSteel ? "#BDDDFC" : "#94a3b8",
        borderColor: isBlueSteel ? "#6A89A7" : "rgba(255,255,255,0.08)",
      }}
    >
      <span className="text-sm">{isBlueSteel ? "☀️" : "🌊"}</span>
      <span className="hidden lg:inline">{isBlueSteel ? "Default" : "Blue Steel"}</span>
    </button>
  );
}

function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useApp();
  const isBlueSteel = theme === "blue-steel";

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[rgba(5,8,22,0.92)] backdrop-blur-xl border-b border-blue-500/10" : "bg-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(59,130,246,0.5)]">
            <Zap size={15} className="text-white fill-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">Urban<span className="text-blue-400">Eye</span></span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <LandingThemeToggle isBlueSteel={isBlueSteel} toggleTheme={toggleTheme} />
          <Link to="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2">
            Sign In
          </Link>
          <Link to="/report" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-[0_0_16px_rgba(59,130,246,0.35)]">
            Get Started
          </Link>
        </div>
        <button onClick={() => setOpen(!open)} className="md:hidden text-slate-300 hover:text-white">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-[rgba(5,8,22,0.97)] border-t border-white/5 px-4 py-4 space-y-2">
          {[["Dashboard", "/dashboard"], ["Report Issue", "/report"], ["City Map", "/map"], ["Rewards", "/rewards"]].map(([label, href]) => (
            <Link key={href} to={href} onClick={() => setOpen(false)} className="block px-3 py-2.5 text-slate-300 hover:text-white text-sm font-medium rounded-xl hover:bg-white/5 transition-all">
              {label}
            </Link>
          ))}
          <LandingThemeToggle isBlueSteel={isBlueSteel} toggleTheme={toggleTheme} compact />
        </div>
      )}
    </motion.nav>
  );
}

function CityGrid() {
  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ perspective: "600px" }}>
      <motion.div
        animate={{ rotateX: 15, rotateY: [-5, 5, -5] }}
        transition={{ rotateY: { duration: 8, repeat: Infinity, ease: "easeInOut" } }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-80 h-80"
      >
        <svg viewBox="0 0 320 320" className="w-full h-full" style={{ filter: "drop-shadow(0 0 40px rgba(59,130,246,0.3))" }}>
          {[40, 80, 120, 160, 200, 240, 280].map(x => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="320" stroke="rgba(59,130,246,0.12)" strokeWidth="0.5" />
          ))}
          {[40, 80, 120, 160, 200, 240, 280].map(y => (
            <line key={`h${y}`} x1="0" y1={y} x2="320" y2={y} stroke="rgba(59,130,246,0.12)" strokeWidth="0.5" />
          ))}
          <rect x="0" y="148" width="320" height="24" fill="rgba(59,130,246,0.06)" />
          <rect x="148" y="0" width="24" height="320" fill="rgba(59,130,246,0.06)" />
          {[
            { x: 20, y: 20, w: 100, h: 100, color: "#3b82f6" },
            { x: 200, y: 20, w: 100, h: 60, color: "#06b6d4" },
            { x: 200, y: 100, w: 100, h: 40, color: "#06b6d4" },
            { x: 20, y: 200, w: 60, h: 100, color: "#8b5cf6" },
            { x: 100, y: 200, w: 40, h: 100, color: "#8b5cf6" },
            { x: 200, y: 200, w: 100, h: 100, color: "#10b981" },
          ].map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.color + "20"} rx="2" stroke={b.color + "40"} strokeWidth="1" />
              {Array.from({ length: Math.floor(b.h / 16) }).map((_, row) =>
                Array.from({ length: Math.floor(b.w / 16) }).map((_, col) => (
                  <rect key={`${row}-${col}`} x={b.x + 4 + col * 16} y={b.y + 4 + row * 16} width="8" height="8"
                    fill={b.color + "80"} rx="1" opacity={0.3 + Math.random() * 0.5} />
                ))
              )}
            </g>
          ))}
          <motion.line x1="160" y1="70" x2="160" y2="148" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 4"
            animate={{ strokeDashoffset: [0, -20] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
          <motion.line x1="160" y1="172" x2="160" y2="250" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 4"
            animate={{ strokeDashoffset: [0, -20] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
          <motion.line x1="70" y1="160" x2="148" y2="160" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4 4"
            animate={{ strokeDashoffset: [0, -20] }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
          <motion.line x1="172" y1="160" x2="250" y2="160" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4"
            animate={{ strokeDashoffset: [0, -20] }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }} />
          {[
            { cx: 70, cy: 70, color: "#3b82f6" },
            { cx: 250, cy: 50, color: "#ef4444" },
            { cx: 40, cy: 250, color: "#10b981" },
            { cx: 250, cy: 250, color: "#f59e0b" },
          ].map((m, i) => (
            <g key={i}>
              <motion.circle cx={m.cx} cy={m.cy} r="8" fill="none" stroke={m.color} strokeWidth="1"
                animate={{ r: [8, 20], opacity: [0.8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: i * 0.5 }} />
              <circle cx={m.cx} cy={m.cy} r="4" fill={m.color} opacity="0.9" />
            </g>
          ))}
        </svg>
      </motion.div>
    </div>
  );
}

export default function Landing() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-x-hidden">
      <LandingNav />

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0"><ParticleCanvas /></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center py-20 pt-28">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              Next-Generation Civic Platform
              <ChevronRight size={12} />
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              Building{" "}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">Smarter</span>
              <br />
              Cities{" "}
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Together</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="mt-6 text-lg text-slate-400 leading-relaxed max-w-xl">
              Report issues. Track progress. Transform communities through collaborative governance and data-driven civic intelligence.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="mt-8 flex flex-wrap gap-4">
              <Link to="/report" className="group flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-[0_0_24px_rgba(59,130,246,0.4)] hover:shadow-[0_0_36px_rgba(59,130,246,0.6)]">
                <MapPin size={16} /> Report Issue
                <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ArrowRight size={14} />
                </motion.span>
              </Link>
              <Link to="/dashboard" className="flex items-center gap-2 px-6 py-3 bg-white/8 hover:bg-white/12 text-white font-semibold rounded-xl border border-white/15 hover:border-white/25 transition-all duration-200 backdrop-blur-sm">
                <BarChart3 size={16} /> Explore Dashboard
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-2">
                {["photo-1507003211169-0a1dd7228f2d", "photo-1438761681033-6461ffad8d80", "photo-1500648767791-00dcc994a43e", "photo-1573496359142-b8d87734a5a2"].map((id, i) => (
                  <img key={i} src={`https://images.unsplash.com/${id}?w=40&h=40&fit=crop&auto=format`} alt="citizen"
                    className="w-8 h-8 rounded-full border-2 border-[#050816] object-cover" />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">24,800+ citizens</p>
                <p className="text-xs text-slate-400">actively making change</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="text-sm font-semibold text-white">92% resolution rate</p>
                <p className="text-xs text-slate-400">in partnered cities</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              transform: `perspective(800px) rotateY(${mousePos.x * 0.3}deg) rotateX(${-mousePos.y * 0.2}deg)`,
              transition: "transform 0.1s ease-out",
            }}
            className="relative h-96 lg:h-[520px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-cyan-500/10 rounded-3xl" />
            <div className="relative h-full rounded-3xl border border-blue-500/15 bg-[rgba(11,16,32,0.6)] backdrop-blur-sm overflow-hidden p-4">
              <CityGrid />
              {[
                { label: "Active Issues", value: "142", color: "#3b82f6", pos: "top-4 right-4" },
                { label: "Resolved Today", value: "28", color: "#10b981", pos: "bottom-4 left-4" },
                { label: "Response Time", value: "4.2h", color: "#f59e0b", pos: "bottom-4 right-4" },
              ].map((card, i) => (
                <motion.div key={i} className={`absolute ${card.pos} px-3 py-2 rounded-xl bg-[rgba(5,8,22,0.8)] border backdrop-blur-sm`}
                  style={{ borderColor: card.color + "30" }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}>
                  <div className="text-[10px] text-slate-400">{card.label}</div>
                  <div className="text-lg font-bold" style={{ color: card.color }}>{card.value}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <span className="text-xs text-slate-500 uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-slate-500 to-transparent" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-20 border-y border-white/5 bg-gradient-to-b from-[#050816] to-[#0b1020]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
            <StatCard value={24800} label="Active Citizens" suffix="+" />
            <StatCard value={187} label="Cities Partnered" />
            <StatCard value={1200000} label="Issues Resolved" suffix="+" />
            <StatCard value={92} label="Avg Resolution Rate" suffix="%" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-[#0b1020]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium mb-4">
              <Globe size={12} /> Platform Capabilities
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Everything your city needs</h2>
            <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">A comprehensive civic platform built for modern governance and empowered communities.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat, i) => (
              <motion.div key={feat.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }} whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative p-6 rounded-2xl border border-white/8 bg-[rgba(5,8,22,0.6)] backdrop-blur-sm hover:border-blue-500/25 hover:bg-[rgba(11,16,32,0.8)] transition-all duration-300">
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${feat.color}08, transparent 70%)` }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: feat.color + "18", border: `1px solid ${feat.color}30` }}>
                  <feat.icon size={18} style={{ color: feat.color }} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: feat.color }}>
                  Learn more <ChevronRight size={12} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-24 bg-[#050816]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">How it works</h2>
            <p className="mt-4 text-slate-400 text-lg">Three simple steps to a better city</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Report an Issue", desc: "Spot a problem? Submit a detailed report with photos, location pin, and category in under 2 minutes.", color: "#3b82f6" },
              { step: "02", title: "Community Validates", desc: "Neighbors upvote and comment. Issues with more support rise to the top of the resolution queue.", color: "#8b5cf6" },
              { step: "03", title: "City Takes Action", desc: "Officials receive prioritized reports and update status in real-time as issues get resolved.", color: "#10b981" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.15 }} className="relative text-center">
                <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl font-bold border"
                  style={{ background: `linear-gradient(135deg, ${item.color}20, ${item.color}08)`, borderColor: item.color + "30", color: item.color, boxShadow: `0 8px 32px ${item.color}20` }}>
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-[#0b1020]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">What cities are saying</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }} className="p-6 rounded-2xl border border-white/8 bg-[rgba(5,8,22,0.6)] backdrop-blur-sm">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={14} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#050816] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/15 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">Ready to transform your city?</h2>
            <p className="text-slate-400 text-lg mb-10">Join thousands of citizens already making their communities better, one report at a time.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/report" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_32px_rgba(59,130,246,0.4)] hover:shadow-[0_0_48px_rgba(59,130,246,0.6)]">
                Start Reporting
              </Link>
              <Link to="/dashboard" className="px-8 py-4 bg-white/8 hover:bg-white/12 text-white font-semibold rounded-xl border border-white/15 hover:border-white/25 transition-all backdrop-blur-sm">
                View Dashboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-12 bg-[#050816]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Zap size={13} className="text-white fill-white" />
            </div>
            <span className="font-bold text-white">Urban<span className="text-blue-400">Eye</span></span>
          </div>
          <p className="text-slate-500 text-sm">© 2024 UrbanEye. Empowering civic governance.</p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Contact", "API"].map(l => (
              <a key={l} href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}