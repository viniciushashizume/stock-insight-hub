import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import Overview from "./pages/Overview";
import Clusters from "./pages/Clusters";
import Items from "./pages/Items";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Insights from "./pages/Insights";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-16 lg:px-6">
                  <SidebarTrigger />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground">Inteligência de Estoque Hospitalar</h2>
                  </div>
                  <ThemeToggle />
                </header>
                <main className="flex-1 p-4 lg:p-6 overflow-auto">
                  <Routes>
                    <Route path="/" element={<Overview />} />
                    <Route path="/clusters" element={<Clusters />} />
                    <Route path="/items" element={<Items />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                    <Route path="/insights" element={<Insights />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
