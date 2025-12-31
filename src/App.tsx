import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  HomePage,
  EventSetupPage,
  DraftPhasePage,
  DeckbuildingPage,
  MatchRoundsPage,
  FinalScoreboardPage,
  AdminNewEventPage,
} from '@/pages';

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/new" element={<AdminNewEventPage />} />
        <Route path="/new" element={<EventSetupPage />} />
        <Route path="/event/:eventId" element={<EventSetupPage />} />
        <Route path="/event/:eventId/draft" element={<DraftPhasePage />} />
        <Route path="/event/:eventId/deckbuilding" element={<DeckbuildingPage />} />
        <Route path="/event/:eventId/round/:roundNum" element={<MatchRoundsPage />} />
        <Route path="/event/:eventId/results" element={<FinalScoreboardPage />} />
        {/* Shorthand URL redirect */}
        <Route path="/j/:eventId" element={<EventSetupRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

// Redirect shorthand URLs to full event URL
const EventSetupRedirect = () => {
  const { eventId } = useParams();
  return <Navigate to={`/event/${eventId}`} replace />;
};

import { useParams } from 'react-router-dom';
