import { useState, useRef, useEffect } from 'react';
import { Person, SECTOR_COLORS, Sector } from '@/types/organogram';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface PersonCardProps {
  person: Person;
  onDragStart: (e: React.MouseEvent, person: Person) => void;
  onDragEnd: () => void;
  onConnectionStart: (personId: string) => void;
  onConnectionEnd: (personId: string) => void;
  onClick: (person: Person) => void;
  isConnecting: boolean;
  connectingFrom: string | null;
  isDragging: boolean;
}

export function PersonCard({
  person,
  onDragStart,
  onDragEnd,
  onConnectionStart,
  onConnectionEnd,
  onClick,
  isConnecting,
  connectingFrom,
  isDragging,
}: PersonCardProps) {
  const [showConnectionPoints, setShowConnectionPoints] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sectorClass = SECTOR_COLORS[person.sector as Sector] || 'sector-comercial';

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    onDragStart(e, person);
  };

  const handleConnectionPointClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingFrom && connectingFrom !== person.id) {
      onConnectionEnd(person.id);
    } else {
      onConnectionStart(person.id);
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'org-card absolute cursor-grab select-none',
        'w-48 rounded-xl shadow-lg overflow-hidden',
        'bg-card border border-border',
        isDragging && 'dragging'
      )}
      style={{
        left: person.position_x,
        top: person.position_y,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={onDragEnd}
      onMouseEnter={() => setShowConnectionPoints(true)}
      onMouseLeave={() => setShowConnectionPoints(false)}
      onClick={() => !isDragging && onClick(person)}
    >
      {/* Header with sector color */}
      <div className={cn('h-3', sectorClass)} />

      {/* Content */}
      <div className="p-4 flex flex-col items-center gap-3">
        <Avatar className="h-16 w-16 border-2 border-border shadow-md">
          <AvatarImage src={person.avatar_url || undefined} alt={person.name} />
          <AvatarFallback className={cn(sectorClass, 'text-white font-semibold')}>
            {getInitials(person.name)}
          </AvatarFallback>
        </Avatar>

        <div className="text-center">
          <h3 className="font-semibold text-foreground text-sm leading-tight">
            {person.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {person.role}
          </p>
          <span className={cn(
            'inline-block mt-2 text-xs px-2 py-0.5 rounded-full text-white',
            sectorClass
          )}>
            {person.sector}
          </span>
        </div>
      </div>

      {/* Connection points */}
      {(showConnectionPoints || isConnecting) && (
        <>
          {/* Right connection point */}
          <button
            className={cn(
              'connection-point absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2',
              'w-4 h-4 rounded-full border-2 border-primary bg-card',
              'hover:bg-primary hover:scale-125',
              isConnecting && connectingFrom !== person.id && 'bg-primary animate-pulse'
            )}
            onClick={handleConnectionPointClick}
            onMouseDown={e => e.stopPropagation()}
          />
          {/* Left connection point */}
          <button
            className={cn(
              'connection-point absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2',
              'w-4 h-4 rounded-full border-2 border-primary bg-card',
              'hover:bg-primary hover:scale-125',
              isConnecting && connectingFrom !== person.id && 'bg-primary animate-pulse'
            )}
            onClick={handleConnectionPointClick}
            onMouseDown={e => e.stopPropagation()}
          />
        </>
      )}
    </div>
  );
}
