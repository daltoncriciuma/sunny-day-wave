import { Person, Connection, CARD_SIZES } from '@/types/organogram';

interface ConnectionLinesProps {
  connections: Connection[];
  people: Person[];
  tempConnection: { from: string; toX: number; toY: number } | null;
  isCollapsed: boolean;
  selectedConnectionId: string | null;
  onConnectionClick: (id: string) => void;
  onConnectionContextMenu: (e: React.MouseEvent, id: string) => void;
}

export function ConnectionLines({
  connections,
  people,
  tempConnection,
  isCollapsed,
  selectedConnectionId,
  onConnectionClick,
  onConnectionContextMenu,
}: ConnectionLinesProps) {
  const getPersonById = (personId: string) => {
    return people.find(p => p.id === personId);
  };

  // Get card width based on person's individual card_size
  const getCardWidth = (person: Person) => {
    const size = person.card_size || 'medium';
    return CARD_SIZES[size].width;
  };

  // Get connection point on the right side of the card (for "from")
  const getRightConnectionPoint = (person: Person) => ({
    x: person.position_x + getCardWidth(person) / 2,
    y: person.position_y,
  });

  // Get connection point on the left side of the card (for "to")
  const getLeftConnectionPoint = (person: Person) => ({
    x: person.position_x - getCardWidth(person) / 2,
    y: person.position_y,
  });

  // Get best connection points based on relative positions
  const getConnectionPoints = (fromPerson: Person, toPerson: Person) => {
    const fromCenterX = fromPerson.position_x;
    const toCenterX = toPerson.position_x;

    if (toCenterX > fromCenterX) {
      return {
        from: getRightConnectionPoint(fromPerson),
        to: getLeftConnectionPoint(toPerson),
      };
    } else {
      return {
        from: getLeftConnectionPoint(fromPerson),
        to: getRightConnectionPoint(toPerson),
      };
    }
  };

  const createPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const midX = (from.x + to.x) / 2;
    return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
  };

  return (
    <svg className="absolute inset-0 overflow-visible pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="hsl(var(--connection-line))"
          />
        </marker>
        <marker
          id="arrowhead-selected"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="hsl(var(--primary))"
          />
        </marker>
        <marker
          id="arrowhead-temp"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="hsl(var(--primary))"
          />
        </marker>
      </defs>

      {/* Existing connections */}
      {connections.map(conn => {
        const fromPerson = getPersonById(conn.from_person_id);
        const toPerson = getPersonById(conn.to_person_id);
        if (!fromPerson || !toPerson) return null;

        const { from, to } = getConnectionPoints(fromPerson, toPerson);
        const isSelected = selectedConnectionId === conn.id;
        const pathD = createPath(from, to);

        return (
          <g key={conn.id}>
            {/* Invisible hit area for clicking */}
            <path
              d={pathD}
              stroke="transparent"
              strokeWidth="16"
              fill="none"
              className="cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                onConnectionClick(conn.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onConnectionContextMenu(e, conn.id);
              }}
            />
            {/* Visible connection line */}
            <path
              d={pathD}
              stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--connection-line))'}
              strokeWidth={isSelected ? 3 : 2}
              fill="none"
              markerEnd={isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)'}
              className="pointer-events-none transition-all duration-200"
            />
          </g>
        );
      })}

      {/* Temporary connection while dragging */}
      {tempConnection && (() => {
        const fromPerson = getPersonById(tempConnection.from);
        if (!fromPerson) return null;
        
        const fromPoint = getRightConnectionPoint(fromPerson);
        
        return (
          <path
            d={createPath(fromPoint, { x: tempConnection.toX, y: tempConnection.toY })}
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeDasharray="5,5"
            fill="none"
            markerEnd="url(#arrowhead-temp)"
            className="animate-pulse pointer-events-none"
          />
        );
      })()}
    </svg>
  );
}