import { useState, useEffect } from 'react';
import { ChevronDown, Loader2, Package } from 'lucide-react';
import { fetchMtgSets, type MtgSet } from '@/lib/scryfall';
import { cn } from '@/lib/cn';

interface SetSelectorProps {
  value: { code: string | null; name: string | null };
  onChange: (code: string | null, name: string | null) => void;
}

export const SetSelector = ({ value, onChange }: SetSelectorProps) => {
  const [sets, setSets] = useState<MtgSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    
    fetchMtgSets()
      .then((data) => {
        if (mounted) {
          setSets(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError('Failed to load sets');
          setIsLoading(false);
          console.error(err);
        }
      });
    
    return () => { mounted = false; };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.set-selector')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredSets = sets.filter(set => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return set.name.toLowerCase().includes(query) || 
           set.code.toLowerCase().includes(query);
  });

  const handleSelect = (set: MtgSet | null) => {
    if (set) {
      onChange(set.code.toUpperCase(), set.name);
    } else {
      onChange(null, null);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const selectedDisplay = value.name 
    ? `${value.name} (${value.code?.toUpperCase()})` 
    : 'Select a Set (Optional)';

  return (
    <div 
      data-component="SetSelector"
      data-set-code={value.code || undefined}
      className="set-selector space-y-2"
    >
      <label className="set-selector__label block text-sm font-semibold text-snow uppercase tracking-wide">
        <div className="set-selector__label-content flex items-center gap-2">
          <Package className="set-selector__label-icon w-4 h-4 text-arcane" />
          Set / Expansion
        </div>
      </label>
      
      <div className="set-selector__dropdown relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          data-open={isOpen || undefined}
          className={cn(
            'set-selector__trigger',
            'w-full px-4 py-3 bg-slate border border-storm rounded-xl text-left',
            'flex items-center justify-between',
            'hover:border-arcane/50 transition-colors',
            'focus:outline-none focus:border-arcane',
            isLoading && 'opacity-60 cursor-not-allowed'
          )}
        >
          <span className={cn(
            'set-selector__value',
            value.name ? 'text-snow' : 'text-mist'
          )}>
            {isLoading ? 'Loading sets...' : selectedDisplay}
          </span>
          {isLoading ? (
            <Loader2 className="set-selector__loader w-4 h-4 text-mist animate-spin" />
          ) : (
            <ChevronDown className={cn(
              'set-selector__chevron w-4 h-4 text-mist transition-transform',
              isOpen && 'rotate-180'
            )} />
          )}
        </button>
        
        {isOpen && !isLoading && (
          <div className="set-selector__menu absolute z-50 w-full mt-2 bg-obsidian border border-storm rounded-xl shadow-xl overflow-hidden">
            {/* Search input */}
            <div className="set-selector__search-wrapper p-2 border-b border-storm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sets..."
                className="set-selector__search-input w-full px-3 py-2 bg-slate border border-storm rounded-lg text-snow text-sm placeholder:text-mist focus:outline-none focus:border-arcane"
                autoFocus
              />
            </div>
            
            {/* Options */}
            <div className="set-selector__options max-h-64 overflow-y-auto">
              {/* None option */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={cn(
                  'set-selector__option set-selector__option--none',
                  'w-full px-4 py-2.5 text-left text-sm hover:bg-slate transition-colors',
                  !value.code && 'bg-arcane/10 text-arcane'
                )}
              >
                <span className="text-mist italic">No set selected</span>
              </button>
              
              {error ? (
                <div className="set-selector__error px-4 py-3 text-sm text-danger">{error}</div>
              ) : filteredSets.length === 0 ? (
                <div className="set-selector__empty px-4 py-3 text-sm text-mist">No sets found</div>
              ) : (
                filteredSets.map((set) => (
                  <button
                    key={set.code}
                    type="button"
                    data-set-code={set.code}
                    onClick={() => handleSelect(set)}
                    className={cn(
                      'set-selector__option',
                      'w-full px-4 py-2.5 text-left text-sm hover:bg-slate transition-colors flex items-center justify-between',
                      value.code?.toLowerCase() === set.code.toLowerCase() && 'set-selector__option--selected bg-arcane/10'
                    )}
                  >
                    <span className={cn(
                      'set-selector__option-name text-snow',
                      value.code?.toLowerCase() === set.code.toLowerCase() && 'text-arcane'
                    )}>
                      {set.name}
                    </span>
                    <span className="set-selector__option-code text-xs text-mist font-mono">{set.code.toUpperCase()}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      <p className="set-selector__hint text-xs text-mist">
        Choose the MTG set being drafted or played
      </p>
    </div>
  );
};

