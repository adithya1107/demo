
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WhiteLabelProvider } from '@/providers/WhiteLabelProvider';
import { SecurityProvider } from '@/components/SecurityProvider';
import SessionTimeout from '@/components/SessionTimeout';
import NavigationWrapper from '@/components/NavigationWrapper';
import Index from '@/pages/Index';
import Student from '@/pages/Student';
import Teacher from '@/pages/Teacher';
import Admin from '@/pages/Admin';
import Parent from '@/pages/Parent';
import Alumni from '@/pages/Alumni';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WhiteLabelProvider>
          <SecurityProvider>
            <BrowserRouter>
              <SessionTimeout />
              <NavigationWrapper>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/student" element={<Student />} />
                  <Route path="/faculty" element={<Teacher />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/parent" element={<Parent />} />
                  <Route path="/alumni" element={<Alumni />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </NavigationWrapper>
              <Toaster />
            </BrowserRouter>
          </SecurityProvider>
        </WhiteLabelProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
