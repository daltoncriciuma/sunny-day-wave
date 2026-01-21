import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DecorativeLine } from '@/types/organogram';
import { useToast } from '@/hooks/use-toast';

export function useLines() {
  const [lines, setLines] = useState<DecorativeLine[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Debounce refs for position updates
  const pendingUpdates = useRef<Map<string, Partial<DecorativeLine>>>(new Map());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchLines = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('org_lines')
        .select('*')
        .order('created_at');

      if (error) throw error;
      setLines(data || []);
    } catch (error) {
      console.error('Error fetching lines:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLines();
  }, [fetchLines]);

  // Flush pending updates to database
  const flushUpdates = useCallback(async () => {
    if (pendingUpdates.current.size === 0) return;

    const updates = Array.from(pendingUpdates.current.entries());
    pendingUpdates.current.clear();

    await Promise.all(
      updates.map(([id, updates]) =>
        supabase
          .from('org_lines')
          .update(updates)
          .eq('id', id)
      )
    );
  }, []);

  const addLine = async (line: Omit<DecorativeLine, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('org_lines')
        .insert(line)
        .select()
        .single();

      if (error) throw error;
      setLines(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding line:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a linha.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateLine = async (id: string, updates: Partial<DecorativeLine>) => {
    try {
      const { data, error } = await supabase
        .from('org_lines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setLines(prev => prev.map(l => l.id === id ? data : l));
      return data;
    } catch (error) {
      console.error('Error updating line:', error);
      return null;
    }
  };

  const updateLinePosition = useCallback((id: string, updates: Partial<DecorativeLine>) => {
    // Update local state immediately
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));

    // Queue the update
    const existing = pendingUpdates.current.get(id) || {};
    pendingUpdates.current.set(id, { ...existing, ...updates });

    // Debounce database updates
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      flushUpdates();
    }, 300);
  }, [flushUpdates]);

  const deleteLine = async (id: string) => {
    try {
      const { error } = await supabase
        .from('org_lines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLines(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting line:', error);
    }
  };

  return {
    lines,
    loading,
    addLine,
    updateLine,
    updateLinePosition,
    deleteLine,
    refetch: fetchLines,
  };
}
