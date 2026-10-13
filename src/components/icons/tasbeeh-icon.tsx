import type { IconProps } from './interface-icons';

export function TasbeehIcon({ weight = 'regular', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="9" r="6" strokeOpacity=".35" />
      <g fill={weight === 'duotone' ? 'currentColor' : 'none'}>
        <circle cx="12" cy="3" r="1.8" />
        <circle cx="17.2" cy="6" r="1.8" />
        <circle cx="17.2" cy="12" r="1.8" />
        <circle cx="12" cy="15" r="1.8" />
        <circle cx="6.8" cy="12" r="1.8" />
        <circle cx="6.8" cy="6" r="1.8" />
      </g>
      <path d="M12 16.8v2M10.6 22l1.4-3.2 1.4 3.2" />
    </svg>
  );
}
