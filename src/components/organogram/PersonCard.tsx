import { useState, useRef } from 'react';
import { Person, CARD_COLORS, CardSize, CARD_SIZES } from '@/types/organogram';
import { cn } from '@/lib/utils';

interface PersonCardProps {
  person: Person;
  onDragStart: (e: React.MouseEvent, person: Person) => void;
  onDragEnd: () => void;
  onConnectionStart: (personId: string) => void;
  onConnectionEnd: (personId: string) => void;
  onDoubleClick: (person: Person) => void;
  isConnecting: boolean;
  connectingFrom: string | null;
  isDragging: boolean;
  isSelected?: boolean;
  cardSize: CardSize;
  isCollapsed: boolean;
}

export function PersonCard({
  person,
  onDragStart,
  onDragEnd,
  onConnectionStart,
  onConnectionEnd,
  onDoubleClick,
  isConnecting,
  connectingFrom,
  isDragging,
  isSelected,
  cardSize,
  isCollapsed,
}: PersonCardProps) {
  const [showConnectionPoints, setShowConnectionPoints] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get color from avatar_url (we're reusing this field to store color)
  const cardColor = person.avatar_url || CARD_COLORS[0].value;
  
  // Get dimensions based on size and collapsed state
  const dimensions = CARD_SIZES[cardSize];
  const height = isCollapsed ? 40 : dimensions.height;
  const width = dimensions.width;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    onDragStart(e, person);
  };

  const handleConnectionPointMouseDown = (e: React.MouseEvent) => {
    // Drag-to-connect behavior
    e.preventDefault();
    e.stopPropagation();
    onConnectionStart(person.id);
  };

  const handleMouseUp = () => {
    onDragEnd();
    if (connectingFrom && connectingFrom !== person.id) {
      onConnectionEnd(person.id);
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'org-card absolute cursor-grab select-none',
        'rounded-xl shadow-lg overflow-hidden',
        'border-2 bg-card transition-all duration-200',
        isDragging && 'dragging',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
      style={{
        left: person.position_x,
        top: person.position_y,
        width,
        height,
        transform: 'translate(-50%, -50%)',
        borderColor: cardColor,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setShowConnectionPoints(true)}
      onMouseLeave={() => setShowConnectionPoints(false)}
      onDoubleClick={() => !isDragging && onDoubleClick(person)}
    >
      {/* Content */}
      <div className="p-2 h-full flex flex-col justify-center items-center text-center">
        <h3 className={cn(
          'font-bold text-foreground leading-tight truncate w-full',
          isCollapsed ? 'text-sm' : 'text-base'
        )}>
          {person.name}
        </h3>
        {!isCollapsed && (
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground truncate max-w-full">
            {person.sector}
          </span>
        )}
      </div>

      {/* Connection points */}
      {(showConnectionPoints || isConnecting) && (
        <>
          {/* Right connection point */}
          <button
            className={cn(
              'connection-point absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2',
              'w-4 h-4 rounded-full border-2 border-foreground/40 bg-background/80',
              'hover:scale-125',
              isConnecting && connectingFrom !== person.id && 'animate-pulse'
            )}
            onMouseDown={handleConnectionPointMouseDown}
          />
          {/* Left connection point */}
          <button
            className={cn(
              'connection-point absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2',
              'w-4 h-4 rounded-full border-2 border-foreground/40 bg-background/80',
              'hover:scale-125',
              isConnecting && connectingFrom !== person.id && 'animate-pulse'
            )}
            onMouseDown={handleConnectionPointMouseDown}
          />
        </>
      )}
    </div>
  );
}
