import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, X, ArrowUp, Filter, Search, Layers, ChevronDown,
  Satellite, Map, Navigation, AlertTriangle, Flame, Eye, ZoomIn, ZoomOut
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { CATEGORY_COLOR, PRIORITY_COLOR, IssueCategory } from "../data/mockData";

// ── Leaflet loaded via CDN in useEffect ──────────────────────────────────────
declare const L: any;

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const INDIA_ZOOM = 5;

// Hotspot radius in meters — issues within this radius are clustered
const HOTSPOT_RADIUS = 2000;

const TILE_LAYERS = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    label: "Satellite",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    label: "Dark",
  },
  hybrid: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    label: "Hybrid",
    labels: "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
  },
};

function categoryColor(cat: string) {
  return CATEGORY_COLOR[cat as IssueCategory] ?? "#6366f1";
}

export default function MapView() {
  const { issues, upvoteIssue, user } = useApp();
  const mapRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<any>(null);
  const labelLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const hotspotsRef = useRef<any[]>([]);
  const droppedPinRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  const [leafletReady, setLeafletReady] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [tileMode, setTileMode] = useState<keyof typeof TILE_LAYERS>("satellite");
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | IssueCategory>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "in_progress" | "resolved">("all");
  const [search, setSearch] = useState("");
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [cloudAnim, setCloudAnim] = useState<"" | "zooming-in" | "zooming-out">("");
  const [zoomLevel, setZoomLevel] = useState(INDIA_ZOOM);
  const cloudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pinMode, setPinMode] = useState(false);
  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [toast, setToast] = useState("");

  const selectedIssue = issues.find(i => i.id === selected);

  const filtered = issues.filter(i => {
    if (filter !== "all" && i.category !== filter) return false;
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) &&
        !i.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── Load Leaflet CSS + JS from CDN ──────────────────────────────────────
  useEffect(() => {
    if ((window as any).L) { setLeafletReady(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  // ── Init map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      center: INDIA_CENTER,
      zoom: INDIA_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });

    // Dark satellite tile
    const layer = L.tileLayer(TILE_LAYERS.satellite.url, {
      attribution: TILE_LAYERS.satellite.attribution,
      maxZoom: 19,
    }).addTo(map);
    tileLayerRef.current = layer;

    // Custom attribution styling
    map.attributionControl.setPrefix(false);

    mapRef.current = map;
    setMapReady(true);

    // Cloud animation on zoom — detect direction
    let prevZoom = INDIA_ZOOM;
    map.on("zoomstart", () => {
      const currentZoom = map.getZoom();
      const dir = currentZoom > prevZoom ? "zooming-in" : "zooming-out";
      setCloudAnim("");
      requestAnimationFrame(() => requestAnimationFrame(() => setCloudAnim(dir)));
      if (cloudTimerRef.current) clearTimeout(cloudTimerRef.current);
    });
    map.on("zoomend", () => {
      prevZoom = map.getZoom();
      setZoomLevel(map.getZoom());
      cloudTimerRef.current = setTimeout(() => setCloudAnim(""), 1200);
    });

    // Click handler for pin mode
    map.on("click", async (e: any) => {
      if (!(window as any).__pinMode) return;
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      setDroppedPin({ lat, lng, address });
      showDroppedPin(map, lat, lng, address);
      showToast("📍 Pin dropped!");
    });
  }, [leafletReady]);

  // ── Switch tile layer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    if (labelLayerRef.current) map.removeLayer(labelLayerRef.current);

    const cfg = TILE_LAYERS[tileMode];
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: 19,
    }).addTo(map);

    if ((cfg as any).labels) {
      labelLayerRef.current = L.tileLayer((cfg as any).labels, {
        maxZoom: 19,
        opacity: 0.9,
      }).addTo(map);
    }
  }, [tileMode, mapReady]);

  // ── Render issue markers ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    filtered.forEach(issue => {
      if (!issue.lat || !issue.lng) return;
      const color = categoryColor(issue.category);
      const isNew = issue.status === "new";
      const isCritical = issue.priority === "critical";

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
            ${isNew ? `<div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color};opacity:0.5;animation:mapPulse 2s ease-out infinite;"></div>` : ""}
            <div style="
              width:28px;height:28px;border-radius:50%;
              background:${color}22;
              border:2px solid ${color};
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 0 12px ${color}55;
              cursor:pointer;
            ">
              <div style="width:10px;height:10px;border-radius:50%;background:${color};"></div>
            </div>
            ${isCritical ? `<div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;border-radius:50%;background:#ef4444;border:1.5px solid #fff;font-size:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;">!</div>` : ""}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([issue.lat, issue.lng], { icon })
        .addTo(map)
        .on("click", () => setSelected(id => id === issue.id ? null : issue.id));

      markersRef.current.push(marker);
    });
  }, [filtered, mapReady]);

  // ── Render hotspot circles ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    hotspotsRef.current.forEach(h => map.removeLayer(h));
    hotspotsRef.current = [];

    if (!showHotspots) return;

    // Group issues by proximity
    const groups: { lat: number; lng: number; count: number; category: string }[] = [];
    filtered.forEach(issue => {
      if (!issue.lat || !issue.lng) return;
      const existing = groups.find(g => {
        const dlat = g.lat - issue.lat;
        const dlng = g.lng - issue.lng;
        return Math.sqrt(dlat * dlat + dlng * dlng) < 0.05;
      });
      if (existing) {
        existing.count++;
      } else {
        groups.push({ lat: issue.lat, lng: issue.lng, count: 1, category: issue.category });
      }
    });

    groups.filter(g => g.count >= 2).forEach(g => {
      const intensity = Math.min(g.count / 5, 1);
      const color = g.count >= 4 ? "#ef4444" : g.count >= 3 ? "#f97316" : "#eab308";
      const circle = L.circle([g.lat, g.lng], {
        radius: HOTSPOT_RADIUS * (0.5 + intensity),
        color: color,
        fillColor: color,
        fillOpacity: 0.08 + intensity * 0.1,
        weight: 1.5,
        dashArray: "6 4",
      }).addTo(map);

      circle.bindTooltip(`🔥 Hotspot: ${g.count} issues nearby`, {
        className: "leaflet-dark-tooltip",
        sticky: true,
      });

      hotspotsRef.current.push(circle);
    });
  }, [filtered, showHotspots, mapReady]);

  // ── Fly to selected issue ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedIssue) return;
    if (selectedIssue.lat && selectedIssue.lng) {
      mapRef.current.flyTo([selectedIssue.lat, selectedIssue.lng], 15, { duration: 1.2 });
    }
  }, [selected, mapReady]);

  // ── Pin mode sync to window ───────────────────────────────────────────────
  useEffect(() => {
    (window as any).__pinMode = pinMode;
    if (mapRef.current) {
      mapRef.current.getContainer().style.cursor = pinMode ? "crosshair" : "";
    }
  }, [pinMode]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      return data.display_name?.split(",").slice(0, 3).join(", ") ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  function showDroppedPin(map: any, lat: number, lng: number, address: string) {
    if (droppedPinRef.current) map.removeLayer(droppedPinRef.current);
    const icon = L.divIcon({
      className: "",
      html: `<div style="font-size:28px;filter:drop-shadow(0 0 8px rgba(59,130,246,0.8));transform:translateY(-14px);">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });
    const marker = L.marker([lat, lng], { icon }).addTo(map);
    marker.bindTooltip(address, { className: "leaflet-dark-tooltip", permanent: false });
    droppedPinRef.current = marker;
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function handleGPS() {
    if (!navigator.geolocation) { setGpsError("GPS not supported"); return; }
    setGpsLoading(true); setGpsError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        setGpsLoading(false);

        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 14, { duration: 1.5 });
          // Blue pulsing user location dot
          if (userMarkerRef.current) mapRef.current.removeLayer(userMarkerRef.current);
          const icon = L.divIcon({
            className: "",
            html: `
              <div style="position:relative;width:20px;height:20px;">
                <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(59,130,246,0.2);animation:mapPulse 2s ease-out infinite;"></div>
                <div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 12px rgba(59,130,246,0.8);"></div>
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          const address = await reverseGeocode(lat, lng);
          userMarkerRef.current = L.marker([lat, lng], { icon }).addTo(mapRef.current);
          userMarkerRef.current.bindTooltip(`📍 You are here: ${address}`, {
            className: "leaflet-dark-tooltip",
            permanent: false,
          });
          showToast("📍 Located you!");
        }
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(err.code === 1 ? "Location permission denied" : "Could not get location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleVote(id: string) {
    if (votedIds.has(id)) return;
    upvoteIssue(id);
    setVotedIds(prev => new Set([...prev, id]));
  }

  function flyToIndia() {
    mapRef.current?.flyTo(INDIA_CENTER, INDIA_ZOOM, { duration: 1.5 });
  }

  const categories = ["Infrastructure", "Safety", "Environment", "Utilities", "Traffic", "Public Spaces"] as const;

  return (
    <div className="min-h-screen bg-[#050816] text-white pt-16 flex flex-col">
      {/* Pulse animation injected globally */}
      <style>{`
        @keyframes mapPulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0;   }
        }

        /* ── individual cloud masses drifting (subtle parallax, edges already broken up by turbulence filters) ── */
        @keyframes cloudDrift1 {
          0%,100% { transform: translate(-8px,  0px) scale(1);     }
          50%      { transform: translate( 10px, -6px) scale(1.04); }
        }
        @keyframes cloudDrift2 {
          0%,100% { transform: translate( 9px,  0px) scale(1);     }
          50%      { transform: translate(-12px,  7px) scale(0.97); }
        }
        @keyframes cloudDrift3 {
          0%,100% { transform: translate(  0px, -4px) scale(1);    }
          50%      { transform: translate(  7px,  5px) scale(1.03); }
        }
        @keyframes cloudDrift4 {
          0%,100% { transform: translate(-10px,  4px) scale(1);    }
          60%      { transform: translate(  5px, -7px) scale(0.96); }
        }
        @keyframes cloudDrift5 {
          0%,100% { transform: translate(  5px, -2px) scale(1);    }
          45%      { transform: translate(-8px,  4px) scale(1.02); }
        }

        /* ── whole overlay: a continuous fly-through arc instead of a flat fade ──
           scale, blur and brightness all evolve together so it reads as moving
           THROUGH a volume of cloud rather than a sprite fading in and out ── */
        @keyframes cloudZoomIn {
          0%   { opacity: 0;    transform: scale(0.6);  filter: blur(1px)  brightness(1)    saturate(1);   }
          14%  { opacity: 1;    transform: scale(0.9);  filter: blur(0px)  brightness(1.1)  saturate(1.05); }
          48%  { opacity: 1;    transform: scale(1.22); filter: blur(0px)  brightness(1.18) saturate(1.1);  }
          78%  { opacity: 0.85; transform: scale(1.68); filter: blur(4px)  brightness(1.05) saturate(1);    }
          100% { opacity: 0;    transform: scale(2.1);  filter: blur(13px) brightness(1)    saturate(1);   }
        }
        @keyframes cloudZoomOut {
          0%   { opacity: 0;    transform: scale(2.1);  filter: blur(13px) brightness(1)    saturate(1);   }
          22%  { opacity: 0.85; transform: scale(1.68); filter: blur(4px)  brightness(1.05) saturate(1);    }
          52%  { opacity: 1;    transform: scale(1.22); filter: blur(0px)  brightness(1.18) saturate(1.1);  }
          86%  { opacity: 1;    transform: scale(0.9);  filter: blur(0px)  brightness(1.1)  saturate(1.05); }
          100% { opacity: 0;    transform: scale(0.6);  filter: blur(1px)  brightness(1)    saturate(1);   }
        }

        /* ── brief inner flash as the camera passes through the densest part of the cloud ── */
        @keyframes cloudCoreFlash {
          0%, 100% { opacity: 0; }
          42%      { opacity: 0; }
          52%      { opacity: 0.85; }
          64%      { opacity: 0.25; }
          76%      { opacity: 0; }
        }

        /* ── thin streaks of light that race past, selling a sense of speed ── */
        @keyframes cloudStreak {
          0%   { opacity: 0;    transform: translateX(-70px) scaleX(0.5); }
          38%  { opacity: 0.6;  transform: translateX(0px)   scaleX(1.2); }
          70%  { opacity: 0.25; transform: translateX(60px)  scaleX(1.6); }
          100% { opacity: 0;    transform: translateX(130px) scaleX(1.9); }
        }

        /* ── veil that covers the map during tile swap ── */
        .cloud-layer {
          position: absolute; inset: 0; z-index: 990; pointer-events: none;
          opacity: 0;
        }
        .cloud-layer.zooming-in  { animation: cloudZoomIn  1.3s cubic-bezier(0.16,1,0.3,1) forwards; }
        .cloud-layer.zooming-out { animation: cloudZoomOut 1.3s cubic-bezier(0.16,1,0.3,1) forwards; }
        .cloud-svg { width: 100%; height: 100%; }
        .cloud-flash { mix-blend-mode: screen; animation: cloudCoreFlash 1.3s ease-out forwards; }
        .cloud-streak { mix-blend-mode: screen; animation: cloudStreak 1.1s ease-out 0.1s forwards; }
        .cloud-layer.zooming-out .cloud-streak { animation-direction: reverse; }

        /* ── leaflet overrides ── */
        .leaflet-dark-tooltip {
          background: rgba(7,13,26,0.95) !important;
          border: 1px solid rgba(59,130,246,0.3) !important;
          color: #e2e8f0 !important; font-size: 12px !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
          padding: 6px 10px !important;
        }
        .leaflet-dark-tooltip::before { display: none !important; }
        .leaflet-attribution-flag     { display: none !important; }
        .leaflet-control-attribution  {
          background: rgba(7,13,26,0.8) !important;
          color: rgba(100,116,139,0.6) !important; font-size: 10px !important;
        }
        .leaflet-control-attribution a { color: rgba(100,116,139,0.8) !important; }
      `}</style>

      {/* Header */}
      <div className="max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-5">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Live City Map</h1>
            <p className="text-slate-400 text-sm mt-1">Real-time civic issues across India — GPS-tracked, hotspot-analyzed</p>
          </div>

          {/* Tile switcher */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
            {(Object.keys(TILE_LAYERS) as (keyof typeof TILE_LAYERS)[]).map(mode => (
              <button key={mode} onClick={() => setTileMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${tileMode === mode ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]" : "text-slate-400 hover:text-white"}`}>
                {mode === "satellite" ? <Satellite size={12} /> : mode === "dark" ? <Map size={12} /> : <Layers size={12} />}
                {TILE_LAYERS[mode].label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Controls row */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-4">

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search issues or locations..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-56" />
          </div>

          {/* Status filter */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8">
            {(["all", "new", "in_progress", "resolved"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize ${statusFilter === s ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-slate-400 hover:text-white"}`}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Category filter toggle */}
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${showFilters ? "border-blue-500/40 bg-blue-500/15 text-blue-300" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}>
            <Filter size={12} /> Categories <ChevronDown size={11} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>

          {/* Hotspots toggle */}
          <button onClick={() => setShowHotspots(h => !h)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${showHotspots ? "border-orange-500/40 bg-orange-500/15 text-orange-300" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}>
            <Flame size={12} /> Hotspots {showHotspots ? "ON" : "OFF"}
          </button>

          {/* GPS */}
          <button onClick={handleGPS} disabled={gpsLoading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${userLocation ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"} disabled:opacity-50`}>
            <Navigation size={12} className={gpsLoading ? "animate-spin" : ""} />
            {gpsLoading ? "Locating..." : userLocation ? "Located ✓" : "My Location"}
          </button>

          {/* Pin drop */}
          <button onClick={() => { setPinMode(p => !p); if (pinMode) { if (droppedPinRef.current && mapRef.current) mapRef.current.removeLayer(droppedPinRef.current); setDroppedPin(null); } }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${pinMode ? "border-blue-500/60 bg-blue-500/20 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}>
            <MapPin size={12} /> {pinMode ? "Click map to pin..." : "Drop Pin"}
          </button>

          {/* Zoom to India */}
          <button onClick={flyToIndia}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white text-xs font-medium transition-all">
            <Eye size={12} /> All India
          </button>
        </motion.div>

        {/* Category pills */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
              <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-white/8 bg-[rgba(11,16,32,0.8)]">
                <button onClick={() => setFilter("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filter === "all" ? "bg-white/15 text-white border-white/20" : "border-white/8 text-slate-400 hover:text-white"}`}>
                  All
                </button>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setFilter(filter === cat ? "all" : cat)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={filter === cat
                      ? { borderColor: categoryColor(cat) + "60", backgroundColor: categoryColor(cat) + "20", color: categoryColor(cat) }
                      : { borderColor: "rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: categoryColor(cat) }} />
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GPS error */}
        {gpsError && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle size={12} /> {gpsError}
            <button onClick={() => setGpsError("")} className="ml-auto"><X size={11} /></button>
          </div>
        )}

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-3 px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-200 text-sm font-medium w-fit">
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map + Sidebar */}
      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 pb-6">
        <div className="grid lg:grid-cols-4 gap-4 h-full" style={{ minHeight: 560 }}>

          {/* Map */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="lg:col-span-3 rounded-2xl overflow-hidden border border-blue-500/15 relative"
            style={{ minHeight: 500 }}>

            {/* Map container */}
            <div ref={mapDivRef} style={{ width: "100%", height: "100%", minHeight: 500 }} />

            {/* ── Cloud zoom animation overlay ── */}
            {cloudAnim && (
              <div key={cloudAnim + Date.now()} className={`cloud-layer ${cloudAnim}`}>
                <svg className="cloud-svg" viewBox="0 0 900 560" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    {/* Wide ambient blur for the background haze — generous region so the falloff
                        never gets clipped into a hard rectangle */}
                    <filter id="ambBlur" x="-100%" y="-100%" width="300%" height="300%">
                      <feGaussianBlur stdDeviation="55"/>
                    </filter>

                    {/* Turbulence-warped cloud filters — these bend the clean ellipse edges into
                        irregular, wispy silhouettes instead of flat geometric blobs, and use very
                        generous filter regions so the soft blur is never clipped (the old "blocky"
                        edges came from tight filter regions cutting the blur off mid-falloff) */}
                    <filter id="wispBig" x="-140%" y="-140%" width="380%" height="380%" colorInterpolationFilters="sRGB">
                      <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves="3" seed="11" result="n"/>
                      <feDisplacementMap in="SourceGraphic" in2="n" scale="95" xChannelSelector="R" yChannelSelector="G" result="d"/>
                      <feGaussianBlur in="d" stdDeviation="20"/>
                    </filter>
                    <filter id="wispMid" x="-130%" y="-130%" width="360%" height="360%" colorInterpolationFilters="sRGB">
                      <feTurbulence type="fractalNoise" baseFrequency="0.011 0.019" numOctaves="3" seed="5" result="n"/>
                      <feDisplacementMap in="SourceGraphic" in2="n" scale="62" xChannelSelector="R" yChannelSelector="G" result="d"/>
                      <feGaussianBlur in="d" stdDeviation="11"/>
                    </filter>
                    <filter id="wispFine" x="-120%" y="-120%" width="340%" height="340%" colorInterpolationFilters="sRGB">
                      <feTurbulence type="fractalNoise" baseFrequency="0.02 0.034" numOctaves="2" seed="2" result="n"/>
                      <feDisplacementMap in="SourceGraphic" in2="n" scale="38" xChannelSelector="R" yChannelSelector="G" result="d"/>
                      <feGaussianBlur in="d" stdDeviation="5"/>
                    </filter>
                    <filter id="streakBlur" x="-150%" y="-150%" width="400%" height="400%">
                      <feGaussianBlur stdDeviation="4"/>
                    </filter>
                    {/* Very fine grain — breaks up the smooth gradients so they read as soft
                        vapour rather than flat printed shapes */}
                    <filter id="grainFilter" x="0%" y="0%" width="100%" height="100%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9" stitchTiles="stitch" result="n"/>
                      <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0"/>
                    </filter>

                    {/* Cloud gradients — many small stops so the alpha falloff is a smooth
                        curve instead of a few hard jumps (hard jumps + blur = visible banding) */}
                    <radialGradient id="cgWarm" cx="50%" cy="38%" r="50%">
                      <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.95"/>
                      <stop offset="18%"  stopColor="#f5f9ff" stopOpacity="0.88"/>
                      <stop offset="36%"  stopColor="#e1ecfb" stopOpacity="0.72"/>
                      <stop offset="55%"  stopColor="#c4d9f3" stopOpacity="0.52"/>
                      <stop offset="72%"  stopColor="#a6c2e8" stopOpacity="0.30"/>
                      <stop offset="88%"  stopColor="#8eaedd" stopOpacity="0.12"/>
                      <stop offset="100%" stopColor="#82a4d6" stopOpacity="0"/>
                    </radialGradient>
                    <radialGradient id="cgCool" cx="50%" cy="58%" r="50%">
                      <stop offset="0%"   stopColor="#eef4ff" stopOpacity="0.85"/>
                      <stop offset="20%"  stopColor="#dbe7fa" stopOpacity="0.76"/>
                      <stop offset="40%"  stopColor="#bdd2f0" stopOpacity="0.60"/>
                      <stop offset="60%"  stopColor="#9fbbe4" stopOpacity="0.42"/>
                      <stop offset="80%"  stopColor="#83a4d6" stopOpacity="0.18"/>
                      <stop offset="100%" stopColor="#7295c9" stopOpacity="0"/>
                    </radialGradient>
                    {/* Atmospheric haze — deep blue tint */}
                    <radialGradient id="haze" cx="50%" cy="50%" r="50%">
                      <stop offset="0%"   stopColor="#1a3a6e" stopOpacity="0.18"/>
                      <stop offset="50%"  stopColor="#142e58" stopOpacity="0.08"/>
                      <stop offset="100%" stopColor="#0a1830" stopOpacity="0"/>
                    </radialGradient>
                    {/* Bright core flash — the brief whiteout as the camera passes the densest part */}
                    <radialGradient id="coreFlash" cx="50%" cy="50%" r="50%">
                      <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.95"/>
                      <stop offset="30%"  stopColor="#f0f6ff" stopOpacity="0.55"/>
                      <stop offset="65%"  stopColor="#dce8fb" stopOpacity="0.18"/>
                      <stop offset="100%" stopColor="#dce8fb" stopOpacity="0"/>
                    </radialGradient>
                    <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%"   stopColor="#ffffff" stopOpacity="0"/>
                      <stop offset="50%"  stopColor="#eaf3ff" stopOpacity="0.9"/>
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
                    </linearGradient>
                  </defs>

                  {/* === Atmospheric background haze === */}
                  <ellipse cx="450" cy="280" rx="480" ry="300" fill="url(#haze)" filter="url(#ambBlur)" />

                  {/* === Cloud masses — each is a soft warm/cool gradient pushed through a
                      turbulence displacement, so the silhouette is fluffy and irregular rather
                      than a clean ellipse. mix-blend-mode:screen makes them glow over the dark
                      map like light, instead of sitting on top like flat cut-out shapes. === */}
                  <g style={{ mixBlendMode: "screen" }}>
                    <g style={{ animation: "cloudDrift1 7s ease-in-out infinite", transformOrigin: "195px 115px" }}>
                      <ellipse cx="195" cy="140" rx="230" ry="120" fill="url(#cgWarm)" filter="url(#wispBig)" />
                      <ellipse cx="150" cy="100" rx="150" ry="85"  fill="url(#cgWarm)" filter="url(#wispMid)" />
                      <ellipse cx="240" cy="85"  rx="110" ry="62"  fill="url(#cgCool)" filter="url(#wispMid)" />
                      <ellipse cx="120" cy="128" rx="68"  ry="40"  fill="url(#cgWarm)" filter="url(#wispFine)" />
                    </g>

                    <g style={{ animation: "cloudDrift2 9s ease-in-out infinite", transformOrigin: "740px 72px" }}>
                      <ellipse cx="740" cy="85"  rx="200" ry="95"  fill="url(#cgCool)" filter="url(#wispBig)" />
                      <ellipse cx="785" cy="55"  rx="120" ry="65"  fill="url(#cgWarm)" filter="url(#wispMid)" />
                      <ellipse cx="695" cy="62"  rx="95"  ry="52"  fill="url(#cgCool)" filter="url(#wispMid)" />
                      <ellipse cx="838" cy="78"  rx="62"  ry="36"  fill="url(#cgWarm)" filter="url(#wispFine)" />
                    </g>

                    <g style={{ animation: "cloudDrift3 12s ease-in-out infinite", transformOrigin: "450px 258px" }}>
                      <ellipse cx="450" cy="265" rx="290" ry="92"  fill="url(#cgCool)" filter="url(#wispBig)" />
                      <ellipse cx="392" cy="246" rx="168" ry="55"  fill="url(#cgWarm)" filter="url(#wispMid)" />
                      <ellipse cx="518" cy="240" rx="135" ry="50"  fill="url(#cgWarm)" filter="url(#wispMid)" />
                      <ellipse cx="338" cy="258" rx="85"  ry="36"  fill="url(#cgCool)" filter="url(#wispFine)" />
                      <ellipse cx="588" cy="256" rx="76"  ry="32"  fill="url(#cgCool)" filter="url(#wispFine)" />
                    </g>

                    <g style={{ animation: "cloudDrift4 8.5s ease-in-out infinite", transformOrigin: "145px 445px" }}>
                      <ellipse cx="145" cy="450" rx="215" ry="105" fill="url(#cgCool)" filter="url(#wispBig)" />
                      <ellipse cx="183" cy="416" rx="128" ry="68"  fill="url(#cgWarm)" filter="url(#wispMid)" />
                      <ellipse cx="88"  cy="438" rx="85"  ry="48"  fill="url(#cgWarm)" filter="url(#wispMid)" />
                      <ellipse cx="228" cy="433" rx="70"  ry="40"  fill="url(#cgCool)" filter="url(#wispFine)" />
                    </g>

                    <g style={{ animation: "cloudDrift5 10s ease-in-out infinite 1.2s", transformOrigin: "775px 468px" }}>
                      <ellipse cx="775" cy="472" rx="195" ry="95"  fill="url(#cgWarm)" filter="url(#wispBig)" />
                      <ellipse cx="733" cy="446" rx="108" ry="56"  fill="url(#cgCool)" filter="url(#wispMid)" />
                      <ellipse cx="828" cy="456" rx="118" ry="52"  fill="url(#cgWarm)" filter="url(#wispMid)" />
                      <ellipse cx="868" cy="474" rx="56"  ry="32"  fill="url(#cgCool)" filter="url(#wispFine)" />
                    </g>

                    <g style={{ animation: "cloudDrift2 13s ease-in-out infinite 2.4s", transformOrigin: "825px 302px" }}>
                      <ellipse cx="825" cy="305" rx="138" ry="62"  fill="url(#cgCool)" filter="url(#wispMid)" />
                      <ellipse cx="857" cy="286" rx="83"  ry="42"  fill="url(#cgWarm)" filter="url(#wispMid)" />
                      <ellipse cx="788" cy="313" rx="60"  ry="30"  fill="url(#cgCool)" filter="url(#wispFine)" />
                    </g>

                    <g style={{ animation: "cloudDrift1 10s ease-in-out infinite 3s", transformOrigin: "460px 48px" }}>
                      <ellipse cx="460" cy="50"  rx="160" ry="48"  fill="url(#cgWarm)" filter="url(#wispMid)" />
                      <ellipse cx="420" cy="36"  rx="94"  ry="32"  fill="url(#cgCool)" filter="url(#wispFine)" />
                      <ellipse cx="508" cy="40"  rx="80"  ry="28"  fill="url(#cgWarm)" filter="url(#wispFine)" />
                    </g>
                  </g>

                  {/* === Core flash — the brief brightening as the camera passes through the
                      thickest part of the cloud, mid-transition === */}
                  <circle cx="450" cy="270" r="270" fill="url(#coreFlash)" className="cloud-flash" />

                  {/* === Speed streaks — thin racing highlights that sell the sense of motion === */}
                  <g className="cloud-streak" style={{ transformOrigin: "230px 175px", animationDelay: "0s" }}>
                    <rect x="40" y="172" width="260" height="5" rx="2.5" fill="url(#streakGrad)" filter="url(#streakBlur)" transform="rotate(-14 170 175)" />
                  </g>
                  <g className="cloud-streak" style={{ transformOrigin: "650px 360px", animationDelay: "0.06s" }}>
                    <rect x="520" y="358" width="300" height="5" rx="2.5" fill="url(#streakGrad)" filter="url(#streakBlur)" transform="rotate(10 670 360)" />
                  </g>
                  <g className="cloud-streak" style={{ transformOrigin: "420px 400px", animationDelay: "0.12s" }}>
                    <rect x="280" y="398" width="220" height="4" rx="2" fill="url(#streakGrad)" filter="url(#streakBlur)" transform="rotate(-5 390 400)" />
                  </g>

                  {/* === Fine grain to break up the gradients into soft vapour, not flat shapes === */}
                  <rect width="900" height="560" filter="url(#grainFilter)" style={{ mixBlendMode: "screen" }} />
                  {/* === Subtle cool tint pass === */}
                  <rect width="900" height="560" fill="url(#haze)" opacity="0.35" style={{ mixBlendMode: "multiply" }} />
                </svg>
              </div>
            )}

            {/* Loading overlay */}
            {!mapReady && (
              <div className="absolute inset-0 bg-[#070d1a] flex items-center justify-center rounded-2xl z-10">
                <div className="text-center">
                  <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Loading map...</p>
                </div>
              </div>
            )}

            {/* Zoom controls */}
            {mapReady && (
              <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
                <button onClick={() => mapRef.current?.zoomIn()}
                  className="w-9 h-9 rounded-xl bg-[rgba(7,13,26,0.9)] border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all backdrop-blur-sm">
                  <ZoomIn size={15} />
                </button>
                <button onClick={() => mapRef.current?.zoomOut()}
                  className="w-9 h-9 rounded-xl bg-[rgba(7,13,26,0.9)] border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all backdrop-blur-sm">
                  <ZoomOut size={15} />
                </button>
              </div>
            )}

            {/* Pin mode badge */}
            {pinMode && (
              <div className="absolute top-3 left-3 z-[1000] px-3 py-2 rounded-xl bg-blue-600/90 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-2 shadow-[0_0_16px_rgba(59,130,246,0.5)]">
                <MapPin size={12} className="animate-bounce" /> Click anywhere to drop a pin
              </div>
            )}

            {/* Dropped pin info */}
            {droppedPin && !pinMode && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-3 right-3 z-[1000] px-4 py-3 rounded-xl bg-[rgba(7,13,26,0.95)] border border-blue-500/30 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <MapPin size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white mb-0.5">Dropped Pin</p>
                    <p className="text-xs text-slate-400 truncate">{droppedPin.address}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{droppedPin.lat.toFixed(5)}, {droppedPin.lng.toFixed(5)}</p>
                  </div>
                  <button onClick={() => { if (droppedPinRef.current && mapRef.current) mapRef.current.removeLayer(droppedPinRef.current); setDroppedPin(null); }}
                    className="text-slate-400 hover:text-white flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Stats bar */}
            <div className="absolute bottom-0 left-0 right-0 z-[999] px-4 py-2.5 border-t border-white/5 bg-[rgba(7,13,26,0.9)] backdrop-blur-sm flex items-center gap-5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400" />{filtered.length} issues</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />{filtered.filter(i => i.status === "new").length} new</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" />{filtered.filter(i => i.status === "resolved").length} resolved</span>
              {showHotspots && <span className="flex items-center gap-1.5"><Flame size={10} className="text-orange-400" />Hotspots active</span>}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/8 bg-[rgba(11,16,32,0.9)] backdrop-blur-sm overflow-hidden flex flex-col"
            style={{ maxHeight: 600 }}>

            {selectedIssue ? (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-white/6 flex items-start justify-between flex-shrink-0">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: categoryColor(selectedIssue.category) + "20", color: categoryColor(selectedIssue.category) }}>
                        {selectedIssue.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                        selectedIssue.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" :
                        selectedIssue.status === "in_progress" ? "bg-blue-500/15 text-blue-400" : "bg-slate-500/15 text-slate-400"}`}>
                        {selectedIssue.status.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-snug">{selectedIssue.title}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white flex-shrink-0"><X size={15} /></button>
                </div>

                {selectedIssue.image && (
                  <div className="relative overflow-hidden flex-shrink-0" style={{ height: 140 }}>
                    <img src={selectedIssue.image} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1020] to-transparent" />
                  </div>
                )}

                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedIssue.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin size={10} /><span>{selectedIssue.location}</span>
                  </div>
                  {selectedIssue.lat && selectedIssue.lng && (
                    <div className="text-[10px] text-slate-600 font-mono">
                      {selectedIssue.lat.toFixed(5)}, {selectedIssue.lng.toFixed(5)}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-white/3 text-xs">
                      <div className="text-slate-500 mb-0.5">Reported by</div>
                      <div className="text-white font-medium truncate">{selectedIssue.reportedBy || "Anonymous"}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/3 text-xs">
                      <div className="text-slate-500 mb-0.5">Date</div>
                      <div className="text-white font-medium">{selectedIssue.reportedAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button onClick={() => handleVote(selectedIssue.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        votedIds.has(selectedIssue.id) ? "bg-blue-500/20 border-blue-500/40 text-blue-300" : "bg-white/5 border-white/10 text-slate-300 hover:border-blue-500/30 hover:text-blue-300"}`}>
                      <ArrowUp size={11} /> {selectedIssue.votes} votes
                    </button>
                  </div>
                  <button
                    onClick={() => { if (selectedIssue.lat && selectedIssue.lng && mapRef.current) { mapRef.current.flyTo([selectedIssue.lat, selectedIssue.lng], 17, { duration: 1 }); } }}
                    className="w-full px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-medium hover:bg-blue-600/30 transition-all flex items-center justify-center gap-1.5">
                    <Navigation size={11} /> Fly to location
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-white/6 flex-shrink-0">
                  <h3 className="text-sm font-semibold text-white">Issues</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{filtered.length} results — click to focus</p>
                </div>
                <div className="overflow-y-auto flex-1">
                  {filtered.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">No issues match your filters</div>
                  ) : (
                    filtered.map(issue => (
                      <button key={issue.id} onClick={() => setSelected(issue.id)}
                        className="w-full text-left p-3 hover:bg-white/4 transition-colors border-b border-white/4 last:border-0 group">
                        <div className="flex items-start gap-2.5">
                          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: categoryColor(issue.category) }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate group-hover:text-blue-200 transition-colors">{issue.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1"><MapPin size={8} />{issue.location}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize ${
                                issue.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" :
                                issue.status === "in_progress" ? "bg-blue-500/15 text-blue-400" : "bg-slate-500/15 text-slate-400"}`}>
                                {issue.status.replace("_", " ")}
                              </span>
                              {issue.priority === "critical" && <span className="text-[9px] text-red-400 font-bold">CRITICAL</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 text-[10px] text-slate-500 flex-shrink-0">
                            <ArrowUp size={8} />{issue.votes}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Legend */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mt-4 flex flex-wrap gap-4 items-center px-2">
          <span className="text-xs text-slate-500 font-medium">Legend:</span>
          {categories.map(cat => (
            <div key={cat} className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor(cat), boxShadow: `0 0 6px ${categoryColor(cat)}80` }} />
              {cat}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-3 h-3 rounded-full border border-dashed border-orange-400 bg-orange-400/10" />
            Hotspot zone
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
            Your location
          </div>
        </motion.div>
      </div>
    </div>
  );
}
