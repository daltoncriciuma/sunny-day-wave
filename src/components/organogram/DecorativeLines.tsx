import { DecorativeLine } from '@/types/organogram';

interface DecorativeLinesProps {
  lines: DecorativeLine[];
  selectedLineId: string | null;
  onLineClick: (lineId: string) => void;
  onLineContextMenu: (e: React.MouseEvent, lineId: string) => void;
}

export function DecorativeLines({
  lines,
  selectedLineId,
  onLineClick,
  onLineContextMenu,
}: DecorativeLinesProps) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '6000px', height: '4000px' }}
    >
      {lines.map(line => {
        const isSelected = line.id === selectedLineId;

        return (
          <g key={line.id}>
            {/* Hit area for easier clicking */}
            <line
              x1={line.start_x}
              y1={line.start_y}
              x2={line.end_x}
              y2={line.end_y}
              stroke="transparent"
              strokeWidth={20}
              className="pointer-events-auto cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onLineClick(line.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLineContextMenu(e, line.id);
              }}
            />
            {/* Visible line */}
            <line
              x1={line.start_x}
              y1={line.start_y}
              x2={line.end_x}
              y2={line.end_y}
              stroke={isSelected ? '#3B82F6' : line.color}
              strokeWidth={isSelected ? line.stroke_width + 1 : line.stroke_width}
              strokeLinecap="round"
            />
            {/* Selection indicators */}
            {isSelected && (
              <>
                <circle
                  cx={line.start_x}
                  cy={line.start_y}
                  r={6}
                  fill="#3B82F6"
                  stroke="white"
                  strokeWidth={2}
                  className="pointer-events-auto cursor-move"
                />
                <circle
                  cx={line.end_x}
                  cy={line.end_y}
                  r={6}
                  fill="#3B82F6"
                  stroke="white"
                  strokeWidth={2}
                  className="pointer-events-auto cursor-move"
                />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
