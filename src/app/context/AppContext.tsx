import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser
} from "firebase/auth";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp, increment, getDoc
} from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";
import { getOrCreateUserProfile, UserProfile } from "../lib/userService";
import { Issue } from "../data/mockData";

const POINTS_PER_REPORT = 50;

interface AppContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  issues: Issue[];
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  addIssue: (issue: Omit<Issue, "id">) => Promise<void>;
  upvoteIssue: (id: string) => Promise<void>;
  updateIssueStatus: (id: string, status: Issue["status"]) => Promise<void>;
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

  // Keep local user state in sync with Firestore profile changes
  useEffect(() => {
    if (!firebaseUser) return;
    const userRef = doc(db, "users", firebaseUser.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setUser(snap.data() as UserProfile);
      }
    });
    return unsub;
  }, [firebaseUser]);

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

  async function logout() {
    await signOut(auth);
  }

  async function addIssue(issue: Omit<Issue, "id">) {
    if (!user) return;

    // 1. Save the issue to Firestore
    await addDoc(collection(db, "issues"), {
      ...issue,
      reportedBy: user.uid,
      createdAt: serverTimestamp(),
    });

    // 2. Credit points and increment reportsFiled on the user's profile
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      points: increment(POINTS_PER_REPORT),
      reportsFiled: increment(1),
    });
  }

  async function upvoteIssue(id: string) {
    const ref = doc(db, "issues", id);
    const current = issues.find(i => i.id === id);
    if (current) await updateDoc(ref, { votes: (current.votes || 0) + 1 });
  }

  async function updateIssueStatus(id: string, status: Issue["status"]) {
    if (!user) return;

    // Only allow the issue reporter to move their own cards
    const issue = issues.find(i => i.id === id);
    if (!issue) return;
    if (issue.reportedBy !== user.uid) return;

    await updateDoc(doc(db, "issues", id), { status });

    // If an issue is resolved, credit the reporter's reportsResolved count
    if (status === "resolved") {
      const reporterRef = doc(db, "users", issue.reportedBy);
      const reporterSnap = await getDoc(reporterRef);
      if (reporterSnap.exists()) {
        await updateDoc(reporterRef, { reportsResolved: increment(1) });
      }
    }
  }

  return (
    <AppContext.Provider value={{
      user, firebaseUser, loading, issues,
      loginWithGoogle, logout, addIssue, upvoteIssue, updateIssueStatus
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