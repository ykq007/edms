import { QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './routes/AppRoutes.tsx';
import { queryClient } from './lib/queryClient.ts';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}

export default App;
