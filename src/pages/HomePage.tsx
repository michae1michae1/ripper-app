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
    <div className="min-h-screen bg-midnight flex flex-col">
      {/* Header - minimal, content speaks for itself */}
      <header className="border-b border-storm bg-obsidian/50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          {/* Empty header - branding is in the hero section */}
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl">

          
          <h1 className="text-5xl md:text-6xl font-bold text-snow mb-6 leading-tight">
            Run your{' '}
            <span className="text-arcane">draft events</span>{' '}
            with ease
          </h1>
          
          <p className="text-lg text-mist mb-10 max-w-xl mx-auto">
            Manage booster drafts and sealed events from setup to final standings. 
            Track picks, run timers, and setup match ready for pairings automatically.
          </p>
          
          {/* Two Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
            {/* Join Event Option */}
            <div className="bg-obsidian border border-storm rounded-2xl p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users className="w-5 h-5 text-arcane" />
                <h2 className="text-lg font-semibold text-snow">Join Event</h2>
              </div>
              <p className="text-sm text-mist mb-4">
                Enter an event code or paste a link
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={joinInput}
                  onChange={(e) => {
                    setJoinInput(e.target.value);
                    setJoinError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Code or link..."
                  className="w-full px-4 py-3 bg-slate border border-storm rounded-xl text-snow placeholder:text-mist focus:outline-none focus:border-arcane transition-colors text-center font-mono uppercase"
                  maxLength={100}
                />
                {joinError && (
                  <p className="text-danger text-sm">{joinError}</p>
                )}
                <Button
                  onClick={handleJoinEvent}
                  isLoading={isJoining}
                  disabled={!joinInput.trim()}
                  className="w-full"
                >
                  Join
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Start as Admin Option */}
            <div className="bg-obsidian border border-storm rounded-2xl p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-warning" />
                <h2 className="text-lg font-semibold text-snow">Host Event</h2>
              </div>
              <p className="text-sm text-mist mb-4">
                Create and manage a new event
              </p>
              <div className="space-y-3">
                <div className="h-[52px] flex items-center justify-center text-mist text-sm">
                  Requires admin password
                </div>
                <Button
                  onClick={() => navigate('/admin/new')}
                  variant="secondary"
                  className="w-full"
                >
                  <Lock className="w-4 h-4" />
                  Start as Admin
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
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
      <footer className="border-t border-storm py-6">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-mist">
          <p>Built for the MTG community. No accounts needed.</p>
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
  <div className="bg-obsidian border border-storm rounded-xl p-6 text-center">
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="font-semibold text-snow mb-2">{title}</h3>
    <p className="text-sm text-mist">{description}</p>
  </div>
);
