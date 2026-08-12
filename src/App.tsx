import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Morphology from "./pages/Morphology";
// import LineageTree from "./pages/LineageTree";
// import LineageNewTree from "./pages/LineageNewTree";
import LineageTree from "./pages/LineageTree";
import ContactNetwork from "./pages/ContactNetwork";
import Background from "./pages/Background";
import Download from "./pages/Download";
import Help from "./pages/Help";
import Browse from "./pages/Browse";
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
          <Route path="/Morphology" element={<Morphology />} />
          <Route path="/lineage-tree" element={<LineageTree />} />
          <Route path="/contact-network" element={<ContactNetwork />} />
          <Route path="/Background" element={<Background />} />
          <Route path="/download" element={<Download />} />
          <Route path="/help" element={<Help />} />
          <Route path="/browse" element={<Browse />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
