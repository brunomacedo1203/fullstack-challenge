import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import React from 'react';
import { Header } from './components/Header';
import { useAuthStore } from './features/auth/store';
import { LoginPage } from './routes/Login';
import { RegisterPage } from './routes/Register';
import { HomePage } from './routes/Home';
import { TasksListPage } from './routes/TasksList';
import { TaskDetailsPage } from './routes/TaskDetails';

export type AuthContext = {
  isAuthenticated: boolean;
};

const RootComponent: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);
  return (
    <div className="min-h-screen">
      <Header isAuthenticated={isAuthenticated} />
      <div className="container mx-auto px-4 py-6">
        <Outlet />
      </div>
    </div>
  );
};

// Root route with context for auth
const rootRoute = createRootRouteWithContext<AuthContext>()({
  component: RootComponent,
});

// Public routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  beforeLoad: ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
  component: RegisterPage,
});

// Protected Home route using beforeLoad guard
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: HomePage,
});

// Tasks routes (protected)
const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: TasksListPage,
});

const taskDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks/$id',
  beforeLoad: ({ context }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: TaskDetailsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerRoute,
  homeRoute,
  tasksRoute,
  taskDetailsRoute,
]);

export const router = createRouter({
  routeTree,
  context: {
    isAuthenticated: false, // will be overridden in context prop
  },
  // Provide the context dynamically on each navigation
  // by using the "context" option function in v1. However, a simple
  // workaround is to override via RouterProvider's context prop in main.tsx
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
