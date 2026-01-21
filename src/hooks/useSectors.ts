import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sector } from '@/types/organogram';
import { useToast } from '@/hooks/use-toast';

export function useSectors() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSectors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('org_sectors')
        .select('*')
        .order('name');

      if (error) throw error;
      setSectors((data as Sector[]) || []);
    } catch (error) {
      console.error('Error fetching sectors:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os setores.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSectors();
  }, [fetchSectors]);

  const addSector = async (name: string, color: string = '#3B82F6') => {
    try {
      const { data, error } = await supabase
        .from('org_sectors')
        .insert({ name, color })
        .select()
        .single();

      if (error) throw error;
      
      const newSector = data as Sector;
      setSectors(prev => [...prev, newSector].sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: 'Setor criado',
        description: `O setor "${name}" foi criado com sucesso.`,
      });
      
      return newSector;
    } catch (error) {
      console.error('Error adding sector:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o setor.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateSector = async (id: string, updates: Partial<Pick<Sector, 'name' | 'color'>>) => {
    try {
      const { data, error } = await supabase
        .from('org_sectors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedSector = data as Sector;
      setSectors(prev => 
        prev.map(s => s.id === id ? updatedSector : s).sort((a, b) => a.name.localeCompare(b.name))
      );
      return updatedSector;
    } catch (error) {
      console.error('Error updating sector:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o setor.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteSector = async (id: string) => {
    try {
      const { error } = await supabase
        .from('org_sectors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSectors(prev => prev.filter(s => s.id !== id));
      toast({
        title: 'Setor removido',
        description: 'O setor foi removido com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting sector:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o setor.',
        variant: 'destructive',
      });
    }
  };

  return {
    sectors,
    loading,
    addSector,
    updateSector,
    deleteSector,
    refetch: fetchSectors,
  };
}
