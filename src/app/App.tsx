import { BrowserRouter, Routes, Route, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { AppProvider } from "./context/AppContext";
import Navbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import ReportIssue from "./pages/ReportIssue";
import MapView from "./pages/MapView";
import Kanban from "./pages/Kanban";
import Rewards from "./pages/Rewards";
import Profile from "./pages/Profile";

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const noNavRoutes = ["/", "/landing"];
  const showNav = !noNavRoutes.includes(location.pathname);

  return (
    <>
      {showNav && <Navbar />}
      <Routes location={location}>
        <Route path="/" element={<AuthPage />} />
        <Route path="/landing" element={<PageWrapper><Landing /></PageWrapper>} />
        <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/report" element={<PageWrapper><ReportIssue /></PageWrapper>} />
        <Route path="/map" element={<PageWrapper><MapView /></PageWrapper>} />
        <Route path="/kanban" element={<PageWrapper><Kanban /></PageWrapper>} />
        <Route path="/rewards" element={<PageWrapper><Rewards /></PageWrapper>} />
        <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        {/* No changes needed here — theme class is applied to <html> via AppContext */}
        <div className="min-h-screen bg-[#050816]">
          <AppRoutes />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}