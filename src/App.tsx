
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MediaGallery from "./pages/MediaGallery";
import UserMemory from "./pages/UserMemory";
import TokensPlans from "./pages/TokensPlans";
import AdminPanel from "./pages/AdminPanel";
import NewsFeed from "./pages/NewsFeed";
import PostDetail from "./pages/PostDetail";
import Analytics from "./pages/Analytics";
import CreatePost from "./pages/CreatePost";
import IdeogramPage from "./pages/IdeogramPage";

const App = () => (
  <>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <DndProvider backend={HTML5Backend}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/c/:conversationId" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/gallery" element={<MediaGallery />} />
            <Route path="/memory" element={<UserMemory />} />
            <Route path="/tokens" element={<TokensPlans />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/feed" element={<NewsFeed />} />
            <Route path="/feed/new" element={<CreatePost />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/ideogram" element={<IdeogramPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DndProvider>
    </TooltipProvider>
  </>
);

export default App;
