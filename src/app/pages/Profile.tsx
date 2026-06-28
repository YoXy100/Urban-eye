import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  MapPin, Calendar, Star, TrendingUp, Shield, Award,
  Edit3, CheckCircle2, Clock, MoreVertical, Trash2, Pencil, X, AlertTriangle
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ACTIVITY_LOG, MONTHLY_DATA, Issue } from "../data/mockData";

import { UserActivity } from "../lib/activityService";

const RANK_TIERS_DATA = [
  { name: "Newcomer", minPoints: 0, maxPoints: 500, color: "#64748b", icon: "🌱" },
  { name: "Issue Tracker", minPoints: 500, maxPoints: 2000, color: "#f59e0b", icon: "🔍" },
  { name: "Community Star", minPoints: 2000, maxPoints: 4000, color: "#06b6d4", icon: "⭐" },
  { name: "City Champion", minPoints: 4000, maxPoints: 6000, color: "#3b82f6", icon: "🏆" },
  { name: "Civic Pioneer", minPoints: 6000, maxPoints: 8000, color: "#8b5cf6", icon: "🚀" },
  { name: "City Guardian", minPoints: 8000, maxPoints: 10000, color: "#ec4899", icon: "🛡️" },
];

const DEFAULT_BADGES = [
  { id: "b1", name: "First Report", description: "Submitted your first civic issue", icon: "🏙️", unlocked: false, progress: 0, total: 1 },
  { id: "b2", name: "Community Voice", description: "Reported 10+ issues", icon: "📢", unlocked: false, progress: 0, total: 10 },
  { id: "b3", name: "Problem Solver", description: "Had 25 issues resolved", icon: "✅", unlocked: false, progress: 0, total: 25 },
  { id: "b4", name: "Neighborhood Hero", description: "Earned 5000 civic points", icon: "🦸", unlocked: false, progress: 0, total: 5000 },
  { id: "b5", name: "Trend Setter", description: "Get 100 upvotes on a single issue", icon: "🔥", unlocked: false, progress: 0, total: 100 },
  { id: "b6", name: "City Architect", description: "Report 100 issues", icon: "🏛️", unlocked: false, progress: 0, total: 100 },
];

const ACTIVITY_ICONS: Record<string, string> = {
  issue_reported: "📍",
  issue_deleted: "🗑️",
  issue_upvoted: "⬆️",
  status_changed: "🔄",
  fake_reported: "🚩",
  reward_redeemed: "🎁",
  profile_updated: "✏️",
};

// ── Heatmap helpers ──────────────────────────────────────────────────────────

interface HeatmapEntry {
  week: number;
  day: number;
  count: number;
  date: Date;
}

/** Format a Date to local YYYY-MM-DD (avoids UTC timezone drift). */
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Build 52-week × 7-day heatmap grid from the user's activity log. */
function buildHeatmapFromActivities(activities: UserActivity[]): { grid: HeatmapEntry[]; monthLabels: { label: string; weekIdx: number }[] } {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // include all of today

  // Start of heatmap: 52 weeks ago, aligned to the most recent Sunday
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // most recent Sunday
  const heatmapStart = new Date(startOfWeek);
  heatmapStart.setDate(heatmapStart.getDate() - 51 * 7); // go back 51 more weeks
  heatmapStart.setHours(0, 0, 0, 0);

  // Count activities per local calendar date
  const countMap = new Map<string, number>();
  for (const act of activities) {
    // Each activity has a `date` field in YYYY-MM-DD format
    const key = act.date;
    if (key) countMap.set(key, (countMap.get(key) || 0) + 1);
  }

  const grid: HeatmapEntry[] = [];
  const monthLabels: { label: string; weekIdx: number }[] = [];
  const seenMonths = new Set<string>();
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const now = new Date();

  for (let week = 0; week < 52; week++) {
    for (let day = 0; day < 7; day++) {
      const cellDate = new Date(heatmapStart);
      cellDate.setDate(heatmapStart.getDate() + week * 7 + day);

      // Don't include future dates
      const isFuture = cellDate > now && toLocalDateKey(cellDate) !== toLocalDateKey(now);

      const key = toLocalDateKey(cellDate);
      grid.push({
        week,
        day,
        count: isFuture ? -1 : (countMap.get(key) || 0),
        date: new Date(cellDate),
      });

      // Month labels: mark the first time we see a new month
      const monthKey = `${cellDate.getFullYear()}-${cellDate.getMonth()}`;
      if (!seenMonths.has(monthKey) && day === 0) {
        seenMonths.add(monthKey);
        monthLabels.push({ label: MONTHS[cellDate.getMonth()], weekIdx: week });
      }
    }
  }

  return { grid, monthLabels };
}

