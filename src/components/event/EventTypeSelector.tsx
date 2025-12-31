import { Layers, Package } from 'lucide-react';
import { Card } from '@/components/ui';
import type { EventType } from '@/types/event';

interface EventTypeSelectorProps {
  value: EventType;
  onChange: (type: EventType) => void;
}

interface TypeOption {
  type: EventType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const typeOptions: TypeOption[] = [
  {
    type: 'draft',
    title: 'Booster Draft',
    description: '3 packs per player. Classic pick and pass format. Best for 8 players.',
    icon: <Layers className="w-6 h-6" />,
  },
  {
    type: 'sealed',
    title: 'Sealed Deck',
    description: '6 packs per player. Build directly from pool. Flexible player count.',
    icon: <Package className="w-6 h-6" />,
  },
];

export const EventTypeSelector = ({ value, onChange }: EventTypeSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {typeOptions.map((option) => (
        <Card
          key={option.type}
          selected={value === option.type}
          onClick={() => onChange(option.type)}
          className="relative"
        >
          {value === option.type && (
            <div className="absolute top-3 right-3 w-5 h-5 bg-arcane rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 bg-slate rounded-lg flex items-center justify-center text-arcane-bright">
              {option.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-snow">{option.title}</h3>
              <p className="text-sm text-mist mt-1">{option.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

