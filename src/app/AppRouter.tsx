import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '@/features/Home/Home';
import NotFound from '@/features/NotFound/NotFound';
import {
  LoginPage,
  RegisterPage,
  ProfilePage,
  ProtectedRoute,
  JwtDebugger
} from '@/features';
import { AuthHeader } from '@/shared/components';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-background-primary text-text-primary antialiased">
        <AuthHeader />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <JwtDebugger />
      </div>
    </BrowserRouter>
  );
};
