interface SelectionBoxProps {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export function SelectionBox({ start, end }: SelectionBoxProps) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <div
      className="absolute border-2 border-primary/60 bg-primary/10 pointer-events-none rounded-sm"
      style={{
        left,
        top,
        width,
        height,
      }}
    />
  );
}
