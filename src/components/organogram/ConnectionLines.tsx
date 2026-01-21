import { Person, Connection } from '@/types/organogram';

interface ConnectionLinesProps {
  connections: Connection[];
  people: Person[];
  tempConnection: { from: string; toX: number; toY: number } | null;
}

// Card dimensions
const CARD_WIDTH = 224; // w-56 = 14rem = 224px
const CARD_HEIGHT = 96; // h-24 = 6rem = 96px

export function ConnectionLines({ connections, people, tempConnection }: ConnectionLinesProps) {
  const getPersonById = (personId: string) => {
    return people.find(p => p.id === personId);
  };

  // Get connection point on the right side of the card (for "from")
  const getRightConnectionPoint = (person: Person) => ({
    // NOTE: person.position_x / position_y represent the CARD CENTER
    // because the card is rendered with translate(-50%, -50%).
    x: person.position_x + CARD_WIDTH / 2,
    y: person.position_y,
  });

  // Get connection point on the left side of the card (for "to")
  const getLeftConnectionPoint = (person: Person) => ({
    x: person.position_x - CARD_WIDTH / 2,
    y: person.position_y,
  });

  // Get best connection points based on relative positions
  const getConnectionPoints = (fromPerson: Person, toPerson: Person) => {
    const fromCenterX = fromPerson.position_x;
    const toCenterX = toPerson.position_x;

    // If target is to the right, connect from right to left
    if (toCenterX > fromCenterX) {
      return {
        from: getRightConnectionPoint(fromPerson),
        to: getLeftConnectionPoint(toPerson),
      };
    } else {
      // If target is to the left, connect from left to right
      return {
        from: getLeftConnectionPoint(fromPerson),
        to: getRightConnectionPoint(toPerson),
      };
    }
  };

  const createPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const midX = (from.x + to.x) / 2;
    
    // Bezier curve for smooth horizontal connection
    return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
  };

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 5 }}>
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

        return (
          <path
            key={conn.id}
            d={createPath(from, to)}
            stroke="hsl(var(--connection-line))"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
            className="transition-all duration-200"
          />
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
            className="animate-pulse"
          />
        );
      })()}
    </svg>
  );
}
