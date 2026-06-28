import {
  collection, addDoc, query, where, orderBy, onSnapshot, Unsubscribe
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Activity types tracked in the heatmap.
 * Each user action writes one document to the "userActivities" collection.
 */
export type ActivityType =
  | "issue_reported"
  | "issue_deleted"
  | "issue_upvoted"
  | "status_changed"
  | "fake_reported"
  | "reward_redeemed"
  | "profile_updated";

export interface UserActivity {
  id: string;
  uid: string;
  type: ActivityType;
  label: string;       // Human-readable description
  date: string;        // Local YYYY-MM-DD for easy heatmap lookup
  timestamp: string;   // Full ISO timestamp
  issueId?: string;    // Related issue (if applicable)
}

/** Format a Date to local YYYY-MM-DD. */
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Log a user activity to Firestore.
 * Fire-and-forget — doesn't block the calling function.
 */
export async function logActivity(
  uid: string,
  type: ActivityType,
  label: string,
  issueId?: string
): Promise<void> {
  try {
    const now = new Date();
    await addDoc(collection(db, "userActivities"), {
      uid,
      type,
      label,
      date: toLocalDateKey(now),
      timestamp: now.toISOString(),
      ...(issueId ? { issueId } : {}),
    });
  } catch (err) {
    // Activity logging should never break the main flow
    console.warn("Failed to log activity:", err);
  }
}

/**
 * Subscribe to a user's activity feed (real-time).
 * Returns an unsubscribe function.
 */
export function subscribeToActivities(
  uid: string,
  callback: (activities: UserActivity[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "userActivities"),
    where("uid", "==", uid)
  );
  return onSnapshot(q, (snap) => {
    const activities = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as UserActivity[];
    
    // Sort locally to avoid needing a Firestore composite index
    activities.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    
    callback(activities);
  }, (error) => {
    console.error("Error fetching activities:", error);
  });
}
