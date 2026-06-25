export type IssueCategory = "Infrastructure" | "Safety" | "Environment" | "Utilities" | "Traffic" | "Public Spaces";
export type IssuePriority = "low" | "medium" | "high" | "critical";
export type IssueStatus = "new" | "in_progress" | "resolved";

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  location: string;
  lat: number;
  lng: number;
  votes: number;
  comments: number;
  reportedBy: string;
  reportedAt: string;
  image?: string;
  tags: string[];
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  rank: string;
  points: number;
  issuesReported: number;
  issuesResolved: number;
  joinedAt: string;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  total: number;
}

export const CURRENT_USER: User = {
  id: "u1",
  name: "Alex Rivera",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format",
  rank: "City Champion",
  points: 4850,
  issuesReported: 47,
  issuesResolved: 38,
  joinedAt: "2023-03-15",
  badges: [
    { id: "b1", name: "First Report", description: "Submitted your first civic issue", icon: "🏙️", unlocked: true, progress: 1, total: 1 },
    { id: "b2", name: "Community Voice", description: "Reported 10+ issues", icon: "📢", unlocked: true, progress: 47, total: 10 },
    { id: "b3", name: "Problem Solver", description: "Had 25 issues resolved", icon: "✅", unlocked: true, progress: 38, total: 25 },
    { id: "b4", name: "Neighborhood Hero", description: "Earned 5000 civic points", icon: "🦸", unlocked: false, progress: 4850, total: 5000 },
    { id: "b5", name: "Trend Setter", description: "Get 100 upvotes on a single issue", icon: "🔥", unlocked: false, progress: 87, total: 100 },
    { id: "b6", name: "City Architect", description: "Report 100 issues", icon: "🏛️", unlocked: false, progress: 47, total: 100 },
  ],
};

export const ISSUES: Issue[] = [
  {
    id: "i1", title: "Large pothole on Maple Ave & 5th St", description: "A massive pothole has formed at the intersection, causing tire damage to numerous vehicles. The hole is approximately 2 feet wide and 8 inches deep.", category: "Infrastructure", priority: "critical", status: "in_progress", location: "Maple Ave & 5th St", lat: 40.7128, lng: -74.006, votes: 87, comments: 23, reportedBy: "Alex Rivera", reportedAt: "2024-01-15", tags: ["pothole", "road", "urgent"],
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop&auto=format"
  },
  {
    id: "i2", title: "Broken streetlight on Harbor Boulevard", description: "Streetlight has been out for 3 weeks. The area is very dark at night, creating safety concerns for pedestrians.", category: "Safety", priority: "high", status: "new", location: "Harbor Blvd, near Park", lat: 40.715, lng: -74.01, votes: 54, comments: 12, reportedBy: "Maria Chen", reportedAt: "2024-01-18", tags: ["streetlight", "safety", "night"],
    image: "https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400&h=200&fit=crop&auto=format"
  },
  {
    id: "i3", title: "Illegal dumping in Riverside Park", description: "Someone has been dumping construction waste in the park near the river trail. Multiple large piles of debris visible.", category: "Environment", priority: "high", status: "new", location: "Riverside Park, East Trail", lat: 40.71, lng: -73.998, votes: 41, comments: 9, reportedBy: "David Park", reportedAt: "2024-01-20", tags: ["dumping", "environment", "park"],
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=200&fit=crop&auto=format"
  },
  {
    id: "i4", title: "Water main leak flooding the sidewalk", description: "A water main has been leaking for 2 days, flooding the sidewalk and creating an icy hazard overnight.", category: "Utilities", priority: "critical", status: "in_progress", location: "Oak Street, Block 400", lat: 40.708, lng: -74.002, votes: 92, comments: 31, reportedBy: "Sarah Johnson", reportedAt: "2024-01-21", tags: ["water", "flooding", "utilities"],
    image: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=200&fit=crop&auto=format"
  },
  {
    id: "i5", title: "Traffic signal malfunction at Main & Broadway", description: "Traffic signal has been stuck on red for southbound traffic. Causing major backups during rush hour.", category: "Traffic", priority: "high", status: "in_progress", location: "Main St & Broadway", lat: 40.717, lng: -74.012, votes: 73, comments: 17, reportedBy: "James Wilson", reportedAt: "2024-01-19", tags: ["traffic", "signal", "rush hour"],
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=200&fit=crop&auto=format"
  },
  {
    id: "i6", title: "Vandalized playground equipment at Central Park", description: "The swing set has been vandalized — chains cut and seats missing. Children cannot use the equipment.", category: "Public Spaces", priority: "medium", status: "resolved", location: "Central Park, Section B", lat: 40.7052, lng: -73.994, votes: 38, comments: 14, reportedBy: "Lisa Thompson", reportedAt: "2024-01-10", tags: ["playground", "vandalism", "children"],
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=200&fit=crop&auto=format"
  },
  {
    id: "i7", title: "Overgrown tree branches blocking street signs", description: "Tree branches on Elm Street have grown over and completely obscure three road signs. Major navigation hazard.", category: "Infrastructure", priority: "medium", status: "resolved", location: "Elm Street, near Community Center", lat: 40.713, lng: -74.005, votes: 29, comments: 7, reportedBy: "Robert Kim", reportedAt: "2024-01-08", tags: ["trees", "signage", "visibility"],
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=200&fit=crop&auto=format"
  },
  {
    id: "i8", title: "Graffiti on historic library wall", description: "Someone has spray-painted graffiti on the east wall of the historic public library. Requires professional removal.", category: "Public Spaces", priority: "low", status: "new", location: "City Library, East Wall", lat: 40.709, lng: -73.999, votes: 21, comments: 5, reportedBy: "Emma Davis", reportedAt: "2024-01-22", tags: ["graffiti", "vandalism", "library"],
    image: "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=400&h=200&fit=crop&auto=format"
  },
];

