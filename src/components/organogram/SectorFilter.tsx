import { useState } from 'react';
import { Sector, CARD_COLORS } from '@/types/organogram';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, Plus, Pencil, Trash2, Check, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectorFilterProps {
  sectors: Sector[];
  selectedSectorId: string | null;
  onSelectSector: (sectorId: string | null) => void;
  onAddSector: (name: string, color: string) => Promise<Sector | null>;
  onUpdateSector: (id: string, updates: { name?: string; color?: string }) => Promise<Sector | null>;
  onDeleteSector: (id: string) => Promise<void>;
}

export function SectorFilter({
  sectors,
  selectedSectorId,
  onSelectSector,
  onAddSector,
  onUpdateSector,
  onDeleteSector,
}: SectorFilterProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].value);

  const selectedSector = sectors.find(s => s.id === selectedSectorId);

  const handleOpenAdd = () => {
    setEditingSector(null);
    setName('');
    setSelectedColor(CARD_COLORS[0].value);
    setDialogOpen(true);
  };

  const handleOpenEdit = (sector: Sector, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSector(sector);
    setName(sector.name);
    setSelectedColor(sector.color);
    setDialogOpen(true);
  };

  const handleDelete = async (sector: Sector, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Deseja remover o setor "${sector.name}"?`)) {
      await onDeleteSector(sector.id);
      if (selectedSectorId === sector.id) {
        onSelectSector(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSector) {
      await onUpdateSector(editingSector.id, { name, color: selectedColor });
    } else {
      await onAddSector(name, selectedColor);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 min-w-[140px]">
            {selectedSector ? (
              <>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedSector.color }}
                />
                <span className="truncate max-w-[100px]">{selectedSector.name}</span>
              </>
            ) : (
              <>
                <Layers className="h-4 w-4" />
                <span>Todos os setores</span>
              </>
            )}
            <ChevronDown className="h-4 w-4 ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 z-[9999] bg-popover">
          <DropdownMenuItem onClick={() => onSelectSector(null)}>
            <Layers className="h-4 w-4 mr-2" />
            Todos os setores
            {!selectedSectorId && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
          
          {sectors.length > 0 && <DropdownMenuSeparator />}
          
          {sectors.map(sector => (
            <DropdownMenuItem
              key={sector.id}
              className="flex items-center justify-between group"
              onClick={() => onSelectSector(sector.id)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: sector.color }}
                />
                <span>{sector.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {selectedSectorId === sector.id && <Check className="h-4 w-4" />}
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded"
                  onClick={(e) => handleOpenEdit(sector, e)}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive hover:text-destructive-foreground rounded"
                  onClick={(e) => handleDelete(sector, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar setor
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSector ? 'Editar setor' : 'Novo setor'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sector-name">Nome do setor</Label>
              <Input
                id="sector-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Comercial"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {CARD_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      'w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center',
                      'hover:scale-110',
                      selectedColor === color.value && 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.name}
                  >
                    {selectedColor === color.value && (
                      <Check className="h-4 w-4 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">
                {editingSector ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
