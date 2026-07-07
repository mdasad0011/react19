import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/features/Home/Home';
import NotFound from '@/features/NotFound/NotFound';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};
