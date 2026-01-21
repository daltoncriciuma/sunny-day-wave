import { useState, useEffect } from 'react';
import { Person, Sector, CARD_COLORS } from '@/types/organogram';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Check, Square, PaintBucket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface PersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
  initialPosition?: { x: number; y: number } | null;
  sectors: Sector[];
  defaultSectorId?: string | null;
  onSave: (data: Omit<Person, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdate: (id: string, data: Partial<Person>) => void;
  onDelete: (id: string) => void;
}

export function PersonDialog({
  open,
  onOpenChange,
  person,
  initialPosition,
  sectors,
  defaultSectorId,
  onSave,
  onUpdate,
  onDelete,
}: PersonDialogProps) {
  const [name, setName] = useState('');
  const [observations, setObservations] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].value);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [fillCard, setFillCard] = useState(false);

  useEffect(() => {
    if (person) {
      setName(person.name);
      setObservations(person.sector || '');
      setSelectedColor(person.avatar_url || CARD_COLORS[0].value);
      setSelectedSectorId(person.sector_id || null);
      setFillCard(person.fill_card || false);
    } else {
      setName('');
      setObservations('');
      // Auto-fill sector and color when filter is active
      const defaultSector = sectors.find(s => s.id === defaultSectorId);
      setSelectedSectorId(defaultSectorId || null);
      setSelectedColor(defaultSector?.color || CARD_COLORS[0].value);
      setFillCard(false);
    }
  }, [person, open, defaultSectorId, sectors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (person) {
      onUpdate(person.id, { 
        name, 
        sector: observations, 
        avatar_url: selectedColor,
        role: observations,
        sector_id: selectedSectorId,
        fill_card: fillCard,
      });
    } else {
      const pos = initialPosition || { 
        x: 200 + Math.random() * 300, 
        y: 200 + Math.random() * 200 
      };
      onSave({
        name,
        role: observations,
        sector: observations,
        avatar_url: selectedColor,
        position_x: pos.x,
        position_y: pos.y,
        sector_id: selectedSectorId,
        card_size: 'small',
        fill_card: fillCard,
      });
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (person) {
      onDelete(person.id);
      onOpenChange(false);
    }
  };

  const selectedSector = sectors.find(s => s.id === selectedSectorId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {person ? 'Editar Processo' : 'Adicionar Processo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Color preview */}
          <div className="flex justify-center">
            <div 
              className={cn(
                "w-48 h-20 rounded-xl shadow-lg flex items-center justify-center",
                !fillCard && "border-2 bg-card"
              )}
              style={{ 
                backgroundColor: fillCard ? selectedColor : undefined,
                borderColor: !fillCard ? selectedColor : undefined,
              }}
            >
              <span className={cn(
                "font-bold text-lg drop-shadow-sm",
                fillCard ? "text-white" : "text-foreground"
              )}>
                {name || 'Nome'}
              </span>
            </div>
          </div>

          {/* Color picker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Cor</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="fill-card" className="text-sm text-muted-foreground cursor-pointer">
                  Preencher card
                </Label>
                <Switch
                  id="fill-card"
                  checked={fillCard}
                  onCheckedChange={setFillCard}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {CARD_COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  className={cn(
                    'w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center',
                    'hover:scale-110 hover:ring-2 hover:ring-offset-2 hover:ring-offset-background',
                    selectedColor === color.value && 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                  )}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                >
                  {selectedColor === color.value && (
                    <Check className="h-5 w-5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nome"
                required
              />
            </div>

            {/* Sector dropdown */}
            <div className="space-y-2">
              <Label htmlFor="sector">Setor</Label>
              <Select
                value={selectedSectorId || 'none'}
                onValueChange={(value) => setSelectedSectorId(value === 'none' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um setor">
                    {selectedSector ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedSector.color }}
                        />
                        {selectedSector.name}
                      </div>
                    ) : (
                      'Sem setor'
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="none">Sem setor</SelectItem>
                  {sectors.map(sector => (
                    <SelectItem key={sector.id} value={sector.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: sector.color }}
                        />
                        {sector.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={observations}
                onChange={e => setObservations(e.target.value)}
                placeholder="Adicione observações..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {person && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </Button>
            )}
            <Button type="submit">
              {person ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
