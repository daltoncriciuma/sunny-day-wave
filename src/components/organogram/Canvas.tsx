import { useState, useRef, useCallback, useEffect } from 'react';
import { useOrganogram } from '@/hooks/useOrganogram';
import { Person, CardSize, CARD_SIZES } from '@/types/organogram';
import { TopBar } from './TopBar';
import { PersonCard } from './PersonCard';
import { ConnectionLines } from './ConnectionLines';
import { PersonDialog } from './PersonDialog';
import { ViewControls } from './ViewControls';
import { Loader2, Plus } from 'lucide-react';

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

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; canvasPos: { x: number; y: number } } | null>(null);

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

  // Handle card drag
  const handleDragStart = (e: React.MouseEvent, person: Person) => {
    const pos = getCanvasPosition(e.clientX, e.clientY);
    setDragOffset({
      x: pos.x - person.position_x,
      y: pos.y - person.position_y,
    });
    setDraggingPerson(person);
  };

  const handleDragEnd = () => {
    setDraggingPerson(null);
  };

  // Handle panning (left click on empty canvas)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Close context menu on any click
    setContextMenu(null);
    
    if (e.target === canvasRef.current && e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingPerson) {
      const pos = getCanvasPosition(e.clientX, e.clientY);
      updatePosition(
        draggingPerson.id,
        pos.x - dragOffset.x,
        pos.y - dragOffset.y
      );
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
  }, [draggingPerson, isPanning, connectingFrom, getCanvasPosition, dragOffset, panStart, updatePosition]);

  const handleMouseUp = () => {
    setDraggingPerson(null);
    setIsPanning(false);
    if (connectingFrom) {
      setConnectingFrom(null);
      setTempConnection(null);
    }
  };

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

  // Right click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const canvasPos = getCanvasPosition(e.clientX, e.clientY);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      canvasPos,
    });
  };

  // Add card from context menu
  const handleContextMenuAdd = () => {
    if (contextMenu) {
      handleAddPerson(contextMenu.canvasPos);
      setContextMenu(null);
    }
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Cancel connection on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectingFrom(null);
        setTempConnection(null);
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

      <div
        ref={canvasRef}
        className="absolute inset-0 pt-14 canvas-grid overflow-hidden"
        style={{
          cursor: isPanning ? 'grabbing' : draggingPerson ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
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
              isSelected={false}
              cardSize={cardSize}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </div>

      {/* Custom context menu */}
      {contextMenu && (
        <div
          className="fixed bg-popover border border-border rounded-md shadow-lg py-1 z-[9999]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
            onClick={handleContextMenuAdd}
          >
            <Plus className="h-4 w-4" />
            Adicionar caixa
          </button>
        </div>
      )}

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
