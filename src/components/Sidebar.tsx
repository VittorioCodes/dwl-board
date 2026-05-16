import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../lib/store';
import { ChevronRight, ChevronLeft, LayoutTemplate, StickyNote, ChevronDown, Image as ImageIcon, CheckSquare, Code2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { NoteData, FrameData, ImageData } from '../lib/db';
import { motion, AnimatePresence } from 'motion/react';
import { THEMES } from '../lib/themes';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const { notes, frames, images, setCamera, theme: themeId } = useStore(state => state);

  const animationRef = useRef<number | undefined>(undefined);
  const handleFocus = (targetX: number, targetY: number) => {
    if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) return;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const currentCamera = useStore.getState().camera;
    
    // Zoom maintains current level
    const targetCameraZ = currentCamera.z;
    const targetCameraX = cx - targetX * targetCameraZ;
    const targetCameraY = cy - targetY * targetCameraZ;
    
    const startCameraX = currentCamera.x;
    const startCameraY = currentCamera.y;
    const startCameraZ = currentCamera.z;
    
    const startTime = performance.now();
    const duration = 600; // slightly longer for smoother transition

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutQuint)
      const ease = 1 - Math.pow(1 - progress, 5);
      
      const currentX = startCameraX + (targetCameraX - startCameraX) * ease;
      const currentY = startCameraY + (targetCameraY - startCameraY) * ease;
      const currentZ = startCameraZ + (targetCameraZ - startCameraZ) * ease;
      
      setCamera(cam => ({ ...cam, x: currentX, y: currentY, z: currentZ }));
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = undefined;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const toggleSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Group notes and images into frames
  const { groupedItems, orphanedItems } = useMemo(() => {
    type CanvasItem = (NoteData | ImageData) & { type: 'note' | 'image' };
    const grouped: Record<string, CanvasItem[]> = {};
    const orphaned: CanvasItem[] = [];

    const isCenterInside = (item: {x: number, y: number, width?: number, height?: number}, frame: FrameData) => {
      const w = typeof item.width === 'number' ? item.width : 280;
      const h = typeof item.height === 'number' ? item.height : 140;
      const cx = item.x + w / 2;
      const cy = item.y + h / 2;
      return cx >= frame.x && cx <= frame.x + frame.width && cy >= frame.y && cy <= frame.y + frame.height;
    };

    Object.keys(frames).forEach(fid => {
      grouped[fid] = [];
    });

    const items: CanvasItem[] = [
      ...Object.values(notes).map(n => ({ ...n, type: 'note' as const })),
      ...Object.values(images).map(img => ({ ...img, type: 'image' as const }))
    ];

    items.forEach(item => {
      let foundFrameId: string | null = null;
      let highestZ = -Infinity;
      
      for (const fid in frames) {
        const frame = frames[fid];
        if (isCenterInside(item, frame)) {
          if (frame.zIndex > highestZ) {
            highestZ = frame.zIndex;
            foundFrameId = fid;
          }
        }
      }

      if (foundFrameId) {
        grouped[foundFrameId].push(item);
      } else {
        orphaned.push(item);
      }
    });

    return { groupedItems: grouped, orphanedItems: orphaned };
  }, [notes, frames, images]);

  const renderItem = (item: (NoteData | ImageData) & { type: 'note' | 'image' }) => {
    const w = typeof item.width === 'number' ? item.width : 280;
    const h = typeof item.height === 'number' ? item.height : 140;
    return (
      <button
        key={item.id}
        onClick={() => handleFocus(item.x + w / 2, item.y + h / 2)}
        className="w-full text-left px-2 py-1.5 text-xs hover:bg-black/10 dark:hover:bg-white/10 rounded-md flex items-center gap-2 transition-colors"
      >
        {item.type === 'note' ? (
          (item as NoteData).variant === 'task' ? <CheckSquare size={12} className="text-emerald-400 shrink-0" /> :
          (item as NoteData).variant === 'code' ? <Code2 size={12} className="text-amber-400 shrink-0" /> :
          <StickyNote size={12} className="text-rose-400 shrink-0" />
        ) : (
          <ImageIcon size={12} className="text-sky-400 shrink-0" />
        )}
        <span className="truncate">
          {item.type === 'note' 
            ? (('title' in item && item.title) || (('palette' in item && item.palette.length > 0) ? item.palette.join(', ') : 'Empty Note'))
            : (('caption' in item && item.caption) || 'Image')}
        </span>
      </button>
    );
  };

  const currentTheme = THEMES[themeId] || THEMES.default;

  return (
    <>
      <div 
        className={cn(
          "fixed top-0 left-0 h-full w-64 transition-transform duration-300 z-40 flex flex-col",
          currentTheme.ui.sidebar,
          isOpen ? "translate-x-0 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.3)] dark:shadow-[10px_0_30px_-15px_rgba(0,0,0,0.6)]" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-inherit opacity-50">
          <h2 className="text-sm font-bold uppercase tracking-widest opacity-80">Navigator</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {Object.values(frames).map(frame => {
            const isCollapsed = collapsedSections[frame.id];
            const sectionItems = groupedItems[frame.id] || [];
            
            return (
              <div key={frame.id} className="mb-1">
                <button
                  onClick={() => handleFocus(frame.x + (frame.width || 400)/2, frame.y + (frame.height || 400)/2)}
                  className="w-full text-left px-2 py-2 text-sm hover:bg-black/10 dark:hover:bg-white/10 rounded-lg flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <LayoutTemplate size={14} className="opacity-70 shrink-0" />
                    <span className="truncate font-medium">{frame.title || 'Untitled Section'}</span>
                  </div>
                  {sectionItems.length > 0 && (
                    <div 
                      onClick={(e) => toggleSection(frame.id, e)}
                      className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shrink-0"
                    >
                      <ChevronDown size={14} className={cn("transition-transform", isCollapsed ? "-rotate-90" : "")} />
                    </div>
                  )}
                </button>
                
                <AnimatePresence initial={false}>
                  {!isCollapsed && sectionItems.length > 0 && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="pl-6 pr-2 overflow-hidden space-y-1"
                    >
                      <div className="pt-1 pb-1">
                        {sectionItems.map(renderItem)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {orphanedItems.length > 0 && (
            <div className="mt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 mb-1 opacity-60">Uncategorized</h3>
              {orphanedItems.map(renderItem)}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 p-1.5 z-40 transition-all duration-300 flex items-center justify-center",
          currentTheme.ui.sidebarToggle,
          isOpen ? "left-64 shadow-[5px_0_15px_-5px_rgba(0,0,0,0.1)]" : "left-0"
        )}
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </>
  );
}

