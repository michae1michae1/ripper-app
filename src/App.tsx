import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import {
  HomePage,
  EventSetupPage,
  DraftPhasePage,
  DeckbuildingPage,
  MatchRoundsPage,
  FinalScoreboardPage,
  AdminNewEventPage,
  PlayerViewPage,
} from '@/pages';

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/new" element={<AdminNewEventPage />} />
        <Route path="/new" element={<EventSetupPage />} />
        {/* Admin routes (password protected) */}
        <Route path="/event/:eventId" element={<EventSetupPage />} />
        <Route path="/event/:eventId/draft" element={<DraftPhasePage />} />
        <Route path="/event/:eventId/deckbuilding" element={<DeckbuildingPage />} />
        <Route path="/event/:eventId/round/:roundNum" element={<MatchRoundsPage />} />
        <Route path="/event/:eventId/results" element={<FinalScoreboardPage />} />
        {/* Player view (no auth required) */}
        <Route path="/event/:eventId/player" element={<PlayerViewPage />} />
        {/* Shorthand URL redirect - now goes to player view */}
        <Route path="/j/:eventId" element={<PlayerViewRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

// Redirect shorthand URLs to player view
const PlayerViewRedirect = () => {
  const { eventId } = useParams();
  return <Navigate to={`/event/${eventId}/player`} replace />;
};
