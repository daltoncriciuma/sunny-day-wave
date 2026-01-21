import { ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CardSize, CARD_SIZES } from '@/types/organogram';
import { cn } from '@/lib/utils';

interface ViewControlsProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  cardSize: CardSize;
  onCardSizeChange: (size: CardSize) => void;
}

export function ViewControls({
  isCollapsed,
  onToggleCollapse,
  cardSize,
  onCardSizeChange,
}: ViewControlsProps) {
  return (
    <div className="fixed bottom-4 right-4 flex gap-2 z-50">
      {/* Collapse/Expand button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleCollapse}
        className="h-9 w-9 bg-background/80 backdrop-blur-sm shadow-md"
        title={isCollapsed ? 'Expandir todos' : 'Recolher todos'}
      >
        {isCollapsed ? (
          <Maximize2 className="h-4 w-4" />
        ) : (
          <Minimize2 className="h-4 w-4" />
        )}
      </Button>

      {/* Size selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-background/80 backdrop-blur-sm shadow-md gap-1"
          >
            <span className="text-xs">{CARD_SIZES[cardSize].label}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(Object.keys(CARD_SIZES) as CardSize[]).map((size) => (
            <DropdownMenuItem
              key={size}
              onClick={() => onCardSizeChange(size)}
              className={cn(cardSize === size && 'bg-accent')}
            >
              {CARD_SIZES[size].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
