
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
import Analytics from "./pages/Analytics";
import CreatePost from "./pages/CreatePost";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";

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
                
                {/* Rotas protegidas que exigem autenticação */}
                <Route path="/gallery" element={
                  <ProtectedRoute>
                    <MediaGallery />
                  </ProtectedRoute>
                } />
                <Route path="/memory" element={
                  <ProtectedRoute>
                    <UserMemory />
                  </ProtectedRoute>
                } />
                <Route path="/tokens" element={
                  <ProtectedRoute>
                    <TokensPlans />
                  </ProtectedRoute>
                } />
                
                {/* Admin-protected routes */}
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/analytics" element={
                  <AdminRoute>
                    <Analytics />
                  </AdminRoute>
                } />
                
                <Route path="/feed" element={<NewsFeed />} />
                <Route path="/feed/new" element={<CreatePost />} />
                <Route path="/post/:id" element={<PostDetail />} />
                <Route path="/services" element={<ServicesConfig />} />
                
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
