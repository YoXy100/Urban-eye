import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { useApp } from "../context/AppContext";

type Tab = "login" | "signup";
type Role = "citizen" | "ward" | "official";

function CityGridSVG() {
  return (
    <svg
      viewBox="0 0 300 600"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        <pattern id="cg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3B82F6" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="300" height="600" fill="url(#cg)" />
      <rect x="20" y="80" width="50" height="140" rx="2" fill="#1E6BE6" opacity="0.3" />
      <rect x="80" y="120" width="35" height="100" rx="2" fill="#1E6BE6" opacity="0.2" />
      <rect x="125" y="60" width="60" height="160" rx="2" fill="#1E6BE6" opacity="0.35" />
      <rect x="195" y="100" width="40" height="120" rx="2" fill="#1E6BE6" opacity="0.2" />
      <rect x="245" y="140" width="45" height="80" rx="2" fill="#1E6BE6" opacity="0.15" />
      <circle cx="45" cy="75" r="4" fill="#60A5FA" opacity="0.8" />
      <circle cx="155" cy="55" r="4" fill="#60A5FA" opacity="0.8" />
      <circle cx="215" cy="95" r="3" fill="#34D399" opacity="0.7" />
      <line x1="45" y1="75" x2="155" y2="55" stroke="#3B82F6" strokeWidth="0.5" opacity="0.4" />
      <line x1="155" y1="55" x2="215" y2="95" stroke="#3B82F6" strokeWidth="0.5" opacity="0.4" />
      <line x1="45" y1="75" x2="215" y2="95" stroke="#3B82F6" strokeWidth="0.5" opacity="0.2" />
      <rect x="0" y="340" width="300" height="30" fill="#1E3A6E" opacity="0.4" />
      <rect x="0" y="380" width="300" height="20" fill="#1E3A6E" opacity="0.3" />
      <rect x="30" y="350" width="20" height="50" rx="1" fill="#2563EB" opacity="0.3" />
      <rect x="70" y="360" width="25" height="40" rx="1" fill="#2563EB" opacity="0.25" />
      <rect x="110" y="345" width="30" height="55" rx="1" fill="#2563EB" opacity="0.3" />
      <rect x="155" y="355" width="20" height="45" rx="1" fill="#2563EB" opacity="0.25" />
      <rect x="185" y="350" width="35" height="50" rx="1" fill="#2563EB" opacity="0.3" />
      <rect x="230" y="360" width="25" height="40" rx="1" fill="#2563EB" opacity="0.2" />
    </svg>
  );
}

