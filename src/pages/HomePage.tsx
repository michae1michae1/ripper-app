import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui';
import { getEventByCode, getEventSession } from '@/lib/api';
import { parseCompositeId } from '@/lib/generateId';

export const HomePage = () => {
  const navigate = useNavigate();
  const [joinInput, setJoinInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleJoinEvent = async () => {
    if (!joinInput.trim()) return;
    
    setIsJoining(true);
    setJoinError('');
    
    const input = joinInput.trim().toUpperCase();
    
    try {
      // Check if it's a 4-character code
      if (/^[A-Z0-9]{4}$/.test(input)) {
        const { data, error } = await getEventByCode(input);
        if (data) {
          navigateToEventPhase(data);
          return;
        }
        setJoinError(error || 'Event not found');
        setIsJoining(false);
        return;
      }
      
      // Try to parse as a URL or composite ID
      let eventId = input;
      
      // Extract from full URL if pasted
      const urlMatch = input.match(/\/event\/([A-Z0-9]{4}-[a-z0-9-]+)/i);
      if (urlMatch) {
        eventId = urlMatch[1];
      }
      
      // Try to parse composite ID
      const parsed = parseCompositeId(eventId);
      if (parsed) {
        // Use the unique ID part
        const { data, error } = await getEventSession(parsed.id);
        if (data) {
          navigateToEventPhase(data);
          return;
        }
        setJoinError(error || 'Event not found');
        setIsJoining(false);
        return;
      }
      
      // Try as a direct event ID
      const { data, error } = await getEventSession(eventId.toLowerCase());
      if (data) {
        navigateToEventPhase(data);
        return;
      }
      
      setJoinError(error || 'Event not found');
    } catch (err) {
      setJoinError('Failed to find event. Please check the code or link.');
    } finally {
      setIsJoining(false);
    }
  };

  const navigateToEventPhase = (event: { id: string; eventCode: string; currentPhase: string; currentRound?: number }) => {
    const compositeId = `${event.eventCode}-${event.id}`;
    
    switch (event.currentPhase) {
      case 'drafting':
        navigate(`/event/${compositeId}/draft`);
        break;
      case 'deckbuilding':
        navigate(`/event/${compositeId}/deckbuilding`);
        break;
      case 'rounds':
        navigate(`/event/${compositeId}/round/${event.currentRound || 1}`);
        break;
      case 'complete':
        navigate(`/event/${compositeId}/results`);
        break;
      default:
        // Setup phase - requires admin access
        navigate(`/event/${compositeId}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinEvent();
    }
  };

  return (
    <div 
      data-page="HomePage"
      className="home-page min-h-screen bg-midnight flex flex-col"
    >
      {/* Header - minimal, content speaks for itself */}
      <header className="home-page__header border-b border-storm bg-obsidian/50">
        <div className="home-page__header-container max-w-5xl mx-auto px-4 py-3">
          {/* Empty header - branding is in the hero section */}
        </div>
      </header>

      {/* Hero */}
      <main className="home-page__main flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="home-page__hero text-center max-w-2xl">

          
          <h1 className="home-page__title text-5xl md:text-6xl font-bold text-snow mb-6 leading-tight">
            Run your{' '}
            <span className="home-page__title-highlight text-arcane">draft events</span>{' '}
            with ease
          </h1>
          
          <p className="home-page__subtitle text-lg text-mist mb-10 max-w-xl mx-auto">
            Manage booster drafts and sealed events from setup to final standings. 
            Track picks, run timers, and setup match ready for pairings automatically.
          </p>
          
          {/* Two Options */}
          <div className="home-page__options grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
            {/* Join Event Option */}
            <div 
              data-section="join-event"
              className="home-page__option-card home-page__option-card--join bg-obsidian border border-storm rounded-2xl p-6"
            >
              <div className="home-page__option-header flex items-center justify-center gap-2 mb-4">
                <Users className="home-page__option-icon w-5 h-5 text-arcane" />
                <h2 className="home-page__option-title text-lg font-semibold text-snow">Join Event</h2>
              </div>
              <p className="home-page__option-description text-sm text-mist mb-4">
                Enter an event code or paste a link
              </p>
              <div className="home-page__option-form space-y-3">
                <input
                  type="text"
                  value={joinInput}
                  onChange={(e) => {
                    setJoinInput(e.target.value);
                    setJoinError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Code or link..."
                  className="home-page__join-input w-full px-4 py-3 bg-slate border border-storm rounded-xl text-snow placeholder:text-mist focus:outline-none focus:border-arcane transition-colors text-center font-mono uppercase"
                  maxLength={100}
                />
                {joinError && (
                  <p className="home-page__join-error text-danger text-sm">{joinError}</p>
                )}
                <Button
                  onClick={handleJoinEvent}
                  isLoading={isJoining}
                  disabled={!joinInput.trim()}
                  className="home-page__join-btn w-full"
                >
                  Join
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Start as Admin Option */}
            <div 
              data-section="host-event"
              className="home-page__option-card home-page__option-card--host bg-obsidian border border-storm rounded-2xl p-6"
            >
              <div className="home-page__option-header flex items-center justify-center gap-2 mb-4">
                <Lock className="home-page__option-icon w-5 h-5 text-warning" />
                <h2 className="home-page__option-title text-lg font-semibold text-snow">Host Event</h2>
              </div>
              <p className="home-page__option-description text-sm text-mist mb-4">
                Create and manage a new event
              </p>
              <div className="home-page__option-form space-y-3">
                <div className="home-page__admin-notice h-[52px] flex items-center justify-center text-mist text-sm">
                  Requires admin password
                </div>
                <Button
                  onClick={() => navigate('/admin/new')}
                  variant="secondary"
                  className="home-page__admin-btn w-full"
                >
                  <Lock className="w-4 h-4" />
                  Start as Admin
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="home-page__features mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          <FeatureCard
            icon="⏱️"
            title="Draft Timers"
            description="Pick timers with pack tracking and pass direction visualization"
          />
          <FeatureCard
            icon="🎲"
            title="Swiss Pairing"
            description="Automatic pairings with proper tiebreakers and bye handling"
          />
          <FeatureCard
            icon="📊"
            title="Live Standings"
            description="Real-time rankings with OMW%, GW%, and exportable results"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="home-page__footer border-t border-storm py-6">
        <div className="home-page__footer-container max-w-5xl mx-auto px-4 text-center text-sm text-mist">
          <p className="home-page__footer-text">Built for the MTG community. No accounts needed.</p>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div 
    data-component="FeatureCard"
    className="feature-card bg-obsidian border border-storm rounded-xl p-6 text-center"
  >
    <div className="feature-card__icon text-3xl mb-3">{icon}</div>
    <h3 className="feature-card__title font-semibold text-snow mb-2">{title}</h3>
    <p className="feature-card__description text-sm text-mist">{description}</p>
  </div>
);
