
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ui/error-boundary";
import { SecurityProvider } from "@/components/SecurityProvider";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Student from "./pages/Student";
import Teacher from "./pages/Teacher";
import NotFound from "./pages/NotFound";
import Parent from "./pages/Parent";
import Alumni from "./pages/Alumni";

const App = () => (
  <ErrorBoundary>
    <SecurityProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/student" element={<Student />} />
          <Route path="/faculty" element={<Teacher />} />
          <Route path="/parent" element={<Parent />} />
          <Route path="/alumni" element={<Alumni />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </SecurityProvider>
  </ErrorBoundary>
);

export default App;
