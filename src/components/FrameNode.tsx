import React, { useEffect, useState, useRef } from "react";
import { FrameData } from "../lib/db";
import { useStore } from "../lib/store";
import { THEMES } from "../lib/themes";
import { Trash2, Maximize2, Minimize2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../lib/utils";
import { ConnectionHandle } from "./ConnectionHandle";

export function FrameNode({ id, frame }: { id: string; frame: FrameData; key?: React.Key }) {
  const updateFrame = useStore(state => state.updateFrame);
  const deleteFrame = useStore(state => state.deleteFrame);
  const notes = useStore(state => state.notes);
  const frames = useStore(state => state.frames);
  const images = useStore(state => state.images);
  const hasMovingElements = useStore(state => state.movingIds.size > 0);
  const themeId = useStore(state => state.theme);
  const currentTheme = THEMES[themeId] || THEMES.default;

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | undefined>(undefined);

  const isCenterInside = (item: {x: number, y: number, width?: number | 'auto', height?: number | 'auto'}, fw: number, fh: number) => {
    const w = typeof item.width === 'number' ? item.width : 280;
    const h = typeof item.height === 'number' ? item.height : 140;
    const cx = item.x + w / 2;
    const cy = item.y + h / 2;
    return cx >= frame.x && cx <= frame.x + fw && cy >= frame.y && cy <= frame.y + fh;
  };

  useEffect(() => {
    // Only auto-expand when nothing is currently moving or being resized
    if (isResizing || isDragging || frame.collapsed || hasMovingElements) return;

    let minX = frame.x;
    let minY = frame.y;
    let maxX = frame.x + frame.width;
    let maxY = frame.y + frame.height;
    
    let needsUpdate = false;

    for (const nid in notes) {
      if (isCenterInside(notes[nid], frame.width, frame.height)) {
        const item = notes[nid];
        const w = typeof item.width === 'number' ? item.width : 280;
        const h = typeof item.height === 'number' ? item.height : 140;
        
        const padding = 24;
        const titleHeight = 32;
        
        if (item.x - padding < minX) {
          minX = item.x - padding;
          needsUpdate = true;
        }
        if (item.y - padding - titleHeight < minY) {
          minY = item.y - padding - titleHeight;
          needsUpdate = true;
        }
        if (item.x + w + padding > maxX) {
          maxX = item.x + w + padding;
          needsUpdate = true;
        }
        if (item.y + h + padding > maxY) {
          maxY = item.y + h + padding;
          needsUpdate = true;
        }
      }
    }

    for (const iid in images) {
      if (isCenterInside(images[iid], frame.width, frame.height)) {
        const item = images[iid];
        const w = typeof item.width === 'number' ? item.width : 320;
        const h = typeof item.height === 'number' ? item.height : 240;
        
        const padding = 24;
        const titleHeight = 32;
        
        if (item.x - padding < minX) {
          minX = item.x - padding;
          needsUpdate = true;
        }
        if (item.y - padding - titleHeight < minY) {
          minY = item.y - padding - titleHeight;
          needsUpdate = true;
        }
        if (item.x + w + padding > maxX) {
          maxX = item.x + w + padding;
          needsUpdate = true;
        }
        if (item.y + h + padding > maxY) {
          maxY = item.y + h + padding;
          needsUpdate = true;
        }
      }
    }

    if (needsUpdate) {
      updateFrame(id, {
        x: minX,
        y: minY,
        width: Math.max(150, maxX - minX),
        height: Math.max(150, maxY - minY)
      }, true);
    }
  }, [notes, images, frame.x, frame.y, frame.width, frame.height, isDragging, isResizing, frame.collapsed, hasMovingElements, id, updateFrame]);

  const handlePointerEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 50);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'input' || target.closest('button')) return;

    e.stopPropagation();
    setIsDragging(true);

    const node = e.currentTarget;
    node.setPointerCapture(e.pointerId);

    // Find children whose center is inside frame bounds
    const state = useStore.getState();
    const childrenNotes: string[] = [];
    const childrenImages: string[] = [];
    
    for (const nid in state.notes) {
      if (isCenterInside(state.notes[nid], frame.width, frame.height)) {
        childrenNotes.push(nid);
      }
    }
    
    for (const iid in state.images) {
      if (isCenterInside(state.images[iid], frame.width, frame.height)) {
        childrenImages.push(iid);
      }
    }

    useStore.getState().setMovingIds(new Set([...childrenNotes, ...childrenImages, frame.id]));

    let startX = e.clientX;
    let startY = e.clientY;
    
    let panRAF: number;
    let lastClientX = e.clientX;
    let lastClientY = e.clientY;

    const edgePan = () => {
      const edgeThreshold = 60;
      const panAmount = 15;
      let camDX = 0;
      let camDY = 0;
      const w = window.innerWidth;
      const h = window.innerHeight;

      if (lastClientX < edgeThreshold) camDX = panAmount;
      if (lastClientX > w - edgeThreshold) camDX = -panAmount;
      if (lastClientY < edgeThreshold) camDY = panAmount;
      if (lastClientY > h - edgeThreshold) camDY = -panAmount;

      if (camDX !== 0 || camDY !== 0) {
        useStore.getState().setCamera(prev => ({
          ...prev,
          x: prev.x + camDX,
          y: prev.y + camDY
        }));
        
        const z = useStore.getState().camera.z;
        const worldMoveX = -camDX / z;
        const worldMoveY = -camDY / z;
        useStore.getState().moveFrameGroup(frame.id, worldMoveX, worldMoveY, childrenNotes, [], childrenImages, false);
      }
      
      panRAF = requestAnimationFrame(edgePan);
    };
    panRAF = requestAnimationFrame(edgePan);

    const onPointerMove = (moveEvent: PointerEvent) => {
      lastClientX = moveEvent.clientX;
      lastClientY = moveEvent.clientY;
      const z = useStore.getState().camera.z;
      const dx = (moveEvent.clientX - startX) / z;
      const dy = (moveEvent.clientY - startY) / z;
      
      startX = moveEvent.clientX;
      startY = moveEvent.clientY;
      
      useStore.getState().moveFrameGroup(frame.id, dx, dy, childrenNotes, [], childrenImages, false);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      cancelAnimationFrame(panRAF);
      node.releasePointerCapture(upEvent.pointerId);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerUp);
      setIsDragging(false);
      useStore.getState().setMovingIds(new Set());
      useStore.getState().moveFrameGroup(frame.id, 0, 0, childrenNotes, [], childrenImages, true); // Trigger DB save
    };

    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerup', onPointerUp);
  };

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsResizing(true);

    const node = e.currentTarget;
    node.setPointerCapture(e.pointerId);

    let startX = e.clientX;
    let startY = e.clientY;
    let currentW = frame.width;
    let currentH = frame.height;

    let panRAF: number;
    let lastClientX = e.clientX;
    let lastClientY = e.clientY;

    const edgePan = () => {
      const edgeThreshold = 60;
      const panAmount = 15;
      let camDX = 0;
      let camDY = 0;
      const w = window.innerWidth;
      const h = window.innerHeight;

      if (lastClientX < edgeThreshold) camDX = panAmount;
      if (lastClientX > w - edgeThreshold) camDX = -panAmount;
      if (lastClientY < edgeThreshold) camDY = panAmount;
      if (lastClientY > h - edgeThreshold) camDY = -panAmount;

      if (camDX !== 0 || camDY !== 0) {
        useStore.getState().setCamera(prev => ({
          ...prev,
          x: prev.x + camDX,
          y: prev.y + camDY
        }));
        
        const z = useStore.getState().camera.z;
        const worldMoveX = -camDX / z;
        const worldMoveY = -camDY / z;
        currentW = Math.max(150, currentW + worldMoveX);
        currentH = Math.max(150, currentH + worldMoveY);
        useStore.getState().updateFrame(frame.id, { width: currentW, height: currentH }, false);
      }
      
      panRAF = requestAnimationFrame(edgePan);
    };
    panRAF = requestAnimationFrame(edgePan);

    const onPointerMove = (moveEvent: PointerEvent) => {
      lastClientX = moveEvent.clientX;
      lastClientY = moveEvent.clientY;
      const z = useStore.getState().camera.z;
      const dx = (moveEvent.clientX - startX) / z;
      const dy = (moveEvent.clientY - startY) / z;
      startX = moveEvent.clientX;
      startY = moveEvent.clientY;
      currentW = Math.max(150, currentW + dx);
      currentH = Math.max(150, currentH + dy);
      updateFrame(frame.id, { width: currentW, height: currentH }, false);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      cancelAnimationFrame(panRAF);
      node.releasePointerCapture(upEvent.pointerId);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerUp);
      setIsResizing(false);
      updateFrame(frame.id, { width: currentW, height: currentH }, true);
    };

    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerup', onPointerUp);
  };

  const handleResetBounds = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let found = false;

    for (const nid in notes) {
      if (isCenterInside(notes[nid], frame.width, frame.height)) {
        found = true;
        const item = notes[nid];
        const w = typeof item.width === 'number' ? item.width : 280;
        const h = typeof item.height === 'number' ? item.height : 140;
        if (item.x < minX) minX = item.x;
        if (item.y < minY) minY = item.y;
        if (item.x + w > maxX) maxX = item.x + w;
        if (item.y + h > maxY) maxY = item.y + h;
      }
    }
    
    for (const iid in images) {
      if (isCenterInside(images[iid], frame.width, frame.height)) {
        found = true;
        const item = images[iid];
        const w = typeof item.width === 'number' ? item.width : 320;
        const h = typeof item.height === 'number' ? item.height : 240;
        if (item.x < minX) minX = item.x;
        if (item.y < minY) minY = item.y;
        if (item.x + w > maxX) maxX = item.x + w;
        if (item.y + h > maxY) maxY = item.y + h;
      }
    }

    if (found) {
      const padding = 24;
      const titleHeight = 32;
      const newX = minX - padding;
      const newY = minY - padding - titleHeight;
      const newW = (maxX - minX) + padding * 2;
      const newH = (maxY - minY) + padding * 2 + titleHeight;
      updateFrame(id, {
        x: newX,
        y: newY,
        width: Math.max(150, newW),
        height: Math.max(150, newH)
      });
    } else {
      updateFrame(id, { width: 150, height: 150 });
    }
  };

  const isGroupMoving = useStore(state => state.movingIds.has(id));
  const isSelected = isDragging || isResizing || isGroupMoving;
  const isLinkingTarget = useStore(state => state.linkingTarget === id);

  let transitionClass = "transition-[box-shadow,background-color,border-color,scale,rotate,opacity] duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]";
  if (isResizing) {
    transitionClass = "transition-[box-shadow,background-color,border-color,opacity]"; // Instant resize, no width/height/transform transition
  } else if (isDragging || isGroupMoving || hasMovingElements) {
    transitionClass = "transition-[width,height,box-shadow,background-color,border-color,scale,rotate,opacity] duration-[150ms] ease-out"; // No transform transition so dragging is instant
  }

  return (
    <div
      id={`node-${id}`}
      data-id={id}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={{
        translate: `${frame.x}px ${frame.y}px`,
        scale: ((isDragging || isGroupMoving) && !isResizing) ? 1.01 : 1,
        rotate: '0deg',
        width: frame.collapsed ? 'auto' : frame.width,
        height: frame.collapsed ? 'auto' : frame.height,
        zIndex: ((isDragging || isGroupMoving) && !isResizing) ? 50 : frame.zIndex
      }}
      className={cn(
        "absolute top-0 left-0 cursor-grab active:cursor-grabbing group min-w-min origin-top-left pointer-events-none connectable isolate",
        transitionClass
      )}
    >
      {/* Frame Container */}
      <div className={cn(
        "w-full h-full flex flex-col pointer-events-none",
        frame.collapsed ? "border-0 shadow-lg backdrop-blur-[2px] rounded-2xl" : currentTheme.ui.frame,
        "transition-[box-shadow,background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
        isSelected && !frame.collapsed ? "ring-2 ring-indigo-400 dark:ring-indigo-500 shadow-[0_25px_50px_rgba(0,0,0,0.15)]" : "",
        isLinkingTarget && "ring-4 ring-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.3)]"
      )}>
        {/* Title Header */}
        <div className={cn(
          currentTheme.ui.frameHeader,
          "self-start pointer-events-auto shadow-sm transition-all duration-300 flex items-center",
          frame.collapsed 
            ? "px-5 py-3 rounded-2xl scale-125 origin-top-left shadow-xl" 
            : "px-4 py-2 mt-0 rounded-br-xl rounded-tl-[14px] group/header"
        )}>
          {!frame.collapsed && <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest leading-none mt-0.5 whitespace-nowrap mr-2">Section /</span>}
          <input 
            className={cn(
              "font-bold uppercase tracking-widest bg-transparent outline-none pointer-events-auto leading-none mt-0.5",
              frame.collapsed ? "text-sm w-48" : "text-[10px] w-32"
            )} 
            placeholder="Title..."
            value={frame.title}
            onChange={(e) => updateFrame(id, { title: e.target.value })}
          />
          <div className={cn(
            "flex items-center gap-1 transition-opacity ml-2",
            frame.collapsed ? "opacity-100" : "opacity-0 group-hover/header:opacity-100"
          )}>
            <button 
              onClick={() => {
                if (frame.collapsed) {
                  updateFrame(id, { collapsed: false });
                  handleResetBounds();
                } else {
                  updateFrame(id, { collapsed: true });
                }
              }}
              className="p-1 rounded hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-400 hover:text-indigo-500 pointer-events-auto"
              title={frame.collapsed ? "Expand Section" : "Collapse Section"}
            >
              {frame.collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            {!frame.collapsed && (
              <button 
                onClick={handleResetBounds}
                className="p-1 rounded hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-400 hover:text-indigo-500 pointer-events-auto"
                title="Fit to children"
              >
                <Minimize2 size={12} />
              </button>
            )}
            <button 
              onClick={() => deleteFrame(id)}
              className="p-1 rounded hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-400 hover:text-red-500 pointer-events-auto"
              title="Delete Section"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      {!frame.collapsed && (
        <div 
          className={cn(
            "absolute -bottom-4 -right-4 cursor-se-resize flex items-center justify-center z-[100] transition-opacity pointer-events-auto",
            (isHovered || isDragging || isResizing || hasMovingElements) ? "opacity-100" : "opacity-0"
          )}
          style={{
            width: '40px',
            height: '40px'
          }}
          onPointerDown={handleResizePointerDown}
        >
          <div className="flex items-center justify-center bg-slate-300/80 dark:bg-slate-700/80 rounded-md p-1 shadow-sm hover:bg-slate-400/90 dark:hover:bg-slate-600/90 text-slate-600 dark:text-slate-300 transition-colors">
            <Maximize2 size={13} className="rotate-90" />
          </div>
        </div>
      )}

      <ConnectionHandle id={id} isHovered={isHovered} collapsed={frame.collapsed} />
    </div>
  );
}
