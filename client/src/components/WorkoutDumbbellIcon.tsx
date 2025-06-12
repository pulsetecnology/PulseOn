
interface WorkoutDumbbellIconProps {
  variant: 'success' | 'error' | 'warning';
  className?: string;
}

export default function WorkoutDumbbellIcon({ variant, className = "w-4 h-4" }: WorkoutDumbbellIconProps) {
  const colorMap = {
    success: "text-green-500",
    error: "text-red-500", 
    warning: "text-yellow-500"
  };

  return (
    <svg
      className={`${className} ${colorMap[variant]}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14 4.14 5.57 2 7.71 3.43 9.14 2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22 14.86 20.57 16.29 22 21.86 19.86 22 18.43 20.57 17 19.14 18.43 20.57 19.86 18.43 21.29 16.29 19.86 17.71 18.43 16.29 17 20.57 14.86z"/>
    </svg>
  );
}
