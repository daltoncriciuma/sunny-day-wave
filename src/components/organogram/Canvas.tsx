import { useState, useRef, useCallback, useEffect } from 'react';
import { useOrganogram } from '@/hooks/useOrganogram';
import { Person, CardSize, CARD_SIZES } from '@/types/organogram';
import { TopBar } from './TopBar';
import { PersonCard } from './PersonCard';
import { ConnectionLines } from './ConnectionLines';
import { PersonDialog } from './PersonDialog';
import { SelectionBox } from './SelectionBox';
import { ViewControls } from './ViewControls';
import { Loader2, Plus } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

export function Canvas() {
  const {
    people,
    connections,
    loading,
    addPerson,
    updatePerson,
    updatePosition,
    deletePerson,
    addConnection,
  } = useOrganogram();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [draggingPerson, setDraggingPerson] = useState<Person | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [tempConnection, setTempConnection] = useState<{
    from: string;
    toX: number;
    toY: number;
  } | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [newCardPosition, setNewCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [dragStartPositions, setDragStartPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // View controls state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [cardSize, setCardSize] = useState<CardSize>('medium');

  // Handle zoom
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Handle wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(z => Math.min(Math.max(z + delta, 0.5), 2));
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Get canvas-relative position
  const getCanvasPosition = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // Check if a person is inside the selection box
  const isInsideSelection = useCallback((person: Person, start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dimensions = CARD_SIZES[cardSize];
    const cardWidth = dimensions.width;
    const cardHeight = isCollapsed ? 40 : dimensions.height;
    
    const selLeft = Math.min(start.x, end.x);
    const selRight = Math.max(start.x, end.x);
    const selTop = Math.min(start.y, end.y);
    const selBottom = Math.max(start.y, end.y);
    
    const cardLeft = person.position_x - cardWidth / 2;
    const cardRight = person.position_x + cardWidth / 2;
    const cardTop = person.position_y - cardHeight / 2;
    const cardBottom = person.position_y + cardHeight / 2;
    
    // Check if card overlaps with selection
    return !(cardRight < selLeft || cardLeft > selRight || cardBottom < selTop || cardTop > selBottom);
  }, [cardSize, isCollapsed]);

  // Handle card drag
  const handleDragStart = (e: React.MouseEvent, person: Person) => {
    const pos = getCanvasPosition(e.clientX, e.clientY);
    
    // If clicking on a selected card, drag all selected
    if (selectedIds.has(person.id) && selectedIds.size > 1) {
      setIsDraggingSelection(true);
      // Store initial positions of all selected cards
      const positions = new Map<string, { x: number; y: number }>();
      people.filter(p => selectedIds.has(p.id)).forEach(p => {
        positions.set(p.id, { x: p.position_x, y: p.position_y });
      });
      setDragStartPositions(positions);
      setDragOffset({
        x: pos.x - person.position_x,
        y: pos.y - person.position_y,
      });
      setDraggingPerson(person);
    } else {
      // Single card drag
      setSelectedIds(new Set([person.id]));
      setDragOffset({
        x: pos.x - person.position_x,
        y: pos.y - person.position_y,
      });
      setDraggingPerson(person);
    }
  };

  const handleDragEnd = () => {
    setDraggingPerson(null);
    setIsDraggingSelection(false);
    setDragStartPositions(new Map());
  };

  // Handle panning and selection box
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      if (e.button === 0) {
        // Left click - start selection box
        const pos = getCanvasPosition(e.clientX, e.clientY);
        setIsSelecting(true);
        setSelectionStart(pos);
        setSelectionEnd(pos);
        // Clear selection if not holding shift
        if (!e.shiftKey) {
          setSelectedIds(new Set());
        }
      } else if (e.button === 1) {
        // Middle click - pan
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingPerson) {
      const pos = getCanvasPosition(e.clientX, e.clientY);
      
      if (isDraggingSelection && dragStartPositions.size > 0) {
        // Move all selected cards
        const deltaX = pos.x - dragOffset.x - draggingPerson.position_x;
        const deltaY = pos.y - dragOffset.y - draggingPerson.position_y;
        
        people.filter(p => selectedIds.has(p.id)).forEach(p => {
          const startPos = dragStartPositions.get(p.id);
          if (startPos) {
            updatePosition(
              p.id,
              startPos.x + deltaX + (pos.x - dragOffset.x - (dragStartPositions.get(draggingPerson.id)?.x || 0)),
              startPos.y + deltaY + (pos.y - dragOffset.y - (dragStartPositions.get(draggingPerson.id)?.y || 0))
            );
          }
        });
      } else {
        // Single card drag
        updatePosition(
          draggingPerson.id,
          pos.x - dragOffset.x,
          pos.y - dragOffset.y
        );
      }
    } else if (isSelecting && selectionStart) {
      const pos = getCanvasPosition(e.clientX, e.clientY);
      setSelectionEnd(pos);
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (connectingFrom) {
      const pos = getCanvasPosition(e.clientX, e.clientY);
      setTempConnection({
        from: connectingFrom,
        toX: pos.x,
        toY: pos.y,
      });
    }
  }, [draggingPerson, isSelecting, isPanning, connectingFrom, getCanvasPosition, dragOffset, panStart, updatePosition, selectionStart, isDraggingSelection, dragStartPositions, people, selectedIds]);

  const handleMouseUp = useCallback(() => {
    // Finalize selection
    if (isSelecting && selectionStart && selectionEnd) {
      const newSelected = new Set(selectedIds);
      people.forEach(person => {
        if (isInsideSelection(person, selectionStart, selectionEnd)) {
          newSelected.add(person.id);
        }
      });
      setSelectedIds(newSelected);
    }
    
    setDraggingPerson(null);
    setIsPanning(false);
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsDraggingSelection(false);
    setDragStartPositions(new Map());
    
    if (connectingFrom) {
      setConnectingFrom(null);
      setTempConnection(null);
    }
  }, [isSelecting, selectionStart, selectionEnd, selectedIds, people, isInsideSelection, connectingFrom]);

  // Handle connection
  const handleConnectionStart = (personId: string) => {
    setConnectingFrom(personId);
  };

  const handleConnectionEnd = (personId: string) => {
    if (connectingFrom && connectingFrom !== personId) {
      addConnection(connectingFrom, personId);
    }
    setConnectingFrom(null);
    setTempConnection(null);
  };

  // Handle card double click
  const handleCardClick = (person: Person) => {
    if (!draggingPerson) {
      setSelectedPerson(person);
      setDialogOpen(true);
    }
  };

  // Handle add person
  const handleAddPerson = (position?: { x: number; y: number }) => {
    setSelectedPerson(null);
    setNewCardPosition(position || null);
    setDialogOpen(true);
  };

  // Double click to add
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const pos = getCanvasPosition(e.clientX, e.clientY);
      handleAddPerson(pos);
    }
  };

  // Capture position on right click (before context menu opens)
  const handleContextMenu = (e: React.MouseEvent) => {
    const pos = getCanvasPosition(e.clientX, e.clientY);
    setContextMenuPosition(pos);
  };

  // Add card at captured position
  const handleContextMenuAdd = () => {
    if (contextMenuPosition) {
      handleAddPerson(contextMenuPosition);
    }
  };

  // Cancel selection/connection on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectingFrom(null);
        setTempConnection(null);
        setSelectedIds(new Set());
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current && !isSelecting) {
      setSelectedIds(new Set());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <TopBar
        onAddPerson={() => handleAddPerson()}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
      />

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={canvasRef}
            className="absolute inset-0 pt-14 canvas-grid cursor-crosshair overflow-hidden"
            style={{
              cursor: isPanning ? 'grabbing' : draggingPerson ? 'grabbing' : isSelecting ? 'crosshair' : 'crosshair',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            onClick={handleCanvasClick}
          >
            <div
              className="relative w-full h-full"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            >
              <ConnectionLines
                connections={connections}
                people={people}
                tempConnection={tempConnection}
                cardSize={cardSize}
                isCollapsed={isCollapsed}
              />

              {people.map(person => (
                <PersonCard
                  key={person.id}
                  person={person}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onConnectionStart={handleConnectionStart}
                  onConnectionEnd={handleConnectionEnd}
                  onDoubleClick={handleCardClick}
                  isConnecting={!!connectingFrom}
                  connectingFrom={connectingFrom}
                  isDragging={draggingPerson?.id === person.id}
                  isSelected={selectedIds.has(person.id)}
                  cardSize={cardSize}
                  isCollapsed={isCollapsed}
                />
              ))}

              {/* Selection box */}
              {isSelecting && selectionStart && selectionEnd && (
                <SelectionBox start={selectionStart} end={selectionEnd} />
              )}
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleContextMenuAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar caixa
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ViewControls
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        cardSize={cardSize}
        onCardSizeChange={setCardSize}
      />

      <PersonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        person={selectedPerson}
        initialPosition={newCardPosition}
        onSave={addPerson}
        onUpdate={updatePerson}
        onDelete={deletePerson}
      />

      {/* Help text */}
      {people.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none pt-14">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">Clique direito ou dê duplo clique na tela</p>
            <p className="text-sm mt-1">para criar seu primeiro card</p>
          </div>
        </div>
      )}
    </div>
  );
}
