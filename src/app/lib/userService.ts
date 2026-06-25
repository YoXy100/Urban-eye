import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { User as FirebaseUser } from "firebase/auth";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  role: "citizen" | "ward" | "official";
  points: number;
  level: number;
  reportsFiled: number;
  reportsResolved: number;
  joinedAt: string;
  ward: string;
}

export async function getOrCreateUserProfile(firebaseUser: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  const newProfile: UserProfile = {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || "New Citizen",
    email: firebaseUser.email || "",
    photoURL: firebaseUser.photoURL || "",
    role: "citizen",
    points: 0,
    level: 1,
    reportsFiled: 0,
    reportsResolved: 0,
    joinedAt: new Date().toISOString(),
    ward: "Ward 1"
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data);
}