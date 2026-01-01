import { ArrowRight, ArrowLeft, CornerRightDown, CornerLeftUp, CornerLeftDown, CornerRightUp } from 'lucide-react';
import { Avatar, Badge, EditablePlayerName } from '@/components/ui';
import type { Player } from '@/types/event';

interface PodSeatingProps {
  players: Player[];
  passDirection: 'left' | 'right';
}

type ArrowType = 'right' | 'left' | 'corner-down-right' | 'corner-down-left' | 'corner-up-right' | 'corner-up-left' | null;

// Helper to get visual position (row, col) for a given seat number
const getVisualPosition = (
  seatNumber: number,
  topRowCount: number,
  totalPlayers: number
): { row: number; col: number } => {
  if (seatNumber <= topRowCount) {
    // Top row: seats 1, 2, 3, 4 -> cols 0, 1, 2, 3
    return { row: 0, col: seatNumber - 1 };
  } else {
    // Bottom row: displayed in reverse order (e.g., 8, 7, 6, 5)
    // Seat 5 (first in bottom half) should be at rightmost position
    // Seat 8 (last in bottom half) should be at leftmost position
    const bottomRowCount = totalPlayers - topRowCount;
    const positionInBottomRow = seatNumber - topRowCount; // 1-indexed position in bottom half
    // Reverse: position 1 goes to col (bottomRowCount-1), position n goes to col 0
    const col = bottomRowCount - positionInBottomRow;
    return { row: 1, col };
  }
};

// Helper to determine arrow type based on pass direction and seat positions
// Arrows are always on left or right edges, using corner arrows for row transitions
const getArrowType = (
  seatNumber: number,
  passDirection: 'left' | 'right',
  totalPlayers: number,
  topRowCount: number
): ArrowType => {
  // Calculate next seat based on pass direction
  // "Left" = clockwise in U-shape = seat increases (1->2->3->...->8->1)
  // "Right" = counter-clockwise = seat decreases (1->8->7->...->2->1)
  const nextSeat = passDirection === 'left'
    ? (seatNumber % totalPlayers) + 1
    : seatNumber === 1 ? totalPlayers : seatNumber - 1;

  // Get visual positions for both seats
  const fromPos = getVisualPosition(seatNumber, topRowCount, totalPlayers);
  const toPos = getVisualPosition(nextSeat, topRowCount, totalPlayers);

  // Determine arrow based on relative visual positions
  if (fromPos.row === toPos.row) {
    // Same row - simple horizontal arrow
    return toPos.col > fromPos.col ? 'right' : 'left';
  }
  
  // Different row - use corner arrows based on pass direction
  // Pass direction determines which edge the wrap-around arrows appear on:
  // - Passing LEFT (clockwise): right edge going down, left edge going up
  // - Passing RIGHT (counter-clockwise): left edge going down, right edge going up
  if (fromPos.row < toPos.row) {
    // Going from top row to bottom row
    return passDirection === 'left' ? 'corner-down-right' : 'corner-down-left';
  } else {
    // Going from bottom row to top row
    return passDirection === 'left' ? 'corner-up-left' : 'corner-up-right';
  }
};

