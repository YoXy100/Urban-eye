import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser
} from "firebase/auth";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from "firebase/firestore";
import { auth, db, googleProvider, githubProvider } from "../lib/firebase";
import { getOrCreateUserProfile, UserProfile, updateUserProfile } from "../lib/userService";
import { logActivity, subscribeToActivities, UserActivity } from "../lib/activityService";
import { Issue } from "../data/mockData";

interface AppContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  issues: Issue[];
  activities: UserActivity[];
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  addIssue: (issue: Omit<Issue, "id">) => Promise<void>;
  deleteIssue: (id: string) => Promise<void>;
  upvoteIssue: (id: string) => Promise<void>;
  updateIssueStatus: (id: string, status: Issue["status"]) => Promise<void>;
  reportFakeIssue: (id: string, reason: string) => Promise<void>;
  addComment: (id: string, text: string) => Promise<void>;
  updateProfile: (data: { name?: string; photoURL?: string }) => Promise<void>;
  redeemReward: (cost: number) => Promise<string>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const profile = await getOrCreateUserProfile(fbUser);
        setUser(profile);
      } else {
        setFirebaseUser(null);
        setUser(null);
        setActivities([]);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Subscribe to issues
  useEffect(() => {
    const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setIssues(snap.docs.map(d => ({ id: d.id, ...d.data() } as Issue)));
    });
    return unsub;
  }, []);

  // Subscribe to current user's activity feed (for heatmap)
  useEffect(() => {
    if (!user?.uid) {
      setActivities([]);
      return;
    }
    const unsub = subscribeToActivities(user.uid, setActivities);
    return unsub;
  }, [user?.uid]);

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function loginWithGithub() {
    await signInWithPopup(auth, githubProvider);
  }

  async function logout() {
    await signOut(auth);
  }

  async function addIssue(issue: Omit<Issue, "id">) {
    if (!user) return;
    const docRef = await addDoc(collection(db, "issues"), {
      ...issue,
      reportedBy: user.uid,
      reportedByName: user.name,
      createdAt: serverTimestamp()
    });
    const newPoints = (user.points || 0) + 50;
    const newReportsFiled = (user.reportsFiled || 0) + 1;
    await updateUserProfile(user.uid, { points: newPoints, reportsFiled: newReportsFiled });
    setUser(u => u ? { ...u, points: newPoints, reportsFiled: newReportsFiled } : u);

    // Log activity
    logActivity(user.uid, "issue_reported", `Reported: ${issue.title}`, docRef.id);
  }

  // Deletes the issue doc and deducts 50 points from the poster's profile.
  async function deleteIssue(id: string) {
    if (!user) return;
    const issue = issues.find(i => i.id === id);
    await deleteDoc(doc(db, "issues", id));
    const newPoints = Math.max(0, (user.points || 0) - 50);
    const newReportsFiled = Math.max(0, (user.reportsFiled || 0) - 1);
    await updateUserProfile(user.uid, { points: newPoints, reportsFiled: newReportsFiled });
    setUser(u => u ? { ...u, points: newPoints, reportsFiled: newReportsFiled } : u);

    // Log activity
    logActivity(user.uid, "issue_deleted", `Deleted: ${issue?.title || "an issue"}`, id);
  }

  async function upvoteIssue(id: string) {
    if (!user) return;
    const ref = doc(db, "issues", id);
    const current = issues.find(i => i.id === id);
    if (current) {
      await updateDoc(ref, { votes: (current.votes || 0) + 1 });

      // Log activity
      logActivity(user.uid, "issue_upvoted", `Upvoted: ${current.title}`, id);
    }
  }

  async function addComment(id: string, text: string) {
    if (!user) return;
    const ref = doc(db, "issues", id);
    const current = issues.find(i => i.id === id);
    if (current) {
      await updateDoc(ref, { comments: (current.comments || 0) + 1 });
      // Log activity
      logActivity(user.uid, "comment_added", `Commented on: ${current.title}`, id);
    }
  }

  async function updateIssueStatus(id: string, status: Issue["status"]) {
    if (!user) return;
    await updateDoc(doc(db, "issues", id), { status });
    const issue = issues.find(i => i.id === id);

    // Log activity
    logActivity(user.uid, "status_changed", `Changed status to ${status.replace("_", " ")}: ${issue?.title || "an issue"}`, id);
  }

  async function reportFakeIssue(id: string, reason: string) {
    const ref = doc(db, "issues", id);
    const current = issues.find(i => i.id === id);
    if (current) {
      const reports = (current as any).fakeReports || [];
      await updateDoc(ref, {
        fakeReports: [...reports, { by: user?.uid, reason, at: new Date().toISOString() }]
      });

      // Log activity
      if (user) logActivity(user.uid, "fake_reported", `Reported fake: ${current.title}`, id);
    }
  }

  async function updateProfile(data: { name?: string; photoURL?: string }) {
    if (!user) return;
    await updateUserProfile(user.uid, data);
    setUser(u => u ? { ...u, ...data } : u);

    // Log activity
    logActivity(user.uid, "profile_updated", "Updated profile");
  }

  async function redeemReward(cost: number): Promise<string> {
    if (!user) throw new Error("You need to sign in to redeem rewards.");
    if ((user.points || 0) < cost) throw new Error("Not enough points to redeem this reward.");
    const code = `URB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const newPoints = user.points - cost;
    await updateUserProfile(user.uid, { points: newPoints });
    setUser(u => u ? { ...u, points: newPoints } : u);

    // Log activity
    logActivity(user.uid, "reward_redeemed", `Redeemed reward for ${cost} points`);

    return code;
  }

  return (
    <AppContext.Provider value={{
      user, firebaseUser, loading, issues, activities,
      loginWithGoogle, loginWithGithub, logout,
      addIssue, deleteIssue, upvoteIssue, updateIssueStatus,
      reportFakeIssue, addComment, updateProfile, redeemReward
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
