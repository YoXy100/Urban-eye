import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, X, ArrowUp, Filter, Search, Layers, ChevronDown } from "lucide-react";
import { useApp } from "../context/AppContext";
import { CATEGORY_COLOR, PRIORITY_COLOR, IssueCategory } from "../data/mockData";

const MAP_WIDTH = 700;
const MAP_HEIGHT = 500;

const MAP_POSITIONS: Record<string, { x: number; y: number }> = {
  "i1": { x: 240, y: 180 },
  "i2": { x: 410, y: 120 },
  "i3": { x: 130, y: 280 },
  "i4": { x: 320, y: 240 },
  "i5": { x: 480, y: 200 },
  "i6": { x: 200, y: 360 },
  "i7": { x: 350, y: 140 },
  "i8": { x: 280, y: 300 },
};

function IssueMarker({ issue, pos, selected, onClick }: any) {
  const color = CATEGORY_COLOR[issue.category as IssueCategory];
  const isNew = issue.status === "new";
  return (
    <motion.g
      key={issue.id}
      style={{ cursor: "pointer" }}
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1 }}
      whileHover={{ scale: 1.2 }}
    >
      {isNew && (
        <motion.circle
          cx={pos.x} cy={pos.y} r="16"
          fill="none" stroke={color} strokeWidth="1"
          animate={{ r: [14, 26], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      {selected && (
        <circle cx={pos.x} cy={pos.y} r="18" fill={color + "25"} stroke={color} strokeWidth="1.5" strokeDasharray="4 4" />
      )}
      <circle cx={pos.x} cy={pos.y} r="10" fill={color + "25"} stroke={color} strokeWidth="1.5" />
      <circle cx={pos.x} cy={pos.y} r="5" fill={color} />
      {issue.priority === "critical" && (
        <text x={pos.x} y={pos.y - 14} textAnchor="middle" fontSize="10" fill={color}>!</text>
      )}
    </motion.g>
  );
}

export default function MapView() {
  const { issues, upvoteIssue } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | IssueCategory>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "in_progress" | "resolved">("all");
  const [search, setSearch] = useState("");
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [showLegend, setShowLegend] = useState(false);

  const selectedIssue = issues.find(i => i.id === selected);

  const filtered = issues.filter(i => {
    if (filter !== "all" && i.category !== filter) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function handleVote(id: string) {
    if (votedIds.has(id)) return;
    upvoteIssue(id);
    setVotedIds(prev => new Set([...prev, id]));
  }

  const categories = ["all", "Infrastructure", "Safety", "Environment", "Utilities", "Traffic", "Public Spaces"] as const;

  return (
    <div className="min-h-screen bg-[#050816] text-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-6 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">City Map</h1>
            <p className="text-slate-400 text-sm mt-1">Visualize civic issues across the city</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-sm text-slate-300 hover:text-white transition-all"
            >
              <Layers size={14} />
              Legend
              <ChevronDown size={12} className={`transition-transform ${showLegend ? "rotate-180" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-5"
        >
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search issues..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-44"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8 flex-wrap">
            {(["all", "new", "in_progress", "resolved"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                  statusFilter === s ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-slate-400 hover:text-white"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Legend */}
        <AnimatePresence>
          {showLegend && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-white/8 bg-[rgba(11,16,32,0.8)]">
                {Object.entries(CATEGORY_COLOR).map(([cat, color]) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(filter === cat as IssueCategory ? "all" : cat as IssueCategory)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      filter === cat ? "opacity-100" : "opacity-60 hover:opacity-90"
                    }`}
                    style={{
                      borderColor: color + "30",
                      backgroundColor: color + "12",
                      color: filter === cat ? color : "#94a3b8",
                    }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 rounded-2xl border border-blue-500/15 bg-[#070d1a] overflow-hidden"
          >
            <div className="relative w-full" style={{ paddingBottom: "71.4%" }}>
              <svg
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                className="absolute inset-0 w-full h-full"
              >
                {/* Background */}
                <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#070d1a" />

                {/* Grid */}
                {Array.from({ length: 14 }).map((_, i) => (
                  <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2={MAP_HEIGHT} stroke="rgba(59,130,246,0.05)" strokeWidth="1" />
                ))}
                {Array.from({ length: 10 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={i * 50} x2={MAP_WIDTH} y2={i * 50} stroke="rgba(59,130,246,0.05)" strokeWidth="1" />
                ))}

                {/* Major roads */}
                <rect x="0" y="230" width={MAP_WIDTH} height="18" fill="rgba(59,130,246,0.07)" />
                <rect x="0" y="350" width={MAP_WIDTH} height="12" fill="rgba(59,130,246,0.05)" />
                <rect x="310" y="0" width="18" height={MAP_HEIGHT} fill="rgba(59,130,246,0.07)" />
                <rect x="480" y="0" width="12" height={MAP_HEIGHT} fill="rgba(59,130,246,0.05)" />

                {/* City blocks */}
                {[
                  { x: 20, y: 20, w: 270, h: 195 },
                  { x: 350, y: 20, w: 110, h: 195 },
                  { x: 510, y: 20, w: 170, h: 195 },
                  { x: 20, y: 270, w: 270, h: 60 },
                  { x: 20, y: 365, w: 270, h: 115 },
                  { x: 350, y: 270, w: 320, h: 60 },
                  { x: 350, y: 365, w: 320, h: 115 },
                ].map((b, i) => (
                  <g key={i}>
                    <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="rgba(59,130,246,0.03)" rx="3" stroke="rgba(59,130,246,0.06)" strokeWidth="0.5" />
                  </g>
                ))}

                {/* Road labels */}
                {[
                  { x: 350, y: 224, text: "Harbor Blvd", anchor: "middle" },
                  { x: 350, y: 347, text: "Oak Street", anchor: "middle" },
                  { x: 305, y: 120, text: "Main St", anchor: "middle" },
                ].map((l, i) => (
                  <text key={i} x={l.x} y={l.y} textAnchor={l.anchor as any} fontSize="9" fill="rgba(100,116,139,0.6)" fontFamily="Inter">{l.text}</text>
                ))}

                {/* Issue markers */}
                {filtered.map((issue) => {
                  const pos = MAP_POSITIONS[issue.id];
                  if (!pos) return null;
                  return (
                    <IssueMarker
                      key={issue.id}
                      issue={issue}
                      pos={pos}
                      selected={selected === issue.id}
                      onClick={() => setSelected(selected === issue.id ? null : issue.id)}
                    />
                  );
                })}

                {/* Compass */}
                <text x="660" y="30" fontSize="10" fill="rgba(59,130,246,0.4)" fontFamily="Inter" fontWeight="600">N</text>
                <line x1="663" y1="34" x2="663" y2="45" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
              </svg>
            </div>

            {/* Map stats bar */}
            <div className="px-4 py-3 border-t border-white/5 flex items-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                {filtered.length} issues shown
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {filtered.filter(i => i.status === "new").length} new
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                {filtered.filter(i => i.status === "resolved").length} resolved
              </span>
            </div>
          </motion.div>

          {/* Issue list / Detail panel */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.8)] backdrop-blur-sm overflow-hidden flex flex-col"
          >
            {selectedIssue ? (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-white/6 flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                        style={{ backgroundColor: CATEGORY_COLOR[selectedIssue.category] + "20", color: CATEGORY_COLOR[selectedIssue.category] }}
                      >
                        {selectedIssue.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        selectedIssue.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" :
                        selectedIssue.status === "in_progress" ? "bg-blue-500/15 text-blue-400" :
                        "bg-slate-500/15 text-slate-400"
                      }`}>
                        {selectedIssue.status.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-snug">{selectedIssue.title}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
                    <X size={16} />
                  </button>
                </div>
                {selectedIssue.image && (
                  <div className="relative overflow-hidden" style={{ height: 160 }}>
                    <img src={selectedIssue.image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1020] to-transparent" />
                  </div>
                )}
                <div className="p-4 flex-1 space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedIssue.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin size={11} />
                    <span>{selectedIssue.location}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-white/3 text-xs">
                      <div className="text-slate-500 mb-0.5">Reported by</div>
                      <div className="text-white font-medium">{selectedIssue.reportedBy}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/3 text-xs">
                      <div className="text-slate-500 mb-0.5">Date</div>
                      <div className="text-white font-medium">{selectedIssue.reportedAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleVote(selectedIssue.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                        votedIds.has(selectedIssue.id)
                          ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                          : "bg-white/5 border-white/10 text-slate-300 hover:border-blue-500/30 hover:text-blue-300"
                      }`}
                    >
                      <ArrowUp size={12} /> {selectedIssue.votes} votes
                    </button>
                    <span className="text-xs text-slate-500">{selectedIssue.comments} comments</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-white/6">
                  <h3 className="text-sm font-semibold text-white">Issues List</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Click map pin or list item</p>
                </div>
                <div className="overflow-y-auto flex-1">
                  {filtered.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => setSelected(issue.id)}
                      className="w-full text-left p-3 hover:bg-white/4 transition-colors border-b border-white/4 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: CATEGORY_COLOR[issue.category] }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{issue.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin size={9} /> {issue.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 flex-shrink-0">
                          <ArrowUp size={9} /> {issue.votes}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
