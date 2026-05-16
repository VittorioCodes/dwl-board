import React, { useState, useRef, useEffect } from "react";
import { ImageData } from "../lib/db";
import { useStore } from "../lib/store";
import { cn } from "../lib/utils";
import { THEMES } from "../lib/themes";
import { Trash2, Maximize2, Link as LinkIcon, Pin, PinOff, Image as ImageIcon, Check, Pipette } from "lucide-react";
import { ConnectionHandle } from "./ConnectionHandle";
import { motion } from "motion/react";
import { extractColors } from "../lib/colors";

function ColorPalette({ colors }: { colors: string[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  if (!colors || colors.length === 0) return null;

  return (
    <div className={cn(
      "absolute top-1/2 -translate-y-1/2 -right-4 translate-x-full hidden md:flex flex-col gap-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto",
      THEMES[useStore.getState().theme || 'default'].ui.contextMenu
    )}>
      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1 px-1">Palette</div>
      {colors.map((hex, i) => (
        <button
          key={hex + i}
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(hex);
            setCopied(hex);
            setTimeout(() => setCopied(null), 1500);
          }}
          className="group/btn relative w-8 h-8 rounded-full border border-black/10 dark:border-white/10 shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all overflow-visible"
          style={{ backgroundColor: hex }}
          title={hex}
        >
          {copied === hex && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
              <Check size={14} className="text-white drop-shadow-md" />
            </div>
          )}
          <div className="absolute left-full ml-3 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-black/80 text-white text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap pointer-events-none flex items-center gap-1">
            {hex}
          </div>
        </button>
      ))}
    </div>
  );
}

