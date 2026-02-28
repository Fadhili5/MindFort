interface ProgressProps {
  value: number;
}

export function Progress({ value }: ProgressProps) {
  const percentage = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full bg-accent transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
