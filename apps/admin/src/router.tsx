import { createBrowserRouter } from 'react-router';

import { ChangePasswordPage } from './features/auth/ChangePasswordPage';
import { LoginPage } from './features/auth/LoginPage';
import { RequireAuth } from './features/auth/RequireAuth';
import { DashboardPage } from './features/dashboard/DashboardPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/change-password', element: <ChangePasswordPage /> },
  {
    Component: RequireAuth,
    children: [{ path: '/', Component: DashboardPage }],
  },
]);
