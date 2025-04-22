import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleAuthProvider } from "@/contexts/GoogleAuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MediaGallery from "./pages/MediaGallery";
import UserMemory from "./pages/UserMemory";
import TokensPlans from "./pages/TokensPlans";
import { ChatMode } from "@/components/ModeSelector";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
});

const App = () => {
  const [activeMode, setActiveMode] = useState<ChatMode>("text");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GoogleAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={
                  <Index 
                    activeMode={activeMode}
                    onModeChange={setActiveMode}
                  />
                } />
                <Route path="/c/:conversationId" element={
                  <Index 
                    activeMode={activeMode}
                    onModeChange={setActiveMode}
                  />
                } />
                <Route path="/auth" element={
                  <Auth 
                    activeMode={activeMode}
                    onModeChange={setActiveMode}
                  />
                } />
                <Route path="/gallery" element={
                  <MediaGallery 
                    activeMode={activeMode}
                    onModeChange={setActiveMode}
                  />
                } />
                <Route path="/memory" element={
                  <UserMemory 
                    activeMode={activeMode}
                    onModeChange={setActiveMode}
                  />
                } />
                <Route path="/tokens" element={<TokensPlans />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </GoogleAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
