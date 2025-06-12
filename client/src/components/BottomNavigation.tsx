import { Home, Dumbbell, BarChart3, User } from "lucide-react";
import { useLocation } from "wouter";
import { Link } from "wouter";

const navItems = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/workout", icon: Dumbbell, label: "Treino" },
  { path: "/history", icon: BarChart3, label: "Histórico" },
  { path: "/profile", icon: User, label: "Perfil" },
];

export default function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Início", exact: true },
    { href: "/workout", icon: Dumbbell, label: "Treino" },
    { href: "/history", icon: BarChart3, label: "Histórico" },
    { href: "/profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border px-4 py-2 bottom-nav-shadow"
    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;

          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`flex flex-col items-center py-2 px-4 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}