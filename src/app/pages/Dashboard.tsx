import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../context/AppContext";
import { ThreeCity } from "../components/ThreeCity";
import { ThreeGlobe } from "../components/ThreeGlobe";
import { AreaChartComponent, CivicHealthGauge, DensityHeatmap } from "../components/Charts";
import {
  PlusCircle,
  MapPin,
  LayoutDashboard,
  ChevronRight,
  Sliders,
  ArrowUp,
  AlertCircle,
  MessageSquare,
  CornerDownRight,
  CheckCircle2
} from "lucide-react";
import { Issue } from "../data/mockData";

// Adapter components inside Dashboard.tsx

interface IssueCardProps {
  issue: Issue;
}

const LocalIssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const { upvoteIssue, updateIssueStatus } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<string[]>([
    'Agreed, I drove past this yesterday and had to brake hard.',
    'Assigned to district maintenance crew, resolving soon.'
  ]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments(prev => [...prev, commentText]);
    setCommentText('');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'high': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'medium': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'low': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-pink-500/20 text-pink-300';
      case 'in_progress': return 'bg-cyan-500/20 text-cyan-300';
      case 'resolved': return 'bg-emerald-500/20 text-emerald-300';
      default: return 'bg-slate-500/20 text-slate-300';
    }
  };

  const [voted, setVoted] = useState(false);

  const handleUpvote = () => {
    if (voted) return;
    upvoteIssue(issue.id);
    setVoted(true);
  };

  return (
    <motion.div
      layout
      className="glass-card rounded-2xl overflow-hidden border border-white/5 bg-slate-950/40 hover:bg-slate-900/40 transition-all duration-300 shadow-xl group"
    >
      {/* Top Banner Image with Zoom */}
      {issue.image && (
        <div className="aspect-video w-full overflow-hidden bg-slate-900 relative">
          <img
            src={issue.image}
            alt={issue.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border ${getPriorityColor(issue.priority)} bg-slate-955/85 backdrop-blur-md`}>
              {issue.priority}
            </span>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${getStatusColor(issue.status)} bg-slate-955/85 backdrop-blur-md`}>
              {issue.status.replace('_', ' ')}
            </span>
          </div>

          <span className="absolute bottom-4 right-4 text-[10px] bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg font-mono text-slate-300 flex items-center gap-1 border border-white/5 truncate max-w-[150px]">
            <MapPin className="w-3 h-3 text-cyan-400" />
            {issue.location}
          </span>
        </div>
      )}

      {/* Card Content details */}
      <div className="p-5 space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>{issue.category}</span>
            <span>{issue.reportedAt}</span>
          </div>
          <h3 className="font-sans font-bold text-base text-white group-hover:text-cyan-300 transition-colors cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            {issue.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
            {issue.description}
          </p>
        </div>

        {/* Sleek Progress Step Tracker */}
        <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono font-bold text-slate-500 pt-1">
          <div className="space-y-1">
            <div className={`h-1 rounded-full ${issue.status === 'new' || issue.status === 'in_progress' || issue.status === 'resolved' ? 'bg-pink-400' : 'bg-white/5'}`} />
            <span className={issue.status === 'new' ? 'text-pink-400' : 'text-slate-400'}>INTENDED</span>
          </div>
          <div className="space-y-1">
            <div className={`h-1 rounded-full ${issue.status === 'in_progress' || issue.status === 'resolved' ? 'bg-cyan-400' : 'bg-white/5'}`} />
            <span className={issue.status === 'in_progress' ? 'text-cyan-400' : 'text-slate-400'}>MAPPED</span>
          </div>
          <div className="space-y-1">
            <div className={`h-1 rounded-full ${issue.status === 'resolved' ? 'bg-emerald-400' : 'bg-white/5'}`} />
            <span className={issue.status === 'resolved' ? 'text-emerald-400' : 'text-slate-400'}>RESOLVED</span>
          </div>
        </div>

        {/* Interaction Bar (Upvotes & expand comment details) */}
        <div className="flex justify-between items-center pt-3 border-t border-white/5">
          <button
            onClick={handleUpvote}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
              voted
                ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                : 'bg-white/5 border-white/5 text-slate-300 hover:border-white/10'
            }`}
          >
            <ArrowUp className={`w-3.5 h-3.5 ${voted ? 'animate-bounce text-cyan-300' : ''}`} />
            <span>{issue.votes + (voted ? 1 : 0)} Upvotes</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-mono text-slate-400 hover:text-white transition-all flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>{comments.length} Comments</span>
          </button>
        </div>

        {/* Expansion Comments Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4 pt-3 border-t border-white/5"
            >
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">DIAGNOSTIC TELEMETRY</div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-xs space-y-1.5">
                <p className="text-slate-400 flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Physical Address:</strong> {issue.location}</span>
                </p>
                <p className="text-slate-400">
                  <strong>Coordinates:</strong> {issue.lat.toFixed(4)}, {issue.lng.toFixed(4)}
                </p>
              </div>

              {/* Action Resolution button */}
              {issue.status !== 'resolved' && (
                <button
                  onClick={() => updateIssueStatus(issue.id, 'resolved')}
                  className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Resolved (Moderator action)
                </button>
              )}

              {/* Comments Feed */}
              <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-none">
                {comments.map((comment, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <CornerDownRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-300">
                      <strong className="text-slate-400 font-mono">Resident:</strong> {comment}
                    </p>
                  </div>
                ))}
              </div>

              {/* New Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask a question or offer assistance..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-600 transition-all active:scale-95"
                >
                  Post
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default function Dashboard() {
  const { issues, user } = useApp();

  // Feed Filter States
  const [feedCategory, setFeedCategory] = useState<string>("All");
  const [feedStatus, setFeedStatus] = useState<string>("All");

  // Hero Parallax effect states
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 15;
    const y = (clientY / window.innerHeight - 0.5) * 15;
    setMousePos({ x, y });
  };

  const activeReportsCount = issues.filter(r => r.status !== "resolved").length;
  const resolvedReportsCount = issues.filter(r => r.status === "resolved").length;

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-[#050816] text-slate-100 flex flex-col overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-300 font-sans pt-16"
    >
      {/* Premium Aurora Lighting Effects */}
      <div className="fixed top-0 inset-x-0 h-[600px] bg-gradient-to-b from-blue-950/20 via-cyan-950/5 to-transparent pointer-events-none z-0" />
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-1/2 right-0 w-80 h-80 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "40px 40px"
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 py-8 pb-32 max-w-7xl w-full mx-auto px-4 md:px-8 space-y-12">
        {/* Fullscreen Interactive Hero Section */}
        <div className="relative min-h-[520px] rounded-3xl overflow-hidden border border-white/5 bg-slate-950/20 backdrop-blur-3xl flex flex-col lg:flex-row items-center justify-between p-8 md:p-12 gap-8 shadow-2xl">
          {/* Hero Text */}
          <div className="max-w-xl space-y-6 relative z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="font-mono text-[9px] font-bold text-cyan-300 uppercase tracking-widest">
                SYSTEM ONLINE: DISTRICT SECTOR-12
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white leading-tight font-sans">
              Building <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500">Smarter Cities</span> Together
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-md mx-auto lg:mx-0">
              Report civic issues. Track real-time progress. Transform community zones through direct collaborative governance metrics and gamified milestones.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
              <Link
                to="/report"
                className="magnetic-button w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 text-sm transition-all active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4.5 h-4.5" />
                Report Issue
              </Link>

              <button
                onClick={() => {
                  const chartsSection = document.getElementById("charts-command-center");
                  chartsSection?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <LayoutDashboard className="w-4.5 h-4.5 text-slate-400" />
                Explore Dashboard
              </button>
            </div>
          </div>

          {/* 3D Smart City hologram stage */}
          <div
            className="w-full lg:w-[480px] h-[320px] md:h-[380px] rounded-2xl overflow-hidden border border-white/10 bg-[#030510]/50 relative flex items-center justify-center"
            style={{ transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)` }}
          >
            <ThreeCity />
          </div>
        </div>

        {/* Statistical Command Center Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: "Active Reports", val: activeReportsCount, tag: "NEEDS REPAIR", icon: "⚠️", color: "text-pink-400", bg: "bg-pink-500/10" },
            { title: "Resolved Sockets", val: resolvedReportsCount, tag: "COMPLETED", icon: "✓", color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { title: "Citizen Trust Score", val: "98.2%", tag: "EXCELLENT", icon: "🛡️", color: "text-cyan-400", bg: "bg-cyan-500/10" },
            { title: "Community Points", val: user.points, tag: "REDEEMABLE", icon: "🏆", color: "text-violet-400", bg: "bg-violet-500/10" },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-5 rounded-2xl border border-white/5 bg-slate-950/40 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">{stat.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${stat.bg} ${stat.color}`}>
                  <span>{stat.icon}</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-display font-extrabold text-white tracking-tighter">{stat.val}</div>
                <span className={`text-[9px] font-mono font-bold ${stat.color} uppercase tracking-widest block mt-1`}>
                  ● {stat.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Globe telemetry and diagnostics bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* 3D Interactive Globe Card */}
          <div className="lg:col-span-2 glass-card rounded-2xl border border-white/5 bg-slate-950/40 p-6 flex flex-col justify-between overflow-hidden min-h-[460px]">
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse inline-block"></span>
                <h3 className="font-bold text-base text-white">Civic Intelligence Globe</h3>
              </div>
              <p className="text-xs text-slate-400">Live hot-spot detection across transatlantic and Indian municipal cells. Spin and drag to load telemetry.</p>
            </div>

            <div className="flex-1 h-[340px] w-full relative z-0">
              <ThreeGlobe />
            </div>
          </div>

          {/* Live Activity ticker widget */}
          <div className="lg:col-span-1 glass-card rounded-2xl border border-white/5 bg-slate-950/40 p-6 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-white">Live Operations Stream</h3>
              <p className="text-xs text-slate-400">Real-time telemetry reports broadcasted by neighborhood watch units</p>
            </div>

            <div className="space-y-3.5 my-4 overflow-y-auto max-h-[260px] scrollbar-none pr-1 pt-1">
              {issues.slice(0, 4).map((rep) => (
                <div key={rep.id} className="p-3 bg-slate-900/40 rounded-xl border border-white/5 flex gap-3 items-start hover:border-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-slate-300 text-xs">
                    {rep.category === "Infrastructure" ? "🏢" : rep.category === "Safety" ? "🛡️" : rep.category === "Environment" ? "🌱" : rep.category === "Utilities" ? "💡" : rep.category === "Traffic" ? "🚦" : "🏛️"}
                  </div>
                  <div className="text-left text-xs space-y-0.5">
                    <strong className="text-slate-200 block text-sm leading-snug line-clamp-1">{rep.title}</strong>
                    <span className="text-[10px] text-slate-400 block">{rep.location} • {rep.reportedAt}</span>
                    <span className={`text-[9px] font-mono font-bold uppercase ${
                      rep.status === "new" ? "text-pink-400" : rep.status === "in_progress" ? "text-cyan-400" : "text-emerald-400"
                    }`}>
                      ● {rep.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const feedSection = document.getElementById("community-feed-section");
                feedSection?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-white/5 cursor-pointer"
            >
              View Community Feed
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Visualization Command Center */}
        <div id="charts-command-center" className="space-y-6 pt-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              District Diagnostics Room
            </h3>
            <p className="text-xs text-slate-400">Visual analytical logs representing municipal load balancing</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AreaChartComponent />
            <CivicHealthGauge />
          </div>

          <DensityHeatmap />
        </div>

        {/* Community Feed Section at the bottom of the page */}
        <div id="community-feed-section" className="space-y-6 pt-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Community Broadcast Feed</h2>
              <p className="text-xs text-slate-400">Verified resident complaints, priority indexes, and ongoing civic resolutions.</p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-400 font-mono">Category:</span>
              <select
                value={feedCategory}
                onChange={(e) => setFeedCategory(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-sans"
              >
                <option value="All">All Categories</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Safety">Safety</option>
                <option value="Environment">Environment</option>
                <option value="Utilities">Utilities</option>
                <option value="Traffic">Traffic</option>
                <option value="Public Spaces">Public Spaces</option>
              </select>

              <span className="text-slate-600">|</span>

              <span className="text-xs text-slate-400 font-mono">Status:</span>
              <select
                value={feedStatus}
                onChange={(e) => setFeedStatus(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-sans"
              >
                <option value="All">All Statuses</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Feed List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {issues
              .filter(rep => {
                const matchesCategory = feedCategory === "All" ? true : rep.category === feedCategory;
                const matchesStatus = feedStatus === "All" ? true : rep.status === feedStatus;
                return matchesCategory && matchesStatus;
              })
              .map((rep) => (
                <LocalIssueCard key={rep.id} issue={rep} />
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
