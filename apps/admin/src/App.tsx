import { Navigate, Route, Routes } from 'react-router';

import { AdminEventsPage } from './features/events/AdminEventsPage';

export function App() {
  return (
    <Routes>
      <Route path="/events" element={<AdminEventsPage />} />
      <Route path="/" element={<Navigate to="/events" replace />} />
      <Route
        path="*"
        element={
          <main className="p-10">
            <h1 className="text-2xl">Page not found</h1>
            <a href="/events" className="underline">
              Go to events
            </a>
          </main>
        }
      />
    </Routes>
  );
}
