import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, Camera, FileText, Eye, Send, CheckCircle2,
  ChevronRight, ChevronLeft, X, Upload, AlertTriangle,
  Zap, Building2, Trees, Droplets, Car, PlayCircle
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Issue, IssueCategory, IssuePriority } from "../data/mockData";

const STEPS = [
  { id: 1, title: "Issue Details", icon: FileText, desc: "Describe the problem" },
  { id: 2, title: "Location", icon: MapPin, desc: "Pin the location" },
  { id: 3, title: "Photos", icon: Camera, desc: "Add evidence" },
  { id: 4, title: "Preview", icon: Eye, desc: "Review your report" },
  { id: 5, title: "Submit", icon: Send, desc: "Send to city" },
];

const CATEGORIES: { value: IssueCategory; label: string; icon: typeof Building2; color: string }[] = [
  { value: "Infrastructure", label: "Infrastructure", icon: Building2, color: "#3b82f6" },
  { value: "Safety", label: "Safety", icon: AlertTriangle, color: "#ef4444" },
  { value: "Environment", label: "Environment", icon: Trees, color: "#10b981" },
  { value: "Utilities", label: "Utilities", icon: Droplets, color: "#f59e0b" },
  { value: "Traffic", label: "Traffic", icon: Car, color: "#8b5cf6" },
  { value: "Public Spaces", label: "Public Spaces", icon: PlayCircle, color: "#06b6d4" },
];

const PRIORITIES: { value: IssuePriority; label: string; desc: string; color: string }[] = [
  { value: "low", label: "Low", desc: "Minor inconvenience", color: "#64748b" },
  { value: "medium", label: "Medium", desc: "Affects some residents", color: "#f59e0b" },
  { value: "high", label: "High", desc: "Significant impact", color: "#f97316" },
  { value: "critical", label: "Critical", desc: "Immediate danger", color: "#ef4444" },
];

const CITY_LOCATIONS = [
  { id: 1, label: "Downtown Core", x: 150, y: 150 },
  { id: 2, label: "Harbor District", x: 240, y: 80 },
  { id: 3, label: "Riverside Park", x: 80, y: 200 },
  { id: 4, label: "Central Heights", x: 200, y: 220 },
  { id: 5, label: "North Quarter", x: 130, y: 60 },
  { id: 6, label: "Market Street", x: 280, y: 180 },
  { id: 7, label: "Oak Street", x: 60, y: 110 },
  { id: 8, label: "Maple Ave", x: 220, y: 260 },
];