export function ImageNode({ id, image }: { id: string; image: ImageData; key?: React.Key }) {
  const updateImage = useStore(state => state.updateImage);
  const deleteImage = useStore(state => state.deleteImage);
  const bringToFront = useStore(state => state.bringToFront);
  const isGroupMoving = useStore(state => state.movingIds.has(id));
  const themeId = useStore(state => state.theme);
  const currentTheme = THEMES[themeId] || THEMES.default;

  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | undefined>(undefined);
  const [colors, setColors] = useState<string[]>([]);
  
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!image.url) {
      setColors([]);
      return;
    }
    const offscreenImg = new Image();
    offscreenImg.crossOrigin = "anonymous";
    offscreenImg.onload = () => {
      const extracted = extractColors(offscreenImg, 4);
      if (extracted && extracted.length > 0) {
        setColors(extracted);
      }
    };
    // fallback if no CORS allowed (try anyway on same origin/data URIs without crossOrigin)
    offscreenImg.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        const extracted = extractColors(fallbackImg, 4);
        if (extracted && extracted.length > 0) {
          setColors(extracted);
        }
      };
      // fallback to original without crossOrigin
      fallbackImg.src = image.url;
    };
    offscreenImg.src = image.url;
  }, [image.url]);

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
    if (e.button !== 0 || image.pinnedToBackground) return;
    
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'button' || target.closest('button') || target.tagName.toLowerCase() === 'label' || target.closest('label')) {
      return;
    }

    e.stopPropagation();
    bringToFront(image.id, 'image');
    setIsMoving(true);
    useStore.getState().setMovingIds(new Set([image.id]));

    const node = e.currentTarget;
    node.setPointerCapture(e.pointerId);

    const camAtStart = useStore.getState().camera;
    const clickWorldX = (e.clientX - camAtStart.x) / camAtStart.z;
    const clickWorldY = (e.clientY - camAtStart.y) / camAtStart.z;
    const offsetFromNodeX = clickWorldX - image.x;
    const offsetFromNodeY = clickWorldY - image.y;

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
        
        const cam = useStore.getState().camera;
        const mouseWorldX = (lastClientX - cam.x) / cam.z;
        const mouseWorldY = (lastClientY - cam.y) / cam.z;
        
        useStore.getState().updateImage(image.id, { 
          x: mouseWorldX - offsetFromNodeX, 
          y: mouseWorldY - offsetFromNodeY 
        }, false);
      }
      
      panRAF = requestAnimationFrame(edgePan);
    };
    panRAF = requestAnimationFrame(edgePan);

    const onPointerMove = (moveEvent: PointerEvent) => {
      lastClientX = moveEvent.clientX;
      lastClientY = moveEvent.clientY;
      const cam = useStore.getState().camera;
      
      const mouseWorldX = (moveEvent.clientX - cam.x) / cam.z;
      const mouseWorldY = (moveEvent.clientY - cam.y) / cam.z;
      
      updateImage(image.id, { 
        x: mouseWorldX - offsetFromNodeX, 
        y: mouseWorldY - offsetFromNodeY 
      }, false);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      cancelAnimationFrame(panRAF);
      node.releasePointerCapture(upEvent.pointerId);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerUp);
      setIsMoving(false);
      useStore.getState().setMovingIds(new Set());
      
      const cam = useStore.getState().camera;
      const mouseWorldX = (upEvent.clientX - cam.x) / cam.z;
      const mouseWorldY = (upEvent.clientY - cam.y) / cam.z;
      
      updateImage(image.id, { x: mouseWorldX - offsetFromNodeX, y: mouseWorldY - offsetFromNodeY }, true);
    };

    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerup', onPointerUp);
  };

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (image.pinnedToBackground) return;
    
    e.stopPropagation();
    bringToFront(image.id, 'image');
    setIsResizing(true);

    const node = e.currentTarget;
    node.setPointerCapture(e.pointerId);

    const initialClientX = e.clientX;
    const initialClientY = e.clientY;
    const initialW = image.width || 320;
    const initialH = image.height || 240;

    let panRAF: number;
    let lastClientX = e.clientX;
    let lastClientY = e.clientY;
    
    // Try to get aspect ratio from the actual image if loaded
    const imgElement = node.parentElement?.querySelector('img');
    let aspectRatio = initialW / initialH;
    if (imgElement && imgElement.naturalWidth && imgElement.naturalHeight) {
      aspectRatio = imgElement.naturalWidth / imgElement.naturalHeight;
    }

    const onPointerMove = (moveEvent: PointerEvent) => {
      lastClientX = moveEvent.clientX;
      lastClientY = moveEvent.clientY;
      const z = useStore.getState().camera.z;
      let totalDx = (moveEvent.clientX - initialClientX) / z;
      let totalDy = (moveEvent.clientY - initialClientY) / z;
      
      const newWidth = Math.max(100, initialW + totalDx);
      const newHeight = image.url ? newWidth / aspectRatio : Math.max(100, initialH + totalDy);
      
      updateImage(image.id, { 
        width: newWidth, 
        height: newHeight 
      }, false);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      node.releasePointerCapture(upEvent.pointerId);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerUp);
      setIsResizing(false);
      
      const z = useStore.getState().camera.z;
      let totalDx = (upEvent.clientX - initialClientX) / z;
      let totalDy = (upEvent.clientY - initialClientY) / z;
      const newWidth = Math.max(100, initialW + totalDx);
      const newHeight = image.url ? newWidth / aspectRatio : Math.max(100, initialH + totalDy);
      
      updateImage(image.id, { 
        width: newWidth, 
        height: newHeight 
      }, true);
    };

    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerup', onPointerUp);
  };

  let transitionClass = "transition-[box-shadow,opacity] duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]";
  if (isResizing) {
    transitionClass = "transition-[box-shadow,opacity]";
  } else if (isMoving || isGroupMoving) {
    transitionClass = "transition-[box-shadow,scale,opacity] duration-[150ms] ease-out"; 
  }

  // Allow clicking to edit image URL if empty
  const [showUrlInput, setShowUrlInput] = useState(!image.url);

  const sampleColors = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!colors || colors.length === 0) return;
    
    const store = useStore.getState();
    const imgW = image.width || 320;
    const imgX = image.x + imgW + 40;
    
    // Stack them vertically, most dominant at the top. Note height is 140, padding 20.
    for (let i = 0; i < colors.length; i++) {
      const hex = colors[i];
      const noteY = image.y + (i * 160);
      const noteX = imgX;
      
      const newId = await store.addNote(noteX, noteY);
      
      store.updateNote(newId, {
        content: hex.toUpperCase(),
        palette: [hex],
      }, true);
      
      await store.addConnector(id, newId);
    }
  };

  return (
    <motion.div
      id={`node-${id}`}
      data-id={id}
      ref={nodeRef}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: ((isMoving || isGroupMoving) && !isResizing) ? 1.01 : 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.2, ease: "backIn" } }}
      style={{
        x: image.x,
        y: image.y,
        zIndex: image.pinnedToBackground ? 0 : ((isMoving || isGroupMoving) && !isResizing ? 50 : image.zIndex),
        width: image.width || 320,
        height: image.height || 240
      }}
      className={cn(
        "absolute top-0 left-0 flex flex-col group origin-center overflow-hidden connectable",
        !image.pinnedToBackground && "cursor-grab active:cursor-grabbing",
        transitionClass,
        image.pinnedToBackground ? "opacity-50 grayscale-[50%]" : currentTheme.ui.image,
        (isMoving || isGroupMoving) && !isResizing && "shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
      )}
    >
      <div className="w-full h-full relative group">
        {image.url ? (
          <>
            <img 
              src={image.url} 
              alt={image.caption || "Board image"} 
              className="w-full h-full object-cover select-none pointer-events-none block" 
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  const naturalRatio = img.naturalWidth / img.naturalHeight;
                  const currentRatio = (image.width || 320) / (image.height || 240);
                  if (Math.abs(currentRatio - naturalRatio) > 0.01) {
                    updateImage(id, { height: (image.width || 320) / naturalRatio }, true);
                  }
                }
              }}
            />
            <ColorPalette colors={colors} />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900/50 text-slate-400 p-4 relative z-10">
            <ImageIcon size={32} className="mb-2 opacity-50" />
            <div className="flex flex-col gap-2 w-full max-w-[200px]">
              <input 
                autoFocus
                type="text" 
                placeholder="Paste image URL here..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateImage(id, { url: e.currentTarget.value });
                    setShowUrlInput(false);
                  }
                }}
                onBlur={(e) => {
                  if (e.currentTarget.value) {
                    updateImage(id, { url: e.currentTarget.value });
                  }
                  setShowUrlInput(false);
                }}
                className="w-full p-2 text-xs rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 outline-none focus:ring-2 ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
              <div className="text-center text-[10px] uppercase font-bold tracking-wider opacity-50 my-1">OR</div>
              <label className="cursor-pointer flex items-center justify-center px-2 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition font-medium text-slate-600 dark:text-slate-300 shadow-sm active:scale-95">
                Upload Local File
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        if (e.target?.result && typeof e.target.result === 'string') {
                          updateImage(id, { url: e.target.result });
                          setShowUrlInput(false);
                        }
                      }
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {!image.pinnedToBackground && (
          <div className={cn(
            "absolute top-2 right-2 flex items-center gap-1 opacity-0 transition-opacity p-1 z-20",
            currentTheme.ui.contextMenu,
            (isHovered && !isMoving && !isResizing) ? "opacity-100 pointer-events-auto" : "pointer-events-none"
          )}>
            {colors && colors.length > 0 && (
              <button 
                onClick={sampleColors}
                className="p-1.5 rounded-md hover:bg-white/20 text-white transition-colors pointer-events-auto"
                title="Sample colors"
              >
                <Pipette size={14} />
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                updateImage(id, { url: '' });
                setShowUrlInput(true);
              }}
              className="p-1.5 rounded-md hover:bg-white/20 text-white transition-colors pointer-events-auto"
              title="Change Image"
            >
              <LinkIcon size={14} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                updateImage(id, { pinnedToBackground: true });
              }}
              className="p-1.5 rounded-md hover:bg-white/20 text-white transition-colors pointer-events-auto"
              title="Pin to background"
            >
              <Pin size={14} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                deleteImage(id);
              }}
              className="p-1.5 rounded-md hover:bg-red-500/50 text-red-200 hover:text-white transition-colors pointer-events-auto"
              title="Delete Image"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {image.pinnedToBackground && isHovered && (
          <div className={cn("absolute top-2 right-2 flex items-center opacity-100 p-1 z-20", currentTheme.ui.contextMenu)}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                updateImage(id, { pinnedToBackground: false });
              }}
              className="p-1.5 rounded-md hover:bg-white/20 text-white transition-colors"
              title="Unpin image"
            >
              <PinOff size={14} />
            </button>
          </div>
        )}

        {image.caption !== undefined && !image.pinnedToBackground && (
          <div className={cn(
            "absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent pt-8 transition-opacity",
            (isHovered || image.caption) ? "opacity-100" : "opacity-0"
          )}>
            <input
              type="text"
              value={image.caption}
              onChange={(e) => updateImage(id, { caption: e.target.value })}
              placeholder="Add caption..."
              className="w-full bg-transparent outline-none text-white text-xs font-medium placeholder:text-white/50"
            />
          </div>
        )}
      </div>

      <div 
        className={cn(
          "absolute -right-4 -bottom-4 cursor-se-resize flex items-center justify-center z-[100] transition-opacity",
          (isHovered && !image.pinnedToBackground) ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{
          width: '40px',
          height: '40px'
        }}
        onPointerDown={handleResizePointerDown}
      >
        <div className={cn("flex items-center justify-center p-1 transition-colors hover:bg-black/10 dark:hover:bg-white/30", currentTheme.ui.contextMenu)}>
          <Maximize2 size={13} className="rotate-90" />
        </div>
      </div>

      <ConnectionHandle id={id} isHovered={isHovered && !image.pinnedToBackground} />
    </motion.div>
  );
}
