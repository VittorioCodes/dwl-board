import { useEffect, useState } from "react";
import { Canvas } from "./components/Canvas";
import { Toolbar } from "./components/Toolbar";
import { Sidebar } from "./components/Sidebar";
import { ThemeSelector } from "./components/ThemeSelector";
import { THEMES } from "./lib/themes";
import { useStore } from "./lib/store";
import { cn } from "./lib/utils";

export default function App() {
  const initData = useStore(state => state.initData);
  const isDarkMode = useStore(state => state.isDarkMode);
  const themeId = useStore(state => state.theme);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initData().then(() => setIsReady(true));
  }, [initData]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll('.luxurious-glow');
      cards.forEach(card => {
        const rect = (card as HTMLElement).getBoundingClientRect();
        const scaleX = rect.width / (card as HTMLElement).offsetWidth || 1;
        const scaleY = rect.height / (card as HTMLElement).offsetHeight || 1;
        const x = (e.clientX - rect.left) / scaleX;
        const y = (e.clientY - rect.top) / scaleY;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f9fa] text-slate-500 font-sans font-medium">
        Loading workspace...
      </div>
    );
  }

  const currentTheme = THEMES[themeId] || THEMES.default;
  const isActualDark = currentTheme.forceDark || (!currentTheme.forceLight && isDarkMode);

  return (
    <div className={cn(
      "relative w-full h-screen overflow-hidden font-sans text-slate-800 dark:text-slate-200 transition-colors duration-500",
      isActualDark ? "dark" : "",
      isActualDark ? currentTheme.darkClass : currentTheme.lightClass
    )}>
      {isActualDark && currentTheme.darkOverlay && (
        <div className={cn("absolute inset-0 pointer-events-none", currentTheme.darkOverlay)} />
      )}
      <main id="board-canvas" className="absolute inset-0 z-0">
        <Canvas isDarkMode={isActualDark} />
      </main>
      <div className="ui-elements z-40 relative pointer-events-none *:pointer-events-auto">
        <Sidebar />
        <Toolbar />
        <ThemeSelector />
      </div>
    </div>
  );
}
