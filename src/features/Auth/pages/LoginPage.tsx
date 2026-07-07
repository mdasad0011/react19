import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/shared/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Shield, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  // Determine where to redirect after login (default is /profile)
  const from = (location.state as any)?.from?.pathname || '/profile';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);
    try {
      await login(data.email, data.password);
      void navigate(from, { replace: true });
    } catch (err: any) {
      setFormError(
        err.message || 'Login failed. Please check your credentials.'
      );
    }
  };

  // Preset fills for demo ease
  const fillDemoCreds = (email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="flex min-h-[calc(screen-80px)] items-center justify-center bg-background-primary text-text-primary px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border border-border-primary bg-background-card/50 shadow-xl backdrop-blur-sm overflow-hidden">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
                <Shield className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-text-secondary text-sm">
              Log in to access your secure user profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {formError && (
              <Alert
                variant="destructive"
                className="border border-accent-error bg-state-error-bg text-accent-error"
              >
                <AlertDescription className="text-xs">
                  {formError}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold text-text-secondary"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-text-tertiary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className={`pl-9 ${errors.email ? 'border-accent-error focus-visible:border-accent-error' : ''}`}
                    disabled={isSubmitting}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-accent-error font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs font-semibold text-text-secondary"
                  >
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-text-tertiary" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={`pl-9 ${errors.password ? 'border-accent-error focus-visible:border-accent-error' : ''}`}
                    disabled={isSubmitting}
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-accent-error font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full flex items-center justify-center"
                loading={isSubmitting}
              >
                <LogIn className="mr-2 h-4 w-4" />
                <span>Sign In</span>
              </Button>
            </form>

            <div className="relative flex py-2 items-center text-xs">
              <div className="flex-grow border-t border-border-secondary"></div>
              <span className="flex-shrink mx-4 text-text-tertiary font-mono">
                Demo Accounts
              </span>
              <div className="flex-grow border-t border-border-secondary"></div>
            </div>

            {/* Quick-fill helper credentials */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  fillDemoCreds('demo@example.com', 'Password123!')
                }
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-border-primary bg-background-muted hover:bg-background-hover hover:text-text-primary text-text-secondary text-center cursor-pointer transition-all"
              >
                <span className="font-semibold text-text-primary">
                  Regular User
                </span>
                <span className="text-[10px] text-text-tertiary">
                  demo@example.com
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  fillDemoCreds('admin@example.com', 'AdminSecure456!')
                }
                className="flex flex-col items-center justify-center p-2 rounded-lg border border-border-primary bg-background-muted hover:bg-background-hover hover:text-text-primary text-text-secondary text-center cursor-pointer transition-all"
              >
                <span className="font-semibold text-text-primary">
                  Admin User
                </span>
                <span className="text-[10px] text-text-tertiary">
                  admin@example.com
                </span>
              </button>
            </div>

            <div className="text-center text-xs text-text-secondary">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="text-accent-primary hover:underline inline-flex items-center"
              >
                <span>Sign up here</span>
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
