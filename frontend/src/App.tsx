import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "./layout/AppLayout";
import TodayPage from "./pages/TodayPage";
import PeoplePage from "./pages/PeoplePage";
import PersonDetailPage from "./pages/PersonDetailPage";
import CompaniesPage from "./pages/CompaniesPage";
import WaitlistPage from "./pages/WaitlistPage";
import RadarPage from "./pages/RadarPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<TodayPage />} />
            <Route path="people" element={<PeoplePage />} />
            <Route path="people/:personId" element={<PersonDetailPage />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="waitlist" element={<WaitlistPage />} />
            <Route path="radar" element={<RadarPage />} />

            {/* Fallback to Today */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