const HEATMAP_COLORS = [
  "rgba(59,130,246,0.06)",  // 0 contributions
  "rgba(59,130,246,0.25)",  // 1
  "rgba(59,130,246,0.45)",  // 2
  "rgba(59,130,246,0.65)",  // 3
  "rgba(59,130,246,0.82)",  // 4
  "#3b82f6",                // 5+
];

function HeatmapCell({ entry }: { entry: HeatmapEntry }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Future dates rendered as invisible
  if (entry.count === -1) {
    return <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "transparent" }} />;
  }

  const bg = HEATMAP_COLORS[Math.min(entry.count, 5)];
  const dateStr = entry.date.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
  const label = entry.count === 0
    ? `No contributions on ${dateStr}`
    : `${entry.count} contribution${entry.count > 1 ? "s" : ""} on ${dateStr}`;

  return (
    <div className="relative">
      <div
        className="w-2.5 h-2.5 rounded-sm cursor-pointer transition-transform hover:scale-150"
        style={{ backgroundColor: bg }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      />
      {showTooltip && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-[#0d1526] border border-blue-500/20 shadow-xl whitespace-nowrap pointer-events-none"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.6)" }}
        >
          <p className="text-[10px] text-slate-200 font-medium">{label}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#0d1526]" />
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#0d1526] border border-blue-500/20 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditIssueModal({
  issue,
  onClose,
}: {
  issue: Issue;
  onClose: () => void;
}) {
  const { updateIssueStatus } = useApp();
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);
  const [status, setStatus] = useState(issue.status);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // We can update status via the existing context method.
  // For title/description, you can extend AppContext with an updateIssue fn later.
  async function handleSave() {
    setSaving(true);
    try {
      if (status !== issue.status) {
        await updateIssueStatus(issue.id, status);
      }
      // TODO: extend AppContext with updateIssue(id, { title, description })
      // for full title/description editing via Firestore.
      setSaved(true);
      setTimeout(onClose, 900);
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(5,8,22,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1020] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Pencil size={14} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Edit Issue</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all resize-none placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Status
            </label>
            <div className="flex gap-2">
              {(["new", "in_progress", "resolved"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-medium capitalize transition-all ${status === s
                    ? s === "resolved"
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : s === "in_progress"
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                        : "bg-slate-500/20 border-slate-500/40 text-slate-300"
                    : "bg-white/3 border-white/8 text-slate-500 hover:text-white"
                    }`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-500 mt-1">
            Note: Title &amp; description editing requires an <code className="text-slate-400">updateIssue</code> function in AppContext (see TODO in code). Status updates to Firestore immediately.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/4 text-sm text-slate-300 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved
              ? "bg-emerald-600 text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_16px_rgba(59,130,246,0.3)]"
              } disabled:opacity-60`}
          >
            {saved ? "Saved ✓" : saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Issue Row with 3-dot menu ─────────────────────────────────────────────────
function IssueRow({ issue }: { issue: Issue }) {
  const { deleteIssue } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteIssue(issue.id);
      // Firestore onSnapshot in AppContext auto-removes it from
      // issues[] everywhere: MapView, Dashboard, Profile, etc.
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-3 hover:bg-white/3 transition-colors">
        {issue.image && (
          <img
            src={issue.image}
            alt=""
            className="w-10 h-10 rounded-lg object-cover hidden sm:block flex-shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{issue.title}</p>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <MapPin size={9} /> {issue.location}
          </p>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${issue.status === "resolved"
            ? "bg-emerald-500/15 text-emerald-400"
            : issue.status === "in_progress"
              ? "bg-blue-500/15 text-blue-400"
              : "bg-slate-500/15 text-slate-400"
            }`}
        >
          {issue.status.replace("_", " ")}
        </span>

        {/* ── Three-dot button + dropdown ── */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => {
              setMenuOpen(o => !o);
              setConfirmDelete(false);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-all"
            title="Options"
          >
            <MoreVertical size={14} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-9 z-50 w-48 rounded-xl border border-white/10 bg-[#0d1526] shadow-2xl overflow-hidden"
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" }}
              >
                {/* Edit */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-white/6 transition-colors text-left"
                >
                  <Pencil size={12} className="text-blue-400" />
                  Edit Issue
                </button>

                <div className="h-px bg-white/6 mx-2" />

                {/* Delete — two-step confirmation */}
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs transition-colors text-left disabled:opacity-50 ${confirmDelete
                    ? "bg-red-500/15 text-red-300 hover:bg-red-500/25"
                    : "text-slate-300 hover:text-red-300 hover:bg-white/6"
                    }`}
                >
                  {deleting ? (
                    <>
                      <div className="w-3 h-3 border border-red-400/40 border-t-red-400 rounded-full animate-spin" />
                      Deleting…
                    </>
                  ) : confirmDelete ? (
                    <>
                      <AlertTriangle size={12} className="text-red-400" />
                      Tap again to confirm
                    </>
                  ) : (
                    <>
                      <Trash2 size={12} className="text-red-400" />
                      Delete Issue
                    </>
                  )}
                </button>

                {confirmDelete && !deleting && (
                  <button
                    onClick={() => { setConfirmDelete(false); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/4 transition-colors text-left border-t border-white/6"
                  >
                    <X size={11} /> Cancel
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Edit modal rendered in place, portalled visually via fixed positioning */}
      <AnimatePresence>
        {editOpen && (
          <EditIssueModal issue={issue} onClose={() => setEditOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main Profile Page ─────────────────────────────────────────────────────────
export default function Profile() {
  const { user, issues, activities, logout } = useApp();
  const navigate = useNavigate();

  if (!user) return null;

  const avatarUrl =
    user.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1E6BE6&color=fff&size=100`;

  const badges = DEFAULT_BADGES;
  const myIssues = issues.filter(
    i => i.reportedBy === user.uid || i.reportedBy === user.name
  );
  const resolved = myIssues.filter(i => i.status === "resolved");
  const inProgress = myIssues.filter(i => i.status === "in_progress");

  // Generate issue activity chart data (last 6 months)
  const monthlyActivityData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const data = [];


    // Go back 5 months + current month (6 months total)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();
      const monthIdx = d.getMonth();

      // Find issues reported this month
      let reported = 0;
      let resolved = 0;

      myIssues.forEach(issue => {
        let issueDate: Date | null = null;
        if (issue.reportedAt) {
          issueDate = new Date(issue.reportedAt);
        } else if ((issue as any).createdAt) {
          const ts = (issue as any).createdAt;
          issueDate = ts.toDate ? ts.toDate() : new Date(ts);
        }

        if (issueDate && issueDate.getMonth() === monthIdx && issueDate.getFullYear() === year) {
          reported++;
          if (issue.status === "resolved") {
            resolved++;
          }
        }
      });

      data.push({ month: monthName, reported, resolved });
    }
    return data;
  }, [myIssues]);

  // Build heatmap from user's activity log (reports, upvotes, status changes, etc.)
  const { grid: heatmapGrid, monthLabels } = useMemo(
    () => buildHeatmapFromActivities(activities),
    [activities]
  );
  const totalContributions = useMemo(
    () => heatmapGrid.reduce((sum, e) => sum + Math.max(0, e.count), 0),
    [heatmapGrid]
  );

  const currentTier =
    RANK_TIERS_DATA.find(t => user.points >= t.minPoints && user.points < t.maxPoints) ??
    RANK_TIERS_DATA[0];

  const resolutionRate =
    myIssues.length > 0 ? Math.round((resolved.length / myIssues.length) * 100) : 0;

  const profileStats = [
    { label: "Issues Reported", value: user.reportsFiled ?? myIssues.length, icon: MapPin, color: "#3b82f6" },
    { label: "Resolved", value: user.reportsResolved ?? resolved.length, icon: CheckCircle2, color: "#10b981" },
    { label: "In Progress", value: inProgress.length, icon: Clock, color: "#f59e0b" },
    { label: "Resolution Rate", value: `${resolutionRate}%`, icon: TrendingUp, color: "#8b5cf6" },
    { label: "Civic Points", value: user.points.toLocaleString(), icon: Star, color: "#f59e0b" },
    { label: "Badges Earned", value: badges.filter(b => b.unlocked).length, icon: Award, color: "#06b6d4" },
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Profile Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-8 border border-blue-500/15"
        >
          {/* Cover */}
          <div className="h-32 md:h-48 relative overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&h=300&fit=crop&auto=format"
              alt="City skyline"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1020] via-[#0b1020]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-purple-900/20" />
          </div>

          {/* Profile info */}
          <div className="bg-[rgba(11,16,32,0.95)] px-6 pt-0 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 sm:-mt-12 mb-4">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={user.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-[#0b1020] shadow-[0_0_24px_rgba(59,130,246,0.3)]"
                />
                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center text-sm border-2 border-[#0b1020]"
                  style={{ backgroundColor: currentTier.color + "20", borderColor: currentTier.color + "40" }}
                >
                  {currentTier.icon}
                </div>
              </div>

              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                  <Shield size={14} className="text-blue-400" />
                </div>
                <p className="text-sm font-semibold mt-0.5" style={{ color: currentTier.color }}>
                  {currentTier.name}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={11} />
                    Joined{" "}
                    {new Date(user.joinedAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={11} /> {user.ward}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">{user.email}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await logout();
                    navigate("/", { replace: true });
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-all"
                >
                  Sign Out
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-sm text-slate-300 hover:text-white hover:bg-white/8 transition-all">
                  <Edit3 size={13} /> Edit Profile
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {profileStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="text-center p-2"
                >
                  <div className="text-xl font-bold text-white tabular-nums">{stat.value}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left: Charts + Issues ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Activity chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-5 rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.8)] backdrop-blur-sm"
            >
              <h3 className="text-sm font-semibold text-white mb-5">Issue Activity</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthlyActivityData}>
                  <defs>
                    <linearGradient id="reportedGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="resolvedGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="reported" name="Reported" stroke="#3b82f6" strokeWidth={2} fill="url(#reportedGrad2)" />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} fill="url(#resolvedGrad2)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Contribution Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.8)] backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Contribution Activity</h3>
                <span className="text-xs text-slate-400">
                  {totalContributions} contribution{totalContributions !== 1 ? "s" : ""} in the last year
                </span>
              </div>
              <div className="overflow-x-auto">
                {/* Month labels */}
                <div className="flex gap-1 min-w-max mb-1" style={{ paddingLeft: "24px" }}>
                  {monthLabels.map((m, i) => (
                    <div
                      key={`${m.label}-${i}`}
                      className="text-[9px] text-slate-500"
                      style={{
                        position: "relative",
                        left: `${m.weekIdx * 12}px`,
                        marginRight: i < monthLabels.length - 1
                          ? `${Math.max(0, ((monthLabels[i + 1]?.weekIdx ?? 52) - m.weekIdx) * 12 - 24)}px`
                          : 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
                <div className="flex gap-0 min-w-max">
                  {/* Day-of-week labels */}
                  <div className="flex flex-col gap-1 mr-1.5 justify-center" style={{ minWidth: "20px" }}>
                    {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                      <div key={i} className="h-2.5 flex items-center text-[9px] text-slate-500 leading-none">
                        {d}
                      </div>
                    ))}
                  </div>
                  {/* Heatmap grid */}
                  <div className="flex gap-1">
                    {Array.from({ length: 52 }, (_, week) => (
                      <div key={week} className="flex flex-col gap-1">
                        {Array.from({ length: 7 }, (_, day) => {
                          const entry = heatmapGrid.find(c => c.week === week && c.day === day);
                          return entry
                            ? <HeatmapCell key={day} entry={entry} />
                            : <div key={day} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "transparent" }} />;
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 justify-end">
                <span className="text-[10px] text-slate-500">Less</span>
                {[0, 1, 2, 3, 4, 5].map(v => (
                  <div
                    key={v}
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: HEATMAP_COLORS[v] }}
                    title={v === 0 ? "0 contributions" : `${v}${v === 5 ? "+" : ""} contributions`}
                  />
                ))}
                <span className="text-[10px] text-slate-500">More</span>
              </div>
            </motion.div>

            {/* ── My Reported Issues ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.8)] backdrop-blur-sm overflow-visible"
            >
              <div className="p-4 border-b border-white/6 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">My Reported Issues</h3>
                <span className="text-xs text-slate-500">{myIssues.length} total</span>
              </div>

              {myIssues.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No issues reported yet — go report one!
                </div>
              ) : (
                <div className="divide-y divide-white/4">
                  {myIssues.map(issue => (
                    <IssueRow key={issue.id} issue={issue} />
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Right: Badges + Activity ── */}
          <div className="space-y-6">
            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.8)] backdrop-blur-sm"
            >
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Award size={14} className="text-yellow-400" />
                Badges
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {badges.map(badge => (
                  <div
                    key={badge.id}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${badge.unlocked
                      ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/8"
                      : "bg-white/3 border border-white/5 opacity-40"
                      }`}
                    title={badge.description}
                  >
                    <span className="text-xl">{badge.icon}</span>
                    <p className="text-[9px] text-slate-400 mt-1 text-center leading-tight">{badge.name}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Activity Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-4 rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.8)] backdrop-blur-sm"
            >
              <h3 className="text-sm font-semibold text-white mb-4">Activity Timeline</h3>
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No activity yet.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-white/8" />
                  <div className="space-y-4">
                    {(activities.length > 0 ? activities.slice(0, 10) : ACTIVITY_LOG).map((entry: any, i: number) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -12 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.07 }}
                          className="flex gap-3 pl-2"
                        >
                          <div className="w-6 h-6 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0 relative z-10 text-xs">
                            {entry.icon || ACTIVITY_ICONS[entry.type] || "📌"}
                          </div>
                          <div className="flex-1 min-w-0 pb-3">
                            <p className="text-xs text-white font-medium leading-snug">{entry.label || entry.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[10px] text-slate-500">{entry.date}</p>
                              {entry.points && <span className="text-[10px] font-bold text-emerald-400">+{entry.points} pts</span>}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}