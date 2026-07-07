import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
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
import { Mail, Lock, UserPlus, ArrowRight, User, Check, X } from 'lucide-react';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be less than 50 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    setFormError(null);
    try {
      await signup(data.name, data.email, data.password);
      void navigate('/profile');
    } catch (err: any) {
      setFormError(
        err.message || 'Registration failed. Try a different email address.'
      );
    }
  };

  // Password strength checks
  const checks = [
    { label: '8+ characters', test: passwordInput.length >= 8 },
    { label: 'Uppercase letter', test: /[A-Z]/.test(passwordInput) },
    { label: 'A number (0-9)', test: /[0-9]/.test(passwordInput) },
    {
      label: 'Special character (@, !, #, etc.)',
      test: /[^A-Za-z0-9]/.test(passwordInput)
    }
  ];

  const strengthCount = checks.filter(c => c.test).length;
  let strengthColor = 'bg-accent-error';
  let strengthLabel = 'Weak';
  if (strengthCount === 2 || strengthCount === 3) {
    strengthColor = 'bg-accent-warning';
    strengthLabel = 'Medium';
  } else if (strengthCount === 4) {
    strengthColor = 'bg-accent-success';
    strengthLabel = 'Strong';
  }

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
                <UserPlus className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Create an Account
            </CardTitle>
            <CardDescription className="text-text-secondary text-sm">
              Register a profile to experience secure JWT authentication
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
                  htmlFor="name"
                  className="text-xs font-semibold text-text-secondary"
                >
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-text-tertiary" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jane Doe"
                    className={`pl-9 ${errors.name ? 'border-accent-error focus-visible:border-accent-error' : ''}`}
                    disabled={isSubmitting}
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-accent-error font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>

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
                    placeholder="jane@example.com"
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
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold text-text-secondary"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-text-tertiary" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className={`pl-9 ${errors.password ? 'border-accent-error focus-visible:border-accent-error' : ''}`}
                    disabled={isSubmitting}
                    {...register('password', {
                      onChange: e => setPasswordInput(e.target.value)
                    })}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-accent-error font-medium">
                    {errors.password.message}
                  </p>
                )}

                {/* Live Password Indicator */}
                {passwordInput.length > 0 && (
                  <div className="mt-2 space-y-2 p-2 rounded-lg bg-background-muted/50 border border-border-secondary">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-text-secondary">
                      <span>
                        Strength:{' '}
                        <span className="text-text-primary">
                          {strengthLabel}
                        </span>
                      </span>
                      <span>{strengthCount}/4</span>
                    </div>
                    {/* Gauge Bar */}
                    <div className="w-full bg-background-tertiary h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strengthColor}`}
                        style={{ width: `${(strengthCount / 4) * 100}%` }}
                      />
                    </div>
                    {/* Indicators list */}
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {checks.map((c, i) => (
                        <div
                          key={i}
                          className={`flex items-center space-x-1 ${
                            c.test
                              ? 'text-accent-success'
                              : 'text-text-tertiary'
                          }`}
                        >
                          {c.test ? (
                            <Check className="h-3 w-3 flex-shrink-0" />
                          ) : (
                            <X className="h-3 w-3 flex-shrink-0" />
                          )}
                          <span>{c.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-xs font-semibold text-text-secondary"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-text-tertiary" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className={`pl-9 ${
                      errors.confirmPassword
                        ? 'border-accent-error focus-visible:border-accent-error'
                        : ''
                    }`}
                    disabled={isSubmitting}
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-accent-error font-medium">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full flex items-center justify-center mt-6"
                loading={isSubmitting}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Create Account</span>
              </Button>
            </form>

            <div className="text-center text-xs text-text-secondary">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-accent-primary hover:underline inline-flex items-center"
              >
                <span>Sign in here</span>
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
