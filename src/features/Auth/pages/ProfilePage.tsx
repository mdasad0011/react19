import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/shared/components/ui/Textarea';
import { Badge } from '@/shared/components/ui/Badge';
import { apiRequest } from '../api/authApiClient';
import { useToast } from '@/shared/contexts/ToastContext';
import {
  Shield,
  Edit2,
  Calendar,
  Lock,
  LogOut,
  HelpCircle,
  Play
} from 'lucide-react';

const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  bio: z.string().max(200, 'Bio must be less than 200 characters').optional()
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, logout, accessToken } = useAuth();
  const { notify } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isRefreshingEndpoint, setIsRefreshingEndpoint] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || ''
    }
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile({ name: data.name, bio: data.bio });
      setIsEditing(false);
    } catch {
      // Handled by context
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset({
      name: user?.name || '',
      bio: user?.bio || ''
    });
  };

  // Simulates hitting a secure endpoint in response to user action
  const fetchSecureProfileDetails = async () => {
    setIsRefreshingEndpoint(true);
    try {
      const res = await apiRequest('GET', '/auth/me');
      notify(
        'success',
        `API: /auth/me request completed. Welcome ${res.user.name}!`
      );
    } catch (err: any) {
      notify('error', err.message || 'API request failed.');
    } finally {
      setIsRefreshingEndpoint(false);
    }
  };

  if (!user) return null;

  // Generates simple avatar letters
  const avatarLetter = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 bg-background-primary text-text-primary">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Banner Section */}
        <div className="relative rounded-2xl bg-gradient-to-r from-accent-primary/20 via-accent-secondary/15 to-transparent p-6 border border-border-primary overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 p-6 pointer-events-none">
            <Shield className="h-48 w-48 text-accent-primary" />
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-primary text-text-inverse text-2xl font-bold shadow-lg shadow-accent-primary/25">
              {avatarLetter}
            </div>
            <div className="space-y-1 text-center sm:text-left flex-grow">
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                  {user.name}
                </h1>
                <Badge
                  variant={user.role === 'admin' ? 'default' : 'secondary'}
                  className="uppercase text-[10px] tracking-wide"
                >
                  {user.role}
                </Badge>
              </div>
              {user.bio && (
                <p className="text-xs text-text-tertiary mt-1.5 max-w-md italic">
                  &quot;{user.bio}&quot;
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center"
              >
                <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={logout}
                className="flex items-center"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Col 1 & 2: Edit Form or Info & Guide */}
          <div className="md:col-span-2 space-y-6">
            {isEditing ? (
              <Card className="border border-border-primary bg-background-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Edit User Profile</CardTitle>
                  <CardDescription>
                    Update your public credentials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Name"
                        disabled={isSubmitting}
                        {...register('name')}
                      />
                      {errors.name && (
                        <p className="text-xs text-accent-error">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself..."
                        rows={3}
                        disabled={isSubmitting}
                        {...register('bio')}
                      />
                      {errors.bio && (
                        <p className="text-xs text-accent-error">
                          {errors.bio.message}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" type="submit" loading={isSubmitting}>
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-border-primary bg-background-card/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <HelpCircle className="mr-2 h-5 w-5 text-accent-primary animate-pulse" />
                    How to Test the JWT Refresh Token Flow
                  </CardTitle>
                  <CardDescription>
                    Follow this interactive walkthrough to see JWT interception
                    and token rotation in action.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed">
                  <div className="space-y-3.5">
                    <div className="flex items-start space-x-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold font-mono">
                        1
                      </span>
                      <p className="text-text-secondary">
                        Observe the **JWT Interceptor Console** in the
                        bottom-right corner. It displays the decoded JWT claims
                        and real-time expiration timers.
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold font-mono">
                        2
                      </span>
                      <p className="text-text-secondary">
                        Click{' '}
                        <span className="px-1.5 py-0.5 rounded bg-state-error-bg text-accent-error text-xs font-mono font-semibold">
                          Simulate Expired Access Token
                        </span>{' '}
                        inside the console. This resets the access token&apos;s
                        expiry claim to the past.
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold font-mono">
                        3
                      </span>
                      <p className="text-text-secondary">
                        Click the **Query Secure Endpoint** button on the right
                        card to make an API request.
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold font-mono">
                        4
                      </span>
                      <p className="text-text-secondary">
                        Open the console&apos;s **Network Terminal** tab.
                        You&apos;ll see the `/auth/me` request fail with `[401
                        Unauthorized]`, trigger a silent `POST /auth/refresh`
                        request, receive fresh tokens, and seamlessly fulfill
                        the original request!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Col 3: Side Details & Operations */}
          <div className="space-y-6">
            <Card className="border border-border-primary bg-background-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Secure Operations</CardTitle>
                <CardDescription>Test the JWT API Interceptor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={fetchSecureProfileDetails}
                  loading={isRefreshingEndpoint}
                  className="w-full flex items-center justify-center"
                >
                  <Play className="mr-2 h-4 w-4" />
                  <span>Query Secure Endpoint</span>
                </Button>
                <p className="text-[10px] text-text-tertiary text-center font-mono">
                  Triggers an authorized GET request to `/auth/me`
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border-primary bg-background-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Session Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs font-mono text-text-secondary">
                <div className="flex justify-between border-b border-border-muted pb-2">
                  <span className="flex items-center text-text-tertiary">
                    <Calendar className="mr-1 h-3.5 w-3.5 text-accent-info" />{' '}
                    Registered
                  </span>
                  <span className="text-text-primary">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border-muted pb-2">
                  <span className="flex items-center text-text-tertiary">
                    <Lock className="mr-1 h-3.5 w-3.5 text-accent-warning" />{' '}
                    Security Role
                  </span>
                  <span className="text-accent-warning font-semibold uppercase">
                    {user.role}
                  </span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-text-tertiary">
                    Active Key ID (KID)
                  </span>
                  <span className="text-text-primary truncate bg-background-secondary p-1.5 rounded text-[10px]">
                    {accessToken?.substring(0, 32) || 'N/A'}...
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
