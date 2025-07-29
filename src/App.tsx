
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WhiteLabelProvider } from '@/providers/WhiteLabelProvider';
import { SecurityProvider } from '@/components/SecurityProvider';
import { SessionTimeout } from '@/components/SessionTimeout';
import NavigationWrapper from '@/components/NavigationWrapper';
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
              <NavigationWrapper />
              <Toaster />
            </BrowserRouter>
          </SecurityProvider>
        </WhiteLabelProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
