import Header from "./Header";
import BottomNavigation from "./BottomNavigation";
import NotificationDisplay from "./NotificationDisplay";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 pb-20">
        {children}
      </main>
      <BottomNavigation />
      <NotificationDisplay />
    </div>
  );
}
