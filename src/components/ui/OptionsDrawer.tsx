import { useState, useEffect } from 'react';
import { X, Copy, Check, Sun, Moon, Monitor, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type Theme = 'light' | 'dark' | 'system';

interface OptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  eventCode?: string;
  eventLink?: string;
}

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('theme') as Theme) || 'dark';
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
    root.classList.toggle('light', !prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
  }
};

export const OptionsDrawer = ({
  isOpen,
  onClose,
  eventCode,
  eventLink,
}: OptionsDrawerProps) => {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const handleCopyCode = () => {
    if (!eventCode) return;
    navigator.clipboard.writeText(eventCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!eventLink) return;
    navigator.clipboard.writeText(eventLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        data-component="OptionsDrawer-Backdrop"
        className={cn(
          'options-drawer__backdrop fixed inset-0 bg-black/60 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        data-component="OptionsDrawer"
        data-open={isOpen || undefined}
        className={cn(
          'options-drawer fixed inset-x-0 bottom-0 z-50 bg-obsidian border-t border-storm rounded-t-2xl',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Handle */}
        <div className="options-drawer__handle flex justify-center py-3">
          <div className="w-10 h-1 bg-storm rounded-full" />
        </div>

        {/* Header */}
        <div className="options-drawer__header flex items-center justify-between px-4 pb-4 border-b border-storm">
          <h3 className="options-drawer__title text-lg font-semibold text-snow">Options</h3>
          <button
            onClick={onClose}
            className="options-drawer__close p-2 text-mist hover:text-snow rounded-lg hover:bg-slate transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="options-drawer__content p-4 space-y-6 pb-8">
          {/* Theme Selector */}
          <div className="options-drawer__section">
            <h4 className="options-drawer__section-title text-xs font-semibold text-mist uppercase tracking-wide mb-3">
              Theme
            </h4>
            <div className="options-drawer__theme-options flex gap-2">
              <button
                onClick={() => setTheme('light')}
                data-active={theme === 'light' || undefined}
                className={cn(
                  'options-drawer__theme-btn flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all',
                  theme === 'light'
                    ? 'bg-arcane/20 border-arcane text-arcane'
                    : 'bg-slate border-storm text-mist hover:text-snow hover:border-mist'
                )}
              >
                <Sun className="w-4 h-4" />
                <span className="text-sm font-medium">Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                data-active={theme === 'dark' || undefined}
                className={cn(
                  'options-drawer__theme-btn flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all',
                  theme === 'dark'
                    ? 'bg-arcane/20 border-arcane text-arcane'
                    : 'bg-slate border-storm text-mist hover:text-snow hover:border-mist'
                )}
              >
                <Moon className="w-4 h-4" />
                <span className="text-sm font-medium">Dark</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                data-active={theme === 'system' || undefined}
                className={cn(
                  'options-drawer__theme-btn flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all',
                  theme === 'system'
                    ? 'bg-arcane/20 border-arcane text-arcane'
                    : 'bg-slate border-storm text-mist hover:text-snow hover:border-mist'
                )}
              >
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </div>

          {/* Event Code */}
          {eventCode && (
            <div className="options-drawer__section">
              <h4 className="options-drawer__section-title text-xs font-semibold text-mist uppercase tracking-wide mb-3">
                Event Code
              </h4>
              <button
                onClick={handleCopyCode}
                className="options-drawer__code-btn w-full flex items-center justify-between bg-slate border border-storm rounded-lg px-4 py-3 hover:border-arcane/50 transition-colors"
              >
                <span className="options-drawer__code-value font-mono text-xl font-bold text-arcane">
                  {eventCode}
                </span>
                {codeCopied ? (
                  <Check className="w-5 h-5 text-success" />
                ) : (
                  <Copy className="w-5 h-5 text-mist" />
                )}
              </button>
            </div>
          )}

          {/* Event Link */}
          {eventLink && (
            <div className="options-drawer__section">
              <h4 className="options-drawer__section-title text-xs font-semibold text-mist uppercase tracking-wide mb-3">
                Share Link
              </h4>
              <button
                onClick={handleCopyLink}
                className="options-drawer__link-btn w-full flex items-center gap-3 bg-slate border border-storm rounded-lg px-4 py-3 hover:border-arcane/50 transition-colors"
              >
                <LinkIcon className="w-4 h-4 text-mist flex-shrink-0" />
                <span className="options-drawer__link-value font-mono text-sm text-silver truncate flex-1 text-left">
                  {eventLink}
                </span>
                {linkCopied ? (
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                ) : (
                  <Copy className="w-5 h-5 text-mist flex-shrink-0" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

