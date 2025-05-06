import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleAuthProvider } from "@/contexts/GoogleAuthContext";
import { MediaProvider } from "@/contexts/MediaContext";
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
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import IdeogramPage from "./pages/IdeogramPage";
import TestAPIFrame from './pages/TestAPIFrame';
import VideoRecovery from './pages/VideoRecovery';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/c/:conversationId",
    element: <Index />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/gallery",
    element: (
      <ProtectedRoute>
        <MediaGallery />
      </ProtectedRoute>
    ),
  },
  {
    path: "/memory",
    element: (
      <ProtectedRoute>
        <UserMemory />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tokens",
    element: (
      <ProtectedRoute>
        <TokensPlans />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: <AdminPanel />,
  },
  {
    path: "/analytics",
    element: (
      <AdminRoute>
        <Analytics />
      </AdminRoute>
    ),
  },
  {
    path: "/feed",
    element: <NewsFeed />,
  },
  {
    path: "/feed/new",
    element: <CreatePost />,
  },
  {
    path: "/post/:id",
    element: <PostDetail />,
  },
  {
    path: "/ideogram",
    element: <IdeogramPage />,
  },
  {
    path: "/test-api-frame",
    element: <TestAPIFrame />,
  },
  {
    path: "/video-recovery",
    element: <VideoRecovery />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <GoogleAuthProvider>
        <MediaProvider>
          <DndProvider backend={HTML5Backend}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <RouterProvider router={router} />
            </TooltipProvider>
          </DndProvider>
        </MediaProvider>
      </GoogleAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
