import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useOrganogram } from '@/hooks/useOrganogram';
import { useSectors } from '@/hooks/useSectors';
import { Person, CardSize, CARD_SIZES } from '@/types/organogram';
import { TopBar } from './TopBar';
import { PersonCard } from './PersonCard';
import { ConnectionLines } from './ConnectionLines';
import { PersonDialog } from './PersonDialog';
import { ViewControls } from './ViewControls';
import { SelectionBox } from './SelectionBox';
import { Loader2, Plus, Trash2, ArrowLeftRight } from 'lucide-react';

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
    deleteConnection,
    invertConnection,
  } = useOrganogram();

  const {
    sectors,
    loading: sectorsLoading,
    addSector,
    updateSector,
    deleteSector,
  } = useSectors();

  // Sector filter state
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);

  // Filter people by selected sector
  const filteredPeople = useMemo(() => {
    if (!selectedSectorId) return people;
    return people.filter(p => p.sector_id === selectedSectorId);
  }, [people, selectedSectorId]);

  // Filter connections to only show those between visible people
  const filteredConnections = useMemo(() => {
    const visibleIds = new Set(filteredPeople.map(p => p.id));
    return connections.filter(
      c => visibleIds.has(c.from_person_id) && visibleIds.has(c.to_person_id)
    );
  }, [connections, filteredPeople]);

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

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [dragGroupStartPositions, setDragGroupStartPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Connection selection state
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectionContextMenu, setConnectionContextMenu] = useState<{ x: number; y: number; connectionId: string } | null>(null);

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
  const handleDragStart = useCallback((e: React.MouseEvent, person: Person) => {
    const pos = getCanvasPosition(e.clientX, e.clientY);
    setDragOffset({
      x: pos.x - person.position_x,
      y: pos.y - person.position_y,
    });
    setDraggingPerson(person);

    // If the card is selected, prepare group drag
    if (selectedIds.has(person.id)) {
      const positions = new Map<string, { x: number; y: number }>();
      people.forEach(p => {
        if (selectedIds.has(p.id)) {
          positions.set(p.id, { x: p.position_x, y: p.position_y });
        }
      });
      setDragGroupStartPositions(positions);
    } else {
      // Clear selection if dragging unselected card
      setSelectedIds(new Set());
      setDragGroupStartPositions(new Map());
    }
  }, [getCanvasPosition, selectedIds, people]);

  const handleDragEnd = useCallback(() => {
    setDraggingPerson(null);
    setDragGroupStartPositions(new Map());
  }, []);

  // Handle panning (middle click or space + drag) and selection
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Close context menus on any click
    setContextMenu(null);
    setConnectionContextMenu(null);
    
    if (e.target === canvasRef.current && e.button === 0) {
      // Left click on empty canvas = start box selection
      const pos = getCanvasPosition(e.clientX, e.clientY);
      setIsSelecting(true);
      setSelectionStart(pos);
      setSelectionEnd(pos);
      setSelectedIds(new Set());
      setSelectedConnectionId(null);
    }
  }, [getCanvasPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingPerson) {
      const pos = getCanvasPosition(e.clientX, e.clientY);
      const newX = pos.x - dragOffset.x;
      const newY = pos.y - dragOffset.y;

      if (selectedIds.has(draggingPerson.id) && dragGroupStartPositions.size > 0) {
        // Group drag: calculate delta and apply to all selected
        const startPos = dragGroupStartPositions.get(draggingPerson.id);
        if (startPos) {
          const deltaX = newX - startPos.x;
          const deltaY = newY - startPos.y;
          
          dragGroupStartPositions.forEach((originalPos, id) => {
            updatePosition(id, originalPos.x + deltaX, originalPos.y + deltaY);
          });
        }
      } else {
        updatePosition(draggingPerson.id, newX, newY);
      }
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
    } else if (isSelecting && selectionStart) {
      const pos = getCanvasPosition(e.clientX, e.clientY);
      setSelectionEnd(pos);
    }
  }, [draggingPerson, isPanning, connectingFrom, isSelecting, selectionStart, getCanvasPosition, dragOffset, panStart, updatePosition, selectedIds, dragGroupStartPositions]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionStart && selectionEnd) {
      // Calculate bounding box
      const left = Math.min(selectionStart.x, selectionEnd.x);
      const right = Math.max(selectionStart.x, selectionEnd.x);
      const top = Math.min(selectionStart.y, selectionEnd.y);
      const bottom = Math.max(selectionStart.y, selectionEnd.y);
      
      // Find cards inside selection box
      const selected = new Set<string>();
      const cardWidth = CARD_SIZES[cardSize].width;
      const cardHeight = isCollapsed ? 40 : CARD_SIZES[cardSize].height;
      
      people.forEach(person => {
        // Card center is at position_x, position_y; card spans from center - half to center + half
        const cardLeft = person.position_x - cardWidth / 2;
        const cardRight = person.position_x + cardWidth / 2;
        const cardTop = person.position_y - cardHeight / 2;
        const cardBottom = person.position_y + cardHeight / 2;
        
        // Check intersection
        if (cardRight > left && cardLeft < right && cardBottom > top && cardTop < bottom) {
          selected.add(person.id);
        }
      });
      
      setSelectedIds(selected);
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }

    setDraggingPerson(null);
    setDragGroupStartPositions(new Map());
    setIsPanning(false);
    if (connectingFrom) {
      setConnectingFrom(null);
      setTempConnection(null);
    }
  }, [isSelecting, selectionStart, selectionEnd, cardSize, isCollapsed, people, connectingFrom]);

  // Handle connection
  const handleConnectionStart = useCallback((personId: string) => {
    setConnectingFrom(personId);
  }, []);

  const handleConnectionEnd = useCallback((personId: string) => {
    if (connectingFrom && connectingFrom !== personId) {
      addConnection(connectingFrom, personId);
    }
    setConnectingFrom(null);
    setTempConnection(null);
  }, [connectingFrom, addConnection]);

  // Handle card double click
  const handleCardClick = useCallback((person: Person) => {
    if (!draggingPerson) {
      setSelectedPerson(person);
      setDialogOpen(true);
    }
  }, [draggingPerson]);

  // Single click selects card (so Delete/backspace and mobile trash work)
  const handleSelectCard = useCallback((personId: string) => {
    setSelectedIds(new Set([personId]));
    setSelectedConnectionId(null);
  }, []);

  // Handle add person
  const handleAddPerson = useCallback((position?: { x: number; y: number }) => {
    setSelectedPerson(null);
    setNewCardPosition(position || null);
    setDialogOpen(true);
  }, []);

  // Double click to add
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      const pos = getCanvasPosition(e.clientX, e.clientY);
      handleAddPerson(pos);
    }
  }, [getCanvasPosition, handleAddPerson]);

  // Right click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const canvasPos = getCanvasPosition(e.clientX, e.clientY);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      canvasPos,
    });
  }, [getCanvasPosition]);

  // Add card from context menu
  const handleContextMenuAdd = useCallback(() => {
    if (contextMenu) {
      handleAddPerson(contextMenu.canvasPos);
      setContextMenu(null);
    }
  }, [contextMenu, handleAddPerson]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setConnectionContextMenu(null);
    };
    if (contextMenu || connectionContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu, connectionContextMenu]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConnectingFrom(null);
        setTempConnection(null);
        setContextMenu(null);
        setConnectionContextMenu(null);
        setSelectedIds(new Set());
        setSelectedConnectionId(null);
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete selected connection
        if (selectedConnectionId) {
          deleteConnection(selectedConnectionId);
          setSelectedConnectionId(null);
        }
        // Delete selected cards
        if (selectedIds.size > 0) {
          selectedIds.forEach(id => deletePerson(id));
          setSelectedIds(new Set());
        }
      }
      
      // Select all with Ctrl+A
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedIds(new Set(people.map(p => p.id)));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedConnectionId, selectedIds, deleteConnection, deletePerson, people]);

  // Connection click handlers
  const handleConnectionClick = useCallback((connectionId: string) => {
    setSelectedConnectionId(connectionId);
    setSelectedIds(new Set()); // Clear card selection when selecting connection
  }, []);

  const handleConnectionContextMenu = useCallback((e: React.MouseEvent, connectionId: string) => {
    setConnectionContextMenu({
      x: e.clientX,
      y: e.clientY,
      connectionId,
    });
    setSelectedConnectionId(connectionId);
  }, []);

  const handleDeleteConnection = useCallback(() => {
    if (connectionContextMenu) {
      deleteConnection(connectionContextMenu.connectionId);
      setConnectionContextMenu(null);
      setSelectedConnectionId(null);
    }
  }, [connectionContextMenu, deleteConnection]);

  const handleInvertConnection = useCallback(() => {
    if (connectionContextMenu) {
      invertConnection(connectionContextMenu.connectionId);
      setConnectionContextMenu(null);
    }
  }, [connectionContextMenu, invertConnection]);

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
        sectors={sectors}
        selectedSectorId={selectedSectorId}
        onSelectSector={setSelectedSectorId}
        onAddSector={addSector}
        onUpdateSector={updateSector}
        onDeleteSector={deleteSector}
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
            connections={filteredConnections}
            people={filteredPeople}
            tempConnection={tempConnection}
            cardSize={cardSize}
            isCollapsed={isCollapsed}
            selectedConnectionId={selectedConnectionId}
            onConnectionClick={handleConnectionClick}
            onConnectionContextMenu={handleConnectionContextMenu}
          />

          {/* Selection box */}
          {isSelecting && selectionStart && selectionEnd && (
            <SelectionBox start={selectionStart} end={selectionEnd} />
          )}

          {filteredPeople.map(person => (
            <PersonCard
              key={person.id}
              person={person}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onConnectionStart={handleConnectionStart}
              onConnectionEnd={handleConnectionEnd}
              onDoubleClick={handleCardClick}
              onSelect={handleSelectCard}
              onDelete={deletePerson}
              isConnecting={!!connectingFrom}
              connectingFrom={connectingFrom}
              isDragging={draggingPerson?.id === person.id}
              isSelected={selectedIds.has(person.id)}
              cardSize={cardSize}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      </div>

      {/* Card context menu */}
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

      {/* Connection context menu */}
      {connectionContextMenu && (
        <div
          className="fixed bg-popover border border-border rounded-md shadow-lg py-1 z-[9999]"
          style={{
            left: connectionContextMenu.x,
            top: connectionContextMenu.y,
          }}
        >
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
            onClick={handleInvertConnection}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Inverter direção
          </button>
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-destructive hover:text-destructive-foreground text-left"
            onClick={handleDeleteConnection}
          >
            <Trash2 className="h-4 w-4" />
            Remover conexão
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
        sectors={sectors}
        defaultSectorId={selectedSectorId}
        onSave={addPerson}
        onUpdate={updatePerson}
        onDelete={deletePerson}
      />

      {/* Help text */}
      {people.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none pt-14">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">Clique direito ou dê duplo clique na tela</p>
            <p className="text-sm mt-1">para criar seu primeiro processo</p>
          </div>
        </div>
      )}
    </div>
  );
}
