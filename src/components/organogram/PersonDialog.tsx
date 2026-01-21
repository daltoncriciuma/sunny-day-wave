import { useState, useEffect, useRef } from 'react';
import { Person, SECTORS, Sector } from '@/types/organogram';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { SECTOR_COLORS } from '@/types/organogram';

interface PersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person | null;
  onSave: (data: Omit<Person, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdate: (id: string, data: Partial<Person>) => void;
  onDelete: (id: string) => void;
}

export function PersonDialog({
  open,
  onOpenChange,
  person,
  onSave,
  onUpdate,
  onDelete,
}: PersonDialogProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [sector, setSector] = useState<Sector>('Comercial');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (person) {
      setName(person.name);
      setRole(person.role);
      setSector(person.sector as Sector);
      setAvatarUrl(person.avatar_url);
    } else {
      setName('');
      setRole('');
      setSector('Comercial');
      setAvatarUrl(null);
    }
  }, [person, open]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    if (person) {
      onUpdate(person.id, { name, role, sector, avatar_url: avatarUrl });
    } else {
      onSave({
        name,
        role,
        sector,
        avatar_url: avatarUrl,
        position_x: 200 + Math.random() * 300,
        position_y: 200 + Math.random() * 200,
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sectorClass = SECTOR_COLORS[sector] || 'sector-comercial';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {person ? 'Editar Pessoa' : 'Adicionar Pessoa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar upload */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-border">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className={cn(sectorClass, 'text-white text-xl font-semibold')}>
                  {name ? getInitials(name) : '?'}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                disabled={uploading}
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <Input
                id="role"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="Ex: Gerente Comercial"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Setor</Label>
              <Select value={sector} onValueChange={(v) => setSector(v as Sector)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map(s => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
