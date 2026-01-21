import { Plus, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectorFilter } from './SectorFilter';
import { Sector } from '@/types/organogram';

interface TopBarProps {
  onAddPerson: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  sectors: Sector[];
  selectedSectorId: string | null;
  onSelectSector: (sectorId: string | null) => void;
  onAddSector: (name: string, color: string) => Promise<Sector | null>;
  onUpdateSector: (id: string, updates: { name?: string; color?: string }) => Promise<Sector | null>;
  onDeleteSector: (id: string) => Promise<void>;
}

export function TopBar({
  onAddPerson,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  sectors,
  selectedSectorId,
  onSelectSector,
  onAddSector,
  onUpdateSector,
  onDeleteSector,
}: TopBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-card/80 backdrop-blur-lg border-b border-border z-50 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">O</span>
        </div>
        <h1 className="font-semibold text-foreground">Organograma</h1>
        
        <div className="ml-4">
          <SectorFilter
            sectors={sectors}
            selectedSectorId={selectedSectorId}
            onSelectSector={onSelectSector}
            onAddSector={onAddSector}
            onUpdateSector={onUpdateSector}
            onDeleteSector={onDeleteSector}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onZoomIn}
            disabled={zoom >= 2}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onResetView}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

        <Button onClick={onAddPerson} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>
    </header>
  );
}
