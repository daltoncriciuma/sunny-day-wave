import { useState, useRef, memo, useCallback } from 'react';
import { Person, CARD_COLORS, CardSize, CARD_SIZES } from '@/types/organogram';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Trash2, Lock, Unlock } from 'lucide-react';

interface PersonCardProps {
  person: Person;
  onDragStart: (e: React.MouseEvent, person: Person) => void;
  onDragEnd: () => void;
  onConnectionStart: (personId: string) => void;
  onConnectionEnd: (personId: string) => void;
  onDoubleClick: (person: Person) => void;
  onSelect?: (personId: string) => void;
  onDelete?: (personId: string) => void;
  onToggleLock?: (personId: string, locked: boolean) => void;
  isConnecting: boolean;
  connectingFrom: string | null;
  isDragging: boolean;
  isSelected?: boolean;
  isCollapsed: boolean;
}

export const PersonCard = memo(function PersonCard({
  person,
  onDragStart,
  onDragEnd,
  onConnectionStart,
  onConnectionEnd,
  onDoubleClick,
  onSelect,
  onDelete,
  onToggleLock,
  isConnecting,
  connectingFrom,
  isDragging,
  isSelected,
  isCollapsed,
}: PersonCardProps) {
  const isMobile = useIsMobile();
  const [showConnectionPoints, setShowConnectionPoints] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get color from avatar_url (we're reusing this field to store color)
  const cardColor = person.avatar_url || CARD_COLORS[0].value;
  
  // Get dimensions based on person's individual card_size and collapsed state
  const cardSize = person.card_size || 'medium';
  const dimensions = CARD_SIZES[cardSize];
  const height = isCollapsed ? 40 : dimensions.height;
  const width = dimensions.width;

  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // Don't start drag if clicking on delete button or connection points
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    
    // Don't allow drag if card is locked
    if (person.locked) {
      e.stopPropagation();
      return;
    }
    
    e.stopPropagation();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    onDragStart(e, person);
  }, [onDragStart, person]);

  const handleConnectionPointMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onConnectionStart(person.id);
  }, [onConnectionStart, person.id]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Check if it was a real drag or just a click
    if (dragStartRef.current) {
      const dx = Math.abs(e.clientX - dragStartRef.current.x);
      const dy = Math.abs(e.clientY - dragStartRef.current.y);
      hasDraggedRef.current = dx > 5 || dy > 5;
    }
    
    onDragEnd();
    if (connectingFrom && connectingFrom !== person.id) {
      onConnectionEnd(person.id);
    }
    dragStartRef.current = null;
  }, [onDragEnd, connectingFrom, person.id, onConnectionEnd]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't select when clicking buttons (trash / connection points)
    if (target.closest('button')) return;
    if (hasDraggedRef.current) return;
    onSelect?.(person.id);
  }, [onSelect, person.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(person.id);
    }
  }, [onDelete, person.id]);

  const handleToggleLock = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleLock) {
      onToggleLock(person.id, !person.locked);
    }
  }, [onToggleLock, person.id, person.locked]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Only open dialog if we didn't just drag
    if (!hasDraggedRef.current) {
      onDoubleClick(person);
    }
  }, [onDoubleClick, person]);

  const handleMouseEnter = useCallback(() => setShowConnectionPoints(true), []);
  const handleMouseLeave = useCallback(() => setShowConnectionPoints(false), []);

  // Check if card should be filled
  const fillCard = (person as any).fill_card || false;

  return (
    <div
      ref={cardRef}
      className={cn(
        'group org-card absolute z-10 select-none',
        person.locked ? 'cursor-default' : 'cursor-grab',
        'rounded-xl shadow-lg overflow-hidden',
        'transition-shadow duration-200',
        !fillCard && 'border-2 bg-card',
        isDragging && 'dragging',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
      style={{
        left: person.position_x,
        top: person.position_y,
        width,
        height,
        transform: 'translate(-50%, -50%)',
        backgroundColor: fillCard ? cardColor : undefined,
        borderColor: !fillCard ? cardColor : undefined,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Content */}
      <div className="p-2 h-full flex flex-col justify-center items-center text-center">
        <h3 className={cn(
          'font-bold leading-tight truncate w-full',
          isCollapsed ? 'text-sm' : 'text-base',
          fillCard ? 'text-white drop-shadow-sm' : 'text-foreground'
        )}>
          {person.name}
        </h3>
        {!isCollapsed && person.sector && (
          <span className={cn(
            "inline-block mt-1 text-xs px-2 py-0.5 rounded-full truncate max-w-full",
            fillCard 
              ? "bg-white/20 text-white/90" 
              : "border border-border text-muted-foreground"
          )}>
            {person.sector}
          </span>
        )}
      </div>

      {/* Action buttons container - shows on hover */}
      <div className={cn(
        'absolute top-1 right-1 flex gap-1 transition-opacity duration-150',
        (isMobile || isSelected) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      )}>
        {/* Lock button */}
        {onToggleLock && (
          <button
            className={cn(
              'p-1 rounded-md transition-colors',
              person.locked 
                ? 'bg-amber-500/90 text-white hover:bg-amber-600' 
                : 'bg-muted/90 text-muted-foreground hover:bg-muted'
            )}
            onClick={handleToggleLock}
            title={person.locked ? 'Desbloquear posição' : 'Travar posição'}
          >
            {person.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </button>
        )}
        {/* Delete button */}
        {onDelete && (
          <button
            className="p-1 rounded-md bg-destructive/90 text-destructive-foreground hover:bg-destructive"
            onClick={handleDelete}
            title="Remover"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
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
});