export default function ReportIssue() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const { addIssue, user } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "" as IssueCategory | "",
    priority: "medium" as IssuePriority,
    location: "",
    lat: 0,
    lng: 0,
    image: "",
  });
  const [selectedMapPin, setSelectedMapPin] = useState<number | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  function canAdvance() {
    if (step === 1) return form.title.length > 5 && form.category && form.description.length > 10;
    if (step === 2) return form.location !== "";
    return true;
  }

  async function handleSubmit() {
    const newIssue: Issue = {
      title: form.title,
      description: form.description,
      category: form.category as IssueCategory,
      priority: form.priority,
      status: "new",
      location: form.location,
      lat: form.lat || 40.7128,
      lng: form.lng || -74.006,
      votes: 1,
      comments: 0,
      reportedBy: user?.uid ?? "",
      reportedAt: new Date().toISOString().split("T")[0],
      image: uploadedImage || form.image,
      tags: [form.category as string, form.priority],
    };
    await addIssue(newIssue);
    setSubmitted(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImage(url);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center pt-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="text-center max-w-md px-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
            className="w-24 h-24 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: "0 0 48px rgba(16,185,129,0.3)" }}
          >
            <CheckCircle2 size={40} className="text-emerald-400" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-white mb-3"
          >
            Issue Reported!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-slate-400 mb-2"
          >
            Your report has been submitted to the city. You'll earn{" "}
            <span className="text-blue-400 font-semibold">+50 civic points</span> once it's verified.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-slate-500 mb-8"
          >
            Tracking ID: #{`URB${Date.now().toString().slice(-6)}`}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-3 justify-center"
          >
            <button
              onClick={() => { setSubmitted(false); setStep(1); setForm({ title: "", description: "", category: "", priority: "medium", location: "", lat: 0, lng: 0, image: "" }); setUploadedImage(""); }}
              className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/8 text-white text-sm font-medium hover:bg-white/12 transition-all"
            >
              Report Another
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-[0_0_16px_rgba(59,130,246,0.4)]"
            >
              View Dashboard
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white pt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight">Report a Civic Issue</h1>
          <p className="text-slate-400 mt-2 text-sm">Help improve your city by reporting problems in your area</p>
        </motion.div>

        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {/* Progress bar */}
          <div className="h-1 bg-white/8 rounded-full mb-5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
              animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
          <div className="flex items-center justify-between">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step > s.id
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                      : step === s.id
                      ? "bg-blue-600/25 border border-blue-500/50 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                      : "bg-white/5 border border-white/10 text-slate-500"
                  }`}
                >
                  {step > s.id ? <CheckCircle2 size={14} /> : <s.icon size={14} />}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${step === s.id ? "text-blue-300" : "text-slate-500"}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.8)] backdrop-blur-sm p-6 mb-6"
          key={step}
        >
          {/* Step 1: Issue Details */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Describe the Issue</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Large pothole blocking traffic on Oak Street"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Category *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all ${
                        form.category === cat.value
                          ? "border-blue-500/50 bg-blue-500/15 text-white"
                          : "border-white/8 bg-white/3 text-slate-400 hover:border-white/15 hover:text-white"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: cat.color + "20" }}
                      >
                        <cat.icon size={13} style={{ color: cat.color }} />
                      </div>
                      <span className="text-xs leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Priority *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                      className={`px-3 py-3 rounded-xl border text-center transition-all ${
                        form.priority === p.value
                          ? "border-opacity-60 text-white"
                          : "border-white/8 bg-white/3 text-slate-400 hover:border-white/15 hover:text-white"
                      }`}
                      style={form.priority === p.value ? {
                        borderColor: p.color + "80",
                        backgroundColor: p.color + "15",
                      } : {}}
                    >
                      <div className="text-sm font-semibold" style={form.priority === p.value ? { color: p.color } : {}}>{p.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Provide as much detail as possible — size, duration, impact on residents..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all resize-none"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-slate-500">{form.description.length}/500</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Pin the Location</h2>
              <p className="text-sm text-slate-400">Select the area on the map or choose from common locations</p>

              {/* Interactive SVG Map */}
              <div className="rounded-xl overflow-hidden border border-blue-500/15 bg-[#050816]">
                <svg
                  viewBox="0 0 320 300"
                  className="w-full"
                  style={{ cursor: "crosshair" }}
                >
                  {/* Map background */}
                  <rect width="320" height="300" fill="#070d1a" />

                  {/* Grid */}
                  {[40, 80, 120, 160, 200, 240, 280].map(x => (
                    <line key={`v${x}`} x1={x} y1="0" x2={x} y2="300" stroke="rgba(59,130,246,0.07)" strokeWidth="0.5" />
                  ))}
                  {[40, 80, 120, 160, 200, 240, 260].map(y => (
                    <line key={`h${y}`} x1="0" y1={y} x2="320" y2={y} stroke="rgba(59,130,246,0.07)" strokeWidth="0.5" />
                  ))}

                  {/* Roads */}
                  <rect x="0" y="138" width="320" height="14" fill="rgba(59,130,246,0.06)" />
                  <rect x="0" y="188" width="320" height="10" fill="rgba(59,130,246,0.04)" />
                  <rect x="138" y="0" width="14" height="300" fill="rgba(59,130,246,0.06)" />
                  <rect x="228" y="0" width="10" height="300" fill="rgba(59,130,246,0.04)" />

                  {/* Blocks */}
                  {[
                    { x: 10, y: 10, w: 110, h: 110 },
                    { x: 160, y: 10, w: 60, h: 110 },
                    { x: 230, y: 10, w: 80, h: 110 },
                    { x: 10, y: 160, w: 110, h: 60 },
                    { x: 10, y: 230, w: 110, h: 60 },
                    { x: 160, y: 160, w: 60, h: 60 },
                    { x: 230, y: 160, w: 80, h: 60 },
                    { x: 160, y: 230, w: 150, h: 60 },
                  ].map((b, i) => (
                    <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill="rgba(59,130,246,0.04)" rx="2" stroke="rgba(59,130,246,0.08)" strokeWidth="0.5" />
                  ))}

                  {/* Location pins */}
                  {CITY_LOCATIONS.map((loc) => (
                    <g
                      key={loc.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedMapPin(loc.id);
                        setForm(f => ({ ...f, location: loc.label, lat: 40.71 + loc.y * 0.0001, lng: -74 + loc.x * 0.0001 }));
                      }}
                    >
                      {selectedMapPin === loc.id && (
                        <circle cx={loc.x} cy={loc.y} r="16" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3">
                          <animateTransform attributeName="transform" type="rotate" from={`0 ${loc.x} ${loc.y}`} to={`360 ${loc.x} ${loc.y}`} dur="8s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle
                        cx={loc.x} cy={loc.y} r={selectedMapPin === loc.id ? 7 : 5}
                        fill={selectedMapPin === loc.id ? "#3b82f6" : "rgba(59,130,246,0.4)"}
                        stroke={selectedMapPin === loc.id ? "#60a5fa" : "rgba(59,130,246,0.3)"}
                        strokeWidth="1.5"
                      />
                      {selectedMapPin === loc.id && (
                        <text x={loc.x + 10} y={loc.y + 4} fill="#93c5fd" fontSize="8" fontFamily="Inter">{loc.label}</text>
                      )}
                    </g>
                  ))}

                  <text x="160" y="295" fill="rgba(100,116,139,0.6)" fontSize="8" textAnchor="middle" fontFamily="Inter">Click a location pin to select</text>
                </svg>
              </div>

              {/* Location list */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Or select area</label>
                <div className="grid grid-cols-2 gap-2">
                  {CITY_LOCATIONS.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        setSelectedMapPin(loc.id);
                        setForm(f => ({ ...f, location: loc.label, lat: 40.71 + loc.y * 0.0001, lng: -74 + loc.x * 0.0001 }));
                      }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                        form.location === loc.label
                          ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                          : "border-white/8 bg-white/3 text-slate-400 hover:border-white/15 hover:text-white"
                      }`}
                    >
                      <MapPin size={11} className={form.location === loc.label ? "text-blue-400" : "text-slate-500"} />
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.location && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <MapPin size={14} className="text-blue-400" />
                  <span className="text-sm text-blue-300 font-medium">{form.location}</span>
                  <button onClick={() => { setForm(f => ({ ...f, location: "" })); setSelectedMapPin(null); }} className="ml-auto text-slate-400 hover:text-white">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Photos */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Add Photo Evidence</h2>
              <p className="text-sm text-slate-400">Photos significantly increase the chance your issue gets resolved quickly</p>

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-white/15 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-all">
                  <Upload size={22} className="text-blue-400" />
                </div>
                <p className="text-white font-medium mb-1">Click to upload photo</p>
                <p className="text-xs text-slate-400">PNG, JPG, WEBP up to 10MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              {uploadedImage && (
                <div className="relative rounded-2xl overflow-hidden border border-white/10">
                  <img src={uploadedImage} alt="Uploaded" className="w-full h-48 object-cover" />
                  <button
                    onClick={() => setUploadedImage("")}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-all"
                  >
                    <X size={13} className="text-white" />
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-500 text-center">You can also skip this step and add photos later</p>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-white">Review Your Report</h2>
              <p className="text-sm text-slate-400">Make sure everything looks correct before submitting</p>

              <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
                {(uploadedImage || form.image) && (
                  <img src={uploadedImage || form.image} alt="Issue" className="w-full h-40 object-cover" />
                )}
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-white">{form.title || "Untitled Issue"}</h3>
                  <p className="text-sm text-slate-400">{form.description}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.category && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/20">{form.category}</span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/20 capitalize">{form.priority} priority</span>
                    {form.location && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/8 text-slate-300 flex items-center gap-1">
                        <MapPin size={9} /> {form.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                  <p className="text-xs text-slate-400 mb-1">Reported By</p>
                  <p className="font-medium text-white">{user?.name ?? "You"}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                  <p className="text-xs text-slate-400 mb-1">Date</p>
                  <p className="font-medium text-white">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/8 border border-blue-500/20">
                <Zap size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300">
                  Submitting this report will earn you <span className="text-blue-400 font-semibold">+50 civic points</span> toward your community rank.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <span className="text-xs text-slate-500 font-medium">Step {step} of {STEPS.length}</span>

          {step < STEPS.length ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-[0_0_16px_rgba(59,130,246,0.3)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-[0_0_16px_rgba(16,185,129,0.3)]"
            >
              <Send size={14} /> Submit Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}