function PasswordStrengthBar({ password }: { password: string }) {
  let score = 0;
  if (password.length >= 8) score += 33;
  if (/[A-Z]/.test(password)) score += 33;
  if (/[0-9!@#$]/.test(password)) score += 34;
  const color = score < 40 ? "#E24B4A" : score < 80 ? "#EF9F27" : "#1D9E75";
  return (
    <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)", marginTop: 6, overflow: "hidden" }}>
      <div style={{ height: "100%", borderRadius: 2, background: color, width: `${score}%`, transition: "width 0.3s, background 0.3s" }} />
    </div>
  );
}

function FieldInput({ icon, type = "text", placeholder, value, onChange }: {
  icon: string; type?: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <span style={{ position: "absolute", left: 12, fontSize: 16, color: "rgba(255,255,255,0.3)", pointerEvents: "none", zIndex: 1, fontFamily: "tabler-icons", display: "flex", alignItems: "center" }}>
        <i className={`ti ${icon}`} aria-hidden="true" />
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: "'Inter', sans-serif", padding: "11px 12px 11px 38px", outline: "none" }}
        onFocus={(e) => { e.target.style.borderColor = "rgba(30,107,230,0.6)"; e.target.style.background = "rgba(30,107,230,0.05)"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
      />
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

// ── LOGIN FORM ────────────────────────────────────────────────────────────────
function LoginForm({
  onSwitch, onLogin, onGoogleLogin,
  email, setEmail, password, setPassword,
  error, submitting,
}: {
  onSwitch: () => void;
  onLogin: () => void;
  onGoogleLogin: () => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  error: string;
  submitting: boolean;
}) {
  const [remember, setRemember] = useState(false);

  return (
    <>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Welcome back</h2>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 1.75rem", lineHeight: 1.5 }}>Sign in to your Urban Eye account</p>

      <div style={{ background: "rgba(30,107,230,0.12)", border: "1px solid rgba(30,107,230,0.3)", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem", fontSize: 12.5, color: "#6AABFF", lineHeight: 1.5 }}>
        <i className="ti ti-info-circle" aria-hidden="true" style={{ fontSize: 16, flexShrink: 0 }} />
        Use your registered email to access your civic dashboard.
      </div>

      {error && (
        <div style={{ background: "rgba(226,75,74,0.12)", border: "1px solid rgba(226,75,74,0.4)", borderRadius: 8, padding: "10px 12px", marginBottom: "1rem", fontSize: 12.5, color: "#FF8A89", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-alert-circle" aria-hidden="true" style={{ fontSize: 15, flexShrink: 0 }} />
          {error}
        </div>
      )}

      <FieldGroup label="Email">
        <FieldInput icon="ti-at" placeholder="you@city.gov" value={email} onChange={setEmail} />
      </FieldGroup>
      <FieldGroup label="Password">
        <FieldInput icon="ti-lock" type="password" placeholder="••••••••" value={password} onChange={setPassword} />
      </FieldGroup>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0.25rem 0 0.5rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ accentColor: "#1E6BE6", width: 14, height: 14 }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Keep me signed in</span>
        </label>
        <a href="#" style={{ fontSize: 12, color: "#6AABFF", textDecoration: "none" }}>Forgot password?</a>
      </div>

      <button
        onClick={onLogin}
        disabled={submitting}
        style={{ width: "100%", marginTop: "1.25rem", padding: 13, background: submitting ? "#1A4FA0" : "#1E6BE6", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: submitting ? 0.7 : 1 }}
        onMouseEnter={(e) => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = "#1A5CC8"; }}
        onMouseLeave={(e) => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = "#1E6BE6"; }}
      >
        <i className={`ti ${submitting ? "ti-loader-2" : "ti-login"}`} aria-hidden="true" style={submitting ? { animation: "spin 1s linear infinite" } : {}} />
        {submitting ? "Signing in…" : "Sign in to dashboard"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "1.25rem 0" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>or continue with</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onGoogleLogin}
          disabled={submitting}
          style={{ flex: 1, padding: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "'Inter', sans-serif", cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)"; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>

        <button
          disabled
          title="GitHub login coming soon"
          style={{ flex: 1, padding: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: "rgba(255,255,255,0.55)", fontSize: 13, fontFamily: "'Inter', sans-serif", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, opacity: 0.5 }}
        >
          <i className="ti ti-brand-github" aria-hidden="true" />
          GitHub
        </button>
      </div>

      <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
        New to Urban Eye?{" "}
        <button onClick={onSwitch} style={{ background: "none", border: "none", color: "#6AABFF", fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0, fontFamily: "'Inter', sans-serif" }}>
          Create account
        </button>
      </p>
    </>
  );
}

// ── SIGNUP FORM ───────────────────────────────────────────────────────────────
function SignupForm({
  onSwitch, onSignup, onGoogleLogin,
  email, setEmail, password, setPassword,
  error, submitting,
}: {
  onSwitch: () => void;
  onSignup: (firstName: string, lastName: string) => void;
  onGoogleLogin: () => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  error: string;
  submitting: boolean;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("citizen");

  const roles: { key: Role; icon: string; label: string }[] = [
    { key: "citizen", icon: "ti-user-check", label: "Citizen" },
    { key: "ward", icon: "ti-building-community", label: "Ward rep" },
    { key: "official", icon: "ti-shield", label: "Official" },
  ];

  return (
    <>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Join Urban Eye</h2>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 1.75rem", lineHeight: 1.5 }}>Become a civic changemaker in your ward</p>

      {error && (
        <div style={{ background: "rgba(226,75,74,0.12)", border: "1px solid rgba(226,75,74,0.4)", borderRadius: 8, padding: "10px 12px", marginBottom: "1rem", fontSize: 12.5, color: "#FF8A89", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-alert-circle" aria-hidden="true" style={{ fontSize: 15, flexShrink: 0 }} />
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1rem" }}>
        <FieldGroup label="First name">
          <FieldInput icon="ti-user" placeholder="Arun" value={firstName} onChange={setFirstName} />
        </FieldGroup>
        <FieldGroup label="Last name">
          <FieldInput icon="ti-user" placeholder="Sharma" value={lastName} onChange={setLastName} />
        </FieldGroup>
      </div>

      <FieldGroup label="Email">
        <FieldInput icon="ti-mail" type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
      </FieldGroup>
      <FieldGroup label="Phone (optional)">
        <FieldInput icon="ti-phone" type="tel" placeholder="+91 98765 43210" value={phone} onChange={setPhone} />
      </FieldGroup>
      <FieldGroup label="Password">
        <FieldInput icon="ti-lock" type="password" placeholder="Min. 8 characters" value={password} onChange={setPassword} />
        <PasswordStrengthBar password={password} />
      </FieldGroup>

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px", marginBottom: 8 }}>I am a...</div>
        <div style={{ display: "flex", gap: 8 }}>
          {roles.map(({ key, icon, label }) => (
            <button key={key} onClick={() => setRole(key)}
              style={{ flex: 1, padding: "8px 6px", border: `1px solid ${role === key ? "#1E6BE6" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, background: role === key ? "rgba(30,107,230,0.12)" : "rgba(255,255,255,0.04)", color: role === key ? "#6AABFF" : "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "'Inter', sans-serif", fontWeight: 500, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.15s" }}
            >
              <i className={`ti ${icon}`} aria-hidden="true" style={{ fontSize: 18 }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSignup(firstName, lastName)}
        disabled={submitting}
        style={{ width: "100%", marginTop: "1.25rem", padding: 13, background: submitting ? "#1A4FA0" : "#1E6BE6", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: submitting ? 0.7 : 1 }}
        onMouseEnter={(e) => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = "#1A5CC8"; }}
        onMouseLeave={(e) => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = "#1E6BE6"; }}
      >
        <i className={`ti ${submitting ? "ti-loader-2" : "ti-user-plus"}`} aria-hidden="true" style={submitting ? { animation: "spin 1s linear infinite" } : {}} />
        {submitting ? "Creating account…" : "Create account"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "1.25rem 0" }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>or register with</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
      </div>

      <button
        onClick={onGoogleLogin}
        disabled={submitting}
        style={{ width: "100%", padding: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "'Inter', sans-serif", cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Register with Google &amp; explore my city
      </button>

      <p style={{ textAlign: "center", marginTop: "1rem", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
        Already a member?{" "}
        <button onClick={onSwitch} style={{ background: "none", border: "none", color: "#6AABFF", fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0, fontFamily: "'Inter', sans-serif" }}>
          Sign in
        </button>
      </p>
    </>
  );
}

// ── MAIN AUTH PAGE ────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { loginWithGoogle, user, loading } = useApp();

  // THE KEY FIX: this is the ONLY place we navigate to /dashboard.
  // All auth handlers just fire the Firebase call and stop.
  // Once Firebase confirms auth, onAuthStateChanged updates `user` in
  // AppContext, which triggers this effect and navigates cleanly.
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // Clear error whenever tab or fields change
  useEffect(() => { setError(""); }, [tab, email, password]);

  // ── Email / password login ────────────────────────────────────────────────
  // No navigate() here — the useEffect above handles it once user is set.
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Do NOT navigate here. Let onAuthStateChanged → useEffect do it.
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setError("Incorrect email or password. Please try again.");
      } else if (code === "auth/invalid-email") {
        setError("That doesn't look like a valid email address.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError(code === "auth/operation-not-allowed" ? "Email sign-in is not enabled. Please contact support." : "Sign-in failed. Please try again.");
      }
      // Only reset submitting on error — on success we keep spinner until redirect
      setSubmitting(false);
    }
  };

  // ── Email / password signup ───────────────────────────────────────────────
  const handleSignup = async (firstName: string, lastName: string) => {
    if (!firstName || !email || !password) {
      setError("Please fill in your name, email, and password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, {
        displayName: `${firstName} ${lastName}`.trim(),
      });
      // Do NOT navigate here. Let onAuthStateChanged → useEffect do it.
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try signing in.");
      } else if (code === "auth/invalid-email") {
        setError("That doesn't look like a valid email address.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 8 characters.");
      } else {
        setError(code === "auth/operation-not-allowed" ? "Email registration is not enabled. Please contact support." : "Registration failed. Please try again.");
      }
      setSubmitting(false);
    }
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setError("");
    try {
      await loginWithGoogle();
      // Do NOT navigate here. Let onAuthStateChanged → useEffect do it.
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code !== "auth/popup-closed-by-user") {
        setError("Google sign-in failed. Please try again.");
      }
      setSubmitting(false);
    }
  };

  // ── Loading / redirect in progress ───────────────────────────────────────
  if (loading || submitting) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0F1E", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(30,107,230,0.3)", borderTopColor: "#1E6BE6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
          {submitting ? "Signing you in…" : "Loading…"}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", display: "flex", fontFamily: "'Inter', sans-serif", position: "relative", overflow: "hidden" }}>
      {/* Left panel */}
      <div style={{ width: "42%", minWidth: 300, position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2rem", background: "linear-gradient(160deg, #0D1B3E 0%, #0A0F1E 60%, #061A2E 100%)", borderRight: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.18 }}><CityGridSVG /></div>

        {/* Brand */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "#1E6BE6", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 14, height: 14, background: "#fff", borderRadius: "50%", boxShadow: "0 0 0 3px rgba(255,255,255,0.25)" }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>Urban Eye</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "1.5px", textTransform: "uppercase" }}>Smart City Platform</div>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "2rem 0" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#1E6BE6", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "0.75rem" }}>Citizen-First Governance</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1.25, letterSpacing: "-0.5px", marginBottom: "1rem" }}>
            Your city.<br /><span style={{ color: "#1E6BE6" }}>Your voice.</span><br />Your data.
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 240 }}>
            Report civic issues, track real-time progress, and shape your neighbourhood's future — together.
          </p>
        </div>

        {/* Stats */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", gap: "1.5rem" }}>
          {[{ num: "12K+", label: "Issues resolved" }, { num: "98", label: "Wards active" }, { num: "4.8★", label: "Citizen rating" }].map(({ num, label }) => (
            <div key={label}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>{num}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, letterSpacing: "0.5px" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Pulse rings */}
        <div style={{ position: "absolute", bottom: "2rem", right: "-2rem", width: 140, height: 140, borderRadius: "50%", border: "1px solid rgba(30,107,230,0.2)", animation: "authPulse 3s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "2.5rem", right: "-1.5rem", width: 90, height: 90, borderRadius: "50%", border: "1px solid rgba(30,107,230,0.35)", animation: "authPulse 3s ease-in-out infinite 1s" }} />
        <div style={{ position: "absolute", bottom: "4.5rem", right: "0.5rem", width: 10, height: 10, background: "#1E6BE6", borderRadius: "50%" }} />
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "2.5rem 2rem", background: "#0A0F1E", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          {/* Tab switcher */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4, marginBottom: "2rem", border: "1px solid rgba(255,255,255,0.06)" }}>
            {(["login", "signup"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 500, border: "none", background: tab === t ? "#1E6BE6" : "none", color: tab === t ? "#fff" : "rgba(255,255,255,0.4)", borderRadius: 7, cursor: "pointer", transition: "all 0.2s", fontFamily: "'Inter', sans-serif" }}
              >
                {t === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <LoginForm
              onSwitch={() => setTab("signup")}
              onLogin={handleLogin}
              onGoogleLogin={handleGoogleLogin}
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              error={error}
              submitting={submitting}
            />
          ) : (
            <SignupForm
              onSwitch={() => setTab("login")}
              onSignup={handleSignup}
              onGoogleLogin={handleGoogleLogin}
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              error={error}
              submitting={submitting}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes authPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.5; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.2) !important; }
      `}</style>
    </div>
  );
}
