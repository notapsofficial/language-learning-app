import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TabNavigation } from "@/components/tab-navigation";

// Pages
import Dashboard from "@/pages/dashboard";
import VocabularyPage from "@/pages/vocabulary";
import PronunciationPage from "@/pages/pronunciation";
import ProgressPage from "@/pages/progress";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Apple-style Status Bar */}
      <div className="status-bar-space flex justify-between items-center px-4 text-footnote font-medium bg-background/95 apple-blur">
        <div className="flex items-center space-x-1">
          <span className="font-semibold">9:41</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-foreground rounded-full"></div>
            <div className="w-1 h-1 bg-foreground rounded-full"></div>
            <div className="w-1 h-1 bg-foreground/60 rounded-full"></div>
            <div className="w-1 h-1 bg-foreground/30 rounded-full"></div>
          </div>
          <div className="flex items-center ml-2">
            <div className="w-6 h-3 border border-foreground rounded-sm">
              <div className="w-4 h-1.5 bg-accent rounded-xs ml-0.5 mt-0.5"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-20">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/vocabulary" component={VocabularyPage} />
          <Route path="/pronunciation" component={PronunciationPage} />
          <Route path="/progress" component={ProgressPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </div>

      {/* Tab Navigation */}
      <TabNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="max-w-mobile mx-auto min-h-screen bg-background text-foreground">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
