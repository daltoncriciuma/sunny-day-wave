import { Person, Connection } from '@/types/organogram';

interface ConnectionLinesProps {
  connections: Connection[];
  people: Person[];
  tempConnection: { from: string; toX: number; toY: number } | null;
}

export function ConnectionLines({ connections, people, tempConnection }: ConnectionLinesProps) {
  const getPersonCenter = (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (!person) return null;
    return { x: person.position_x, y: person.position_y };
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
        const from = getPersonCenter(conn.from_person_id);
        const to = getPersonCenter(conn.to_person_id);
        if (!from || !to) return null;

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
      {tempConnection && (
        <path
          d={createPath(
            getPersonCenter(tempConnection.from) || { x: 0, y: 0 },
            { x: tempConnection.toX, y: tempConnection.toY }
          )}
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeDasharray="5,5"
          fill="none"
          markerEnd="url(#arrowhead-temp)"
          className="animate-pulse"
        />
      )}
    </svg>
  );
}
