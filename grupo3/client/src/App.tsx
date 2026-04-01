import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import ClientDashboard from "./pages/ClientDashboard";
import BarberDashboard from "./pages/BarberDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ManageServices from "./pages/ManageServices";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/booking" component={Booking} />
      <Route path="/dashboard" component={ClientDashboard} />
      <Route path="/barber" component={BarberDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/services" component={ManageServices} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
