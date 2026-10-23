import { Navigate, Outlet } from 'react-router';

import { useCurrentUser } from './useCurrentUser';

export function RequireAuth() {
  const request = useCurrentUser();

  if (request.isPending) {
    return <p>Loading...</p>;
  }

  if (request.error) {
    return <Navigate to="/login" replace={true} />;
  }

  if (request.data.mustChangePassword) {
    return <Navigate to="/change-password" replace={true} />;
  }

  return <Outlet />;
}
