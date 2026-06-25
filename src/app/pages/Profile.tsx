import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import { MapPin, Calendar, Star, TrendingUp, Shield, Award, Edit3, CheckCircle2, Clock } from "lucide-react";
import { useApp } from "../context/AppContext";
import { ACTIVITY_LOG, MONTHLY_DATA } from "../data/mockData";

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

const CONTRIBUTION_HEATMAP = Array.from({ length: 52 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => ({
    week,
    day,
    count: Math.random() > 0.65 ? Math.floor(Math.random() * 5) + 1 : 0,
  }))
).flat();

function HeatmapCell({ count }: { count: number }) {
  const colors = ["rgba(59,130,246,0.04)", "rgba(59,130,246,0.2)", "rgba(59,130,246,0.4)", "rgba(59,130,246,0.65)", "rgba(59,130,246,0.85)", "#3b82f6"];
  return (
    <div
      className="w-2.5 h-2.5 rounded-sm"
      style={{ backgroundColor: colors[Math.min(count, 5)] }}
      title={`${count} contributions`}
    />
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

export default function Profile() {
  const { user, issues, logout } = useApp();
  const navigate = useNavigate();

  if (!user) return null;

  // Use Firebase fields, with safe fallbacks
  const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1E6BE6&color=fff&size=100`;
  const badges = DEFAULT_BADGES;
  const myIssues = issues.filter(i => i.reportedBy === user.uid || i.reportedBy === user.name);
  const resolved = myIssues.filter(i => i.status === "resolved");
  const inProgress = myIssues.filter(i => i.status === "in_progress");

  const currentTier = RANK_TIERS_DATA.find(t => user.points >= t.minPoints && user.points < t.maxPoints) ?? RANK_TIERS_DATA[0];
  const resolutionRate = myIssues.length > 0 ? Math.round((resolved.length / myIssues.length) * 100) : 0;

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

        {/* Profile Hero */}
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
                <p className="text-sm font-semibold mt-0.5" style={{ color: currentTier.color }}>{currentTier.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={11} /> Joined {new Date(user.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>
                  <div className="flex items-center gap-1"><MapPin size={11} /> {user.ward}</div>
                </div>
                <p className="text-xs text-slate-500 mt-1">{user.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => { await logout(); navigate("/", { replace: true }); }}
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
          {/* Left: Charts */}
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
                <AreaChart data={MONTHLY_DATA}>
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
                <span className="text-xs text-slate-400">Last 12 months</span>
              </div>
              <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {Array.from({ length: 52 }, (_, week) => (
                    <div key={week} className="flex flex-col gap-1">
                      {Array.from({ length: 7 }, (_, day) => {
                        const cell = CONTRIBUTION_HEATMAP.find(c => c.week === week && c.day === day);
                        return <HeatmapCell key={day} count={cell?.count ?? 0} />;
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 justify-end">
                <span className="text-[10px] text-slate-500">Less</span>
                {[0, 1, 2, 3, 4, 5].map(v => <HeatmapCell key={v} count={v} />)}
                <span className="text-[10px] text-slate-500">More</span>
              </div>
            </motion.div>

            {/* My Recent Issues */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.8)] backdrop-blur-sm overflow-hidden"
            >
              <div className="p-4 border-b border-white/6">
                <h3 className="text-sm font-semibold text-white">My Reported Issues</h3>
              </div>
              {myIssues.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No issues reported yet — go report one!</div>
              ) : (
                <div className="divide-y divide-white/4">
                  {myIssues.map((issue) => (
                    <div key={issue.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white/3 transition-colors">
                      {issue.image && (
                        <img src={issue.image} alt="" className="w-10 h-10 rounded-lg object-cover hidden sm:block flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{issue.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin size={9} /> {issue.location}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                        issue.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" :
                        issue.status === "in_progress" ? "bg-blue-500/15 text-blue-400" :
                        "bg-slate-500/15 text-slate-400"
                      }`}>
                        {issue.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right: Badges + Activity */}
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
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                      badge.unlocked
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
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-white/8" />
                <div className="space-y-4">
                  {ACTIVITY_LOG.map((entry, i) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07 }}
                      className="flex gap-3 pl-2"
                    >
                      <div className="w-6 h-6 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0 relative z-10 text-xs">
                        {entry.icon}
                      </div>
                      <div className="flex-1 min-w-0 pb-3">
                        <p className="text-xs text-white font-medium leading-snug">{entry.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-slate-500">{entry.date}</p>
                          <span className="text-[10px] font-bold text-emerald-400">+{entry.points} pts</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}