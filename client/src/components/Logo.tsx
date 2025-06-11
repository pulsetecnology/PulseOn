import { Heart } from "lucide-react";

export default function Logo({ className = "text-xl" }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="w-8 h-8 relative">
        <div className="w-8 h-8 bg-brand-cyan rounded-full flex items-center justify-center">
          <Heart className="h-4 w-4 text-slate-900 fill-current" />
        </div>
      </div>
      <div className="flex items-center">
        <span className="font-bold brand-cyan">Pulse</span>
        <span className="font-bold brand-blue">On</span>
      </div>
    </div>
  );
}
