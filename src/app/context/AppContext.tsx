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
import { Issue } from "../data/mockData";

interface AppContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  issues: Issue[];
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  addIssue: (issue: Omit<Issue, "id">) => Promise<void>;
  deleteIssue: (id: string) => Promise<void>;
  upvoteIssue: (id: string) => Promise<void>;
  updateIssueStatus: (id: string, status: Issue["status"]) => Promise<void>;
  reportFakeIssue: (id: string, reason: string) => Promise<void>;
  updateProfile: (data: { name?: string; photoURL?: string }) => Promise<void>;
  redeemReward: (cost: number) => Promise<string>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
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
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setIssues(snap.docs.map(d => ({ id: d.id, ...d.data() } as Issue)));
    });
    return unsub;
  }, []);

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
    await addDoc(collection(db, "issues"), {
      ...issue,
      reportedBy: user.uid,
      reportedByName: user.name,
      createdAt: serverTimestamp()
    });
    const newPoints = (user.points || 0) + 50;
    const newReportsFiled = (user.reportsFiled || 0) + 1;
    await updateUserProfile(user.uid, { points: newPoints, reportsFiled: newReportsFiled });
    setUser(u => u ? { ...u, points: newPoints, reportsFiled: newReportsFiled } : u);
  }

  // Deletes the issue doc and deducts 50 points from the poster's profile.
  async function deleteIssue(id: string) {
    if (!user) return;
    await deleteDoc(doc(db, "issues", id));
    const newPoints = Math.max(0, (user.points || 0) - 50);
    const newReportsFiled = Math.max(0, (user.reportsFiled || 0) - 1);
    await updateUserProfile(user.uid, { points: newPoints, reportsFiled: newReportsFiled });
    setUser(u => u ? { ...u, points: newPoints, reportsFiled: newReportsFiled } : u);
  }

  async function upvoteIssue(id: string) {
    const ref = doc(db, "issues", id);
    const current = issues.find(i => i.id === id);
    if (current) await updateDoc(ref, { votes: (current.votes || 0) + 1 });
  }

  async function updateIssueStatus(id: string, status: Issue["status"]) {
    await updateDoc(doc(db, "issues", id), { status });
  }

  async function reportFakeIssue(id: string, reason: string) {
    const ref = doc(db, "issues", id);
    const current = issues.find(i => i.id === id);
    if (current) {
      const reports = (current as any).fakeReports || [];
      await updateDoc(ref, {
        fakeReports: [...reports, { by: user?.uid, reason, at: new Date().toISOString() }]
      });
    }
  }

  async function updateProfile(data: { name?: string; photoURL?: string }) {
    if (!user) return;
    await updateUserProfile(user.uid, data);
    setUser(u => u ? { ...u, ...data } : u);
  }

  async function redeemReward(cost: number): Promise<string> {
    if (!user) throw new Error("You need to sign in to redeem rewards.");
    if ((user.points || 0) < cost) throw new Error("Not enough points to redeem this reward.");
    const code = `URB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const newPoints = user.points - cost;
    await updateUserProfile(user.uid, { points: newPoints });
    setUser(u => u ? { ...u, points: newPoints } : u);
    return code;
  }

  return (
    <AppContext.Provider value={{
      user, firebaseUser, loading, issues,
      loginWithGoogle, loginWithGithub, logout,
      addIssue, deleteIssue, upvoteIssue, updateIssueStatus,
      reportFakeIssue, updateProfile, redeemReward
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
