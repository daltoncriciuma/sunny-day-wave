import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Person, Connection } from '@/types/organogram';
import { useToast } from '@/hooks/use-toast';

export function useOrganogram() {
  const [people, setPeople] = useState<Person[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
        title: 'Pessoa adicionada',
        description: `${person.name} foi adicionado(a) ao organograma.`,
      });
      
      return data;
    } catch (error) {
      console.error('Error adding person:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a pessoa.',
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
      console.error('Error updating person:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a pessoa.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updatePosition = async (id: string, position_x: number, position_y: number) => {
    // Update local state immediately for smooth dragging
    setPeople(prev => prev.map(p => 
      p.id === id ? { ...p, position_x, position_y } : p
    ));

    // Then persist to database
    try {
      await supabase
        .from('org_people')
        .update({ position_x, position_y })
        .eq('id', id);
    } catch (error) {
      console.error('Error updating position:', error);
    }
  };

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
        title: 'Pessoa removida',
        description: 'A pessoa foi removida do organograma.',
      });
    } catch (error) {
      console.error('Error deleting person:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a pessoa.',
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
    refetch: fetchData,
  };
}
