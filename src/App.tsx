
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleAuthProvider } from "@/contexts/GoogleAuthContext";
import { MediaProvider } from "@/contexts/MediaContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MediaGallery from "./pages/MediaGallery";
import UserMemory from "./pages/UserMemory";
import TokensPlans from "./pages/TokensPlans";
import AdminPanel from "./pages/AdminPanel";
import NewsFeed from "./pages/NewsFeed";
import PostDetail from "./pages/PostDetail";
import ServicesConfig from "./pages/ServicesConfig";
import MediaAnalytics from "./pages/MediaAnalytics";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <GoogleAuthProvider>
        <MediaProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/c/:conversationId" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/gallery" element={<MediaGallery />} />
                <Route path="/memory" element={<UserMemory />} />
                <Route path="/tokens" element={<TokensPlans />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/feed" element={<NewsFeed />} />
                <Route path="/feed/:postId" element={<PostDetail />} />
                <Route path="/services" element={<ServicesConfig />} />
                <Route path="/analytics" element={<MediaAnalytics />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </MediaProvider>
      </GoogleAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
