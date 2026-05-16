import { useStore } from "../lib/store";
import { Palette, Check, Sun, Moon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import { THEMES } from "../lib/themes";

export function ThemeSelector() {
  const themeId = useStore(state => state.theme);
  const setTheme = useStore(state => state.setTheme);
  const isDarkMode = useStore(state => state.isDarkMode);
  const setIsDarkMode = useStore(state => state.setIsDarkMode);
  
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleDarkMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDarkMode(!isDarkMode);
  };

  const currentTheme = THEMES[themeId] || THEMES.default;
  const isActualDark = currentTheme.forceDark || (!currentTheme.forceLight && isDarkMode);

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-3" ref={menuRef}>
      {!currentTheme.forceDark && !currentTheme.forceLight && (
        <button
          onClick={toggleDarkMode}
          className={cn(
            "p-3 flex items-center justify-center transition-all hover:scale-105 active:scale-95",
            currentTheme.ui.selector
          )}
          title="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun size={20} className="text-yellow-400" />
          ) : (
            <Moon size={20} className="text-indigo-500" />
          )}
        </button>
      )}

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "p-3 flex items-center justify-center transition-all hover:scale-105 active:scale-95",
            currentTheme.ui.selector
          )}
          title="Choose theme"
        >
          <Palette size={20} />
        </button>

        {isOpen && (
          <div className={cn(
            "absolute top-full right-0 mt-3 w-48 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200",
            currentTheme.ui.selectorMenu
          )}>
            <div className="p-2 space-y-1">
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Themes
              </div>
              {Object.entries(THEMES).map(([id, t]) => (
                <button
                  key={id}
                  onClick={() => {
                    setTheme(id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                    themeId === id 
                      ? "bg-black/10 dark:bg-white/20 font-medium" 
                      : "hover:bg-black/5 dark:hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-4 h-4 shadow-sm border border-black/10 dark:border-white/20 overflow-hidden flex"
                      style={{ borderRadius: currentTheme.ui.selector.includes('rounded-none') ? '0' : '9999px' }}
                    >
                      <div className="w-1/2 h-full" style={{ backgroundColor: t.colors[0] }} />
                      <div className="w-1/2 h-full" style={{ backgroundColor: t.colors[1] }} />
                    </div>
                    {t.name}
                  </div>
                  {themeId === id && <Check size={16} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