export const WEEKLY_DATA = [
  { day: "Mon", reported: 12, resolved: 8, active: 45 },
  { day: "Tue", reported: 19, resolved: 14, active: 50 },
  { day: "Wed", reported: 8, resolved: 11, active: 47 },
  { day: "Thu", reported: 24, resolved: 9, active: 62 },
  { day: "Fri", reported: 17, resolved: 20, active: 59 },
  { day: "Sat", reported: 9, resolved: 13, active: 55 },
  { day: "Sun", reported: 6, resolved: 7, active: 54 },
];

export const MONTHLY_DATA = [
  { month: "Jul", reported: 89, resolved: 71 },
  { month: "Aug", reported: 104, resolved: 88 },
  { month: "Sep", reported: 97, resolved: 92 },
  { month: "Oct", reported: 118, resolved: 101 },
  { month: "Nov", reported: 88, resolved: 95 },
  { month: "Dec", reported: 76, resolved: 80 },
  { month: "Jan", reported: 95, resolved: 73 },
];

export const CATEGORY_DATA = [
  { name: "Infrastructure", value: 34, color: "#3b82f6" },
  { name: "Safety", value: 22, color: "#ef4444" },
  { name: "Environment", value: 18, color: "#10b981" },
  { name: "Utilities", value: 12, color: "#f59e0b" },
  { name: "Traffic", value: 9, color: "#8b5cf6" },
  { name: "Public Spaces", value: 5, color: "#06b6d4" },
];

export const LEADERBOARD = [
  { rank: 1, name: "Sophia Martinez", points: 7820, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&auto=format", badge: "City Guardian" },
  { rank: 2, name: "Noah Thompson", points: 6540, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&auto=format", badge: "Civic Pioneer" },
  { rank: 3, name: "Alex Rivera", points: 4850, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&auto=format", badge: "City Champion" },
  { rank: 4, name: "Emma Davis", points: 3920, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&auto=format", badge: "Community Star" },
  { rank: 5, name: "James Wilson", points: 3240, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&auto=format", badge: "Issue Tracker" },
];

export const ACTIVITY_LOG = [
  { id: "a1", type: "reported", title: "Reported: Pothole on Maple Ave", points: 50, date: "2024-01-21", icon: "📍" },
  { id: "a2", type: "upvoted", title: "Issue resolved: Broken streetlight", points: 100, date: "2024-01-20", icon: "✅" },
  { id: "a3", type: "badge", title: "Badge unlocked: Problem Solver", points: 200, date: "2024-01-19", icon: "🏆" },
  { id: "a4", type: "commented", title: "Commented on: Water main leak", points: 10, date: "2024-01-18", icon: "💬" },
  { id: "a5", type: "reported", title: "Reported: Traffic signal malfunction", points: 50, date: "2024-01-17", icon: "📍" },
  { id: "a6", type: "upvoted", title: "Upvoted: Graffiti on library wall", points: 5, date: "2024-01-16", icon: "⬆️" },
];

export const CATEGORY_COLOR: Record<IssueCategory, string> = {
  Infrastructure: "#3b82f6",
  Safety: "#ef4444",
  Environment: "#10b981",
  Utilities: "#f59e0b",
  Traffic: "#8b5cf6",
  "Public Spaces": "#06b6d4",
};

export const PRIORITY_COLOR: Record<IssuePriority, string> = {
  low: "#64748b",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};