export const PodSeating = ({ players, passDirection }: PodSeatingProps) => {
  const totalPlayers = players.length;
  
  // Split players into two rows
  // Top row: first half (left to right) - seats 1, 2, 3, 4
  // Bottom row: second half (reversed order) - seats 8, 7, 6, 5 displayed left to right
  const topRowCount = Math.ceil(totalPlayers / 2);
  const bottomRowCount = Math.floor(totalPlayers / 2);
  
  const topRowPlayers = players.slice(0, topRowCount);
  // Bottom row players reversed for U-shape seating
  const bottomRowPlayers = players.slice(topRowCount).reverse();

  return (
    <div 
      data-component="PodSeating"
      data-player-count={totalPlayers}
      data-pass-direction={passDirection}
      className="pod-seating space-y-6"
    >
      {/* Header - Pod Seating, Pass Direction, and Active Players all on same line */}
      <div className="pod-seating__header flex items-center justify-between">
        <div className="pod-seating__title-group flex items-center gap-2">
          <div className="pod-seating__icon w-4 h-4 bg-slate rounded grid grid-cols-2 gap-0.5 p-0.5">
            <div className="bg-mist rounded-sm" />
            <div className="bg-mist rounded-sm" />
            <div className="bg-mist rounded-sm" />
            <div className="bg-mist rounded-sm" />
          </div>
          <span className="pod-seating__title font-semibold text-snow">Pod Seating</span>
        </div>
        
        {/* Pass direction - centered */}
        <div className="pod-seating__pass-direction inline-flex items-center gap-2 bg-slate/50 rounded-lg px-4 py-2">
          <span className="pod-seating__pass-label text-xs font-medium text-mist uppercase tracking-wide">Passing</span>
          {passDirection === 'left' ? (
            <ArrowLeft className="pod-seating__pass-icon w-4 h-4 text-snow" />
          ) : (
            <ArrowRight className="pod-seating__pass-icon w-4 h-4 text-snow" />
          )}
          <span className="pod-seating__pass-value text-sm font-medium text-snow capitalize">{passDirection}</span>
        </div>
        
        {/* Active players count - styled badge with border */}
        <div className="pod-seating__player-count inline-flex items-center gap-2 border border-storm rounded-full px-3 py-1.5">
          <div className="pod-seating__active-indicator w-2 h-2 bg-success rounded-full" />
          <span className="pod-seating__count-text text-sm text-mist">{totalPlayers} Active Players</span>
        </div>
      </div>

      {/* Two-row flexbox layout with centering */}
      <div className="pod-seating__grid space-y-8">
        {/* Top Row - flexbox centered */}
        <div className="pod-seating__row pod-seating__row--top flex flex-wrap justify-center gap-4">
          {topRowPlayers.map((player, index) => {
            const seatNumber = index + 1;
            const arrowType = getArrowType(seatNumber, passDirection, totalPlayers, topRowCount);
            
            return (
              <PlayerCard
                key={player.id}
                player={player}
                seatNumber={seatNumber}
                arrowType={arrowType}
              />
            );
          })}
        </div>

        {/* Bottom Row - flexbox centered (reversed order for U-shape) */}
        {bottomRowCount > 0 && (
          <div className="pod-seating__row pod-seating__row--bottom flex flex-wrap justify-center gap-4">
            {bottomRowPlayers.map((player, index) => {
              // Calculate actual seat number (bottom row is reversed visually)
              // bottomRowPlayers is already reversed, so first item is the last seat
              const actualIndex = totalPlayers - bottomRowCount + (bottomRowCount - 1 - index);
              const seatNumber = actualIndex + 1;
              const arrowType = getArrowType(seatNumber, passDirection, totalPlayers, topRowCount);
              
              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  seatNumber={seatNumber}
                  arrowType={arrowType}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

interface PlayerCardProps {
  player: Player;
  seatNumber: number;
  arrowType: ArrowType;
}

const ArrowBadge = ({ children, position }: { children: React.ReactNode; position: 'left' | 'right' }) => {
  const positionClass = position === 'right' 
    ? '-right-4 top-1/2 -translate-y-1/2' 
    : '-left-4 top-1/2 -translate-y-1/2';
  
  return (
    <div 
      data-component="ArrowBadge"
      data-position={position}
      className={`player-card__arrow-badge player-card__arrow-badge--${position} absolute ${positionClass} w-8 h-8 bg-obsidian border border-storm text-snow rounded-full flex items-center justify-center shadow-lg z-20 hidden lg:flex`}
    >
      {children}
    </div>
  );
};

const PlayerCard = ({ 
  player, 
  seatNumber, 
  arrowType,
}: PlayerCardProps) => {
  return (
    <div 
      data-component="PlayerCard"
      data-player-id={player.id}
      data-seat={seatNumber}
      data-arrow-type={arrowType || undefined}
      className="player-card group relative bg-slate border border-storm rounded-2xl p-4 hover:border-arcane/50 transition-all duration-300 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
    >
      <div className="player-card__header flex items-center justify-between mb-3">
        <span className="player-card__seat text-xs text-mist font-mono">SEAT {String(seatNumber).padStart(2, '0')}</span>
        <Badge variant="success" className="player-card__status text-[10px]">PICKING</Badge>
      </div>
      <div className="player-card__info flex items-center gap-3">
        <Avatar name={player.name} size="md" />
        <div className="player-card__name-wrapper min-w-0 flex-1">
          <EditablePlayerName
            playerId={player.id}
            name={player.name}
            className="font-semibold text-snow"
            size="sm"
          />
        </div>
      </div>
      
      {/* Right arrow */}
      {arrowType === 'right' && (
        <ArrowBadge position="right">
          <ArrowRight className="w-4 h-4" />
        </ArrowBadge>
      )}
      
      {/* Left arrow */}
      {arrowType === 'left' && (
        <ArrowBadge position="left">
          <ArrowLeft className="w-4 h-4" />
        </ArrowBadge>
      )}
      
      {/* Corner down-right (top row to bottom row, target on right) */}
      {arrowType === 'corner-down-right' && (
        <ArrowBadge position="right">
          <CornerRightDown className="w-4 h-4" />
        </ArrowBadge>
      )}
      
      {/* Corner down-left (top row to bottom row, target on left) */}
      {arrowType === 'corner-down-left' && (
        <ArrowBadge position="left">
          <CornerLeftDown className="w-4 h-4" />
        </ArrowBadge>
      )}
      
      {/* Corner up-left (bottom row to top row, target on left) */}
      {arrowType === 'corner-up-left' && (
        <ArrowBadge position="left">
          <CornerLeftUp className="w-4 h-4" />
        </ArrowBadge>
      )}
      
      {/* Corner up-right (bottom row to top row, target on right) */}
      {arrowType === 'corner-up-right' && (
        <ArrowBadge position="right">
          <CornerRightUp className="w-4 h-4" />
        </ArrowBadge>
      )}
    </div>
  );
};
