import { useState, useEffect } from 'react';
import { Person, CARD_COLORS } from '@/types/organogram';
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
import { Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
  initialPosition?: { x: number; y: number } | null;
  onSave: (data: Omit<Person, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdate: (id: string, data: Partial<Person>) => void;
  onDelete: (id: string) => void;
}

export function PersonDialog({
  open,
  onOpenChange,
  person,
  initialPosition,
  onSave,
  onUpdate,
  onDelete,
}: PersonDialogProps) {
  const [name, setName] = useState('');
  const [observations, setObservations] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].value);

  useEffect(() => {
    if (person) {
      setName(person.name);
      setObservations(person.sector || '');
      setSelectedColor(person.avatar_url || CARD_COLORS[0].value);
    } else {
      setName('');
      setObservations('');
      setSelectedColor(CARD_COLORS[0].value);
    }
  }, [person, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (person) {
      onUpdate(person.id, { 
        name, 
        sector: observations, 
        avatar_url: selectedColor,
        role: observations // Keep role synced for compatibility
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {person ? 'Editar' : 'Adicionar'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Color preview */}
          <div className="flex justify-center">
            <div 
              className="w-48 h-20 rounded-xl shadow-lg flex items-center justify-center"
              style={{ backgroundColor: selectedColor }}
            >
              <span className="text-white font-bold text-lg drop-shadow-sm">
                {name || 'Nome'}
              </span>
            </div>
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <Label>Cor</Label>
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
