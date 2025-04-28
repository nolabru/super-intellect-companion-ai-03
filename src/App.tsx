import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleAuthProvider } from "@/contexts/GoogleAuthContext";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MediaGallery from "./pages/MediaGallery";
import UserMemory from "./pages/UserMemory";
import TokensPlans from "./pages/TokensPlans";
import AdminPanel from "./pages/AdminPanel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
});

const App = () => {
  const noLayoutRoutes = ['/auth'];
  
  const shouldUseLayout = (path: string) => {
    return !noLayoutRoutes.includes(path);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GoogleAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                
                <Route path="/" element={<AppLayout><Index /></AppLayout>} />
                <Route path="/c/:conversationId" element={<AppLayout><Index /></AppLayout>} />
                <Route path="/gallery" element={<AppLayout><MediaGallery /></AppLayout>} />
                <Route path="/memory" element={<AppLayout><UserMemory /></AppLayout>} />
                <Route path="/tokens" element={<AppLayout><TokensPlans /></AppLayout>} />
                <Route path="/admin" element={<AppLayout><AdminPanel /></AppLayout>} />
                <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </GoogleAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
