import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Person, Connection } from '@/types/organogram';
import { useToast } from '@/hooks/use-toast';

export function useOrganogram() {
  const [people, setPeople] = useState<Person[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Debounce refs for position updates
  const pendingUpdates = useRef<Map<string, { x: number; y: number }>>(new Map());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [peopleRes, connectionsRes] = await Promise.all([
        supabase.from('org_people').select('*').order('created_at'),
        supabase.from('org_connections').select('*'),
      ]);

      if (peopleRes.error) throw peopleRes.error;
      if (connectionsRes.error) throw connectionsRes.error;

      setPeople(peopleRes.data || []);
      setConnections(connectionsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Flush pending position updates to database
  const flushPositionUpdates = useCallback(async () => {
    if (pendingUpdates.current.size === 0) return;
    
    const updates = Array.from(pendingUpdates.current.entries());
    pendingUpdates.current.clear();
    
    // Batch update all positions
    await Promise.all(
      updates.map(([id, pos]) =>
        supabase
          .from('org_people')
          .update({ position_x: pos.x, position_y: pos.y })
          .eq('id', id)
      )
    );
  }, []);

  const addPerson = async (person: Omit<Person, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('org_people')
        .insert(person)
        .select()
        .single();

      if (error) throw error;
      
      setPeople(prev => [...prev, data]);
      toast({
        title: 'Processo adicionado',
        description: `${person.name} foi adicionado ao organograma.`,
      });
      
      return data;
    } catch (error) {
      console.error('Error adding process:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o processo.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updatePerson = async (id: string, updates: Partial<Person>) => {
    try {
      const { data, error } = await supabase
        .from('org_people')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setPeople(prev => prev.map(p => p.id === id ? data : p));
      return data;
    } catch (error) {
      console.error('Error updating process:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o processo.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updatePosition = useCallback((id: string, position_x: number, position_y: number) => {
    // Update local state immediately for smooth dragging
    setPeople(prev => prev.map(p => 
      p.id === id ? { ...p, position_x, position_y } : p
    ));

    // Queue the update
    pendingUpdates.current.set(id, { x: position_x, y: position_y });
    
    // Debounce database updates (save after 300ms of no changes)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      flushPositionUpdates();
    }, 300);
  }, [flushPositionUpdates]);

  const deletePerson = async (id: string) => {
    try {
      const { error } = await supabase
        .from('org_people')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPeople(prev => prev.filter(p => p.id !== id));
      setConnections(prev => prev.filter(c => 
        c.from_person_id !== id && c.to_person_id !== id
      ));
      
      toast({
        title: 'Processo removido',
        description: 'O processo foi removido do organograma.',
      });
    } catch (error) {
      console.error('Error deleting process:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o processo.',
        variant: 'destructive',
      });
    }
  };

  const addConnection = async (from_person_id: string, to_person_id: string) => {
    // Check if connection already exists
    const exists = connections.some(
      c => (c.from_person_id === from_person_id && c.to_person_id === to_person_id) ||
           (c.from_person_id === to_person_id && c.to_person_id === from_person_id)
    );

    if (exists || from_person_id === to_person_id) return null;

    try {
      const { data, error } = await supabase
        .from('org_connections')
        .insert({ from_person_id, to_person_id })
        .select()
        .single();

      if (error) throw error;
      
      setConnections(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding connection:', error);
      return null;
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('org_connections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setConnections(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  };

  const invertConnection = async (id: string) => {
    const connection = connections.find(c => c.id === id);
    if (!connection) return;

    try {
      const { data, error } = await supabase
        .from('org_connections')
        .update({
          from_person_id: connection.to_person_id,
          to_person_id: connection.from_person_id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setConnections(prev => prev.map(c => c.id === id ? data : c));
    } catch (error) {
      console.error('Error inverting connection:', error);
    }
  };

  return {
    people,
    connections,
    loading,
    addPerson,
    updatePerson,
    updatePosition,
    deletePerson,
    addConnection,
    deleteConnection,
    invertConnection,
    refetch: fetchData,
  };
}
