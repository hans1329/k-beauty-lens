import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreatorDetail from "./pages/CreatorDetail";
import Auth from "./pages/Auth";
import SelectUserType from "./pages/SelectUserType";
import Analytics from "./pages/Analytics";
import Challenges from "./pages/Challenges";
import ChallengeForm from "./pages/ChallengeForm";
import Pricing from "./pages/Pricing";
import PricingNew from "./pages/PricingNew";
import About from "./pages/About";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Creators from "./pages/Creators";
import Videos from "./pages/Videos";
import AnalyticsAdmin from "./pages/AnalyticsAdmin";
import AdminUsers from "./pages/AdminUsers";
import AdminEnergy from "./pages/AdminEnergy";
import AdminRewards from "./pages/AdminRewards";
import MySearches from "./pages/MySearches";
import Rewards from "./pages/Rewards";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/creator/:id" element={<CreatorDetail />} />
          <Route path="/my-searches" element={<MySearches />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/select-type" element={<SelectUserType />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/challenges/new" element={<ChallengeForm />} />
          <Route path="/challenges/:id/edit" element={<ChallengeForm />} />
          <Route path="/pricing" element={<PricingNew />} />
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/creators" element={<Creators />} />
          <Route path="/admin/videos" element={<Videos />} />
          <Route path="/admin/analytics" element={<AnalyticsAdmin />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/energy" element={<AdminEnergy />} />
          <Route path="/admin/rewards" element={<AdminRewards />} />
          <Route path="/rewards" element={<Rewards />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
