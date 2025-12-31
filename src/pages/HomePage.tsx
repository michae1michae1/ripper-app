import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

export const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-midnight flex flex-col">
      {/* Header */}
      <header className="border-b border-storm bg-obsidian/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-arcane rounded-xl flex items-center justify-center font-bold text-white">
              RL
            </div>
            <span className="text-xl font-semibold text-snow">Ripper Limit</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-arcane" />
            <span className="text-sm text-arcane font-medium uppercase tracking-wider">
              MTG Event Manager
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-snow mb-6 leading-tight">
            Run your{' '}
            <span className="text-arcane">draft events</span>{' '}
            with ease
          </h1>
          
          <p className="text-lg text-mist mb-10 max-w-lg mx-auto">
            Manage booster drafts and sealed events from setup to final standings. 
            Track picks, run timers, and calculate Swiss pairings automatically.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/new')}
              className="w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              Create New Event
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
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
