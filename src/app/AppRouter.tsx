import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NotFound from '@/features/NotFound/NotFound';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-background-primary text-text-primary antialiased">
        <main className="flex-1">
          <Routes>
            <Route path="/profile" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};
