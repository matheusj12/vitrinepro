import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SuperAdmin from "./pages/SuperAdmin";
import Storefront from "./pages/Storefront";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ResetPassword from "./pages/ResetPassword";
import AboutStore from "./pages/AboutStore";

// ... (dentro do componente App)
          <Route path="/loja/:slug" element={<Storefront />} />
          <Route path="/loja/:slug/sobre" element={<AboutStore />} />
          <Route path="/loja/:slug/carrinho" element={<Cart />} />
          <Route path="/loja/:slug/checkout" element={<Checkout />} />
{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */ }
<Route path="*" element={<NotFound />} />
        </Routes >
      </BrowserRouter >
    </TooltipProvider >
  </QueryClientProvider >
);

export default App;