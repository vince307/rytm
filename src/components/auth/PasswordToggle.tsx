interface PasswordToggleProps {
  visible: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
}

export function PasswordToggle({ visible, onToggle, showLabel, hideLabel }: PasswordToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-muted hover:text-ink absolute top-1/2 right-3 -translate-y-1/2 text-xs font-bold"
      aria-pressed={visible}
    >
      {visible ? hideLabel : showLabel}
    </button>
  );
}
