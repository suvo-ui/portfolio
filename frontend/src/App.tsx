import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { TabSelectionProvider } from "@/context/TabSelectionContext";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import Courses from "./pages/Courses";
import ArtworkDetail from "./pages/ArtworkDetail";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Checkout from "./pages/Checkout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ScrollToTop } from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TabSelectionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ScrollToTop />

            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/prints" element={<Navigate to="/" replace />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/artwork/:id" element={<ArtworkDetail />} />

              {/* 🔐 Protected Admin Panel */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />

              {/* Public login */}
              <Route path="/login" element={<Login />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </TabSelectionProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
