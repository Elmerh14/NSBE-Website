import { createBrowserRouter } from 'react-router';

import { ChangePasswordPage } from './features/auth/ChangePasswordPage';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/change-password', element: <ChangePasswordPage /> },
  // Elmer: once your protected-route wrapper exists, admin pages go inside it (hand-written).
  { path: '/', element: <DashboardPage /> },
]);
