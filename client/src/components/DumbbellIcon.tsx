

export default function DumbbellIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3 9h2v6H3V9zm4-3h2v12H7V6zm4-3h2v18h-2V3zm4 3h2v12h-2V6zm4 3h2v6h-2V9z"/>
      <circle cx="4" cy="12" r="1.5"/>
      <circle cx="20" cy="12" r="1.5"/>
    </svg>
  );
}

