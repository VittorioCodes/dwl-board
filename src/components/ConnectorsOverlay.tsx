import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, CircleDashed, Circle, Minus, X } from 'lucide-react';
import { cn } from '../lib/utils';

import { THEMES } from '../lib/themes';

function getCenter(id: string, state: any, type: 'source' | 'target') {
  const note = state.notes[id];
  const frame = state.frames[id];
  const image = state.images[id];
  const item = note || frame || image;

  const el = document.getElementById(`node-${id}`);
  
  if (item && el) {
    return {
      x: type === 'source' ? item.x + el.offsetWidth : item.x,
      y: item.y + el.offsetHeight / 2
    };
  }

  if (!item) return { x: 0, y: 0 };
  const w = item.width === 'auto' ? 280 : (item.width || 280);
  const h = item.height === 'auto' ? 140 : (item.height || 140);
  
  return {
    x: type === 'source' ? item.x + w : item.x,
    y: item.y + h / 2
  };
}

export function ConnectorsOverlay() {
  const store = useStore(state => state);
  const [, setTick] = useState(0);
  const reqRef = useRef<number | undefined>(undefined);
  
  const [menuData, setMenuData] = useState<{ id: string, x: number, y: number } | null>(null);

  useEffect(() => {
    const loop = () => {
      setTick(t => t + 1);
      reqRef.current = requestAnimationFrame(loop);
    };
    reqRef.current = requestAnimationFrame(loop);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, []);

  const { connectors, linkingFrom, linkingTarget, linkingMousePos, isDarkMode, deleteConnector, updateConnector, camera, theme } = store;
  const currentTheme = THEMES[theme || 'default'];
  const isActualDark = currentTheme.forceDark || (!currentTheme.forceLight && isDarkMode);

  const links = Object.values(connectors).map(c => {
    const from = getCenter(c.fromId, store, 'source');
    const to = getCenter(c.toId, store, 'target');
    return { id: c.id, from, to, style: c.style || 'solid', label: c.label || '' };
  });

  const activeLink = linkingFrom && linkingMousePos ? {
    from: getCenter(linkingFrom, store, 'source'),
    to: linkingTarget ? getCenter(linkingTarget, store, 'target') : linkingMousePos
  } : null;

  const drawBezier = (x1: number, y1: number, x2: number, y2: number) => {
    const cx1 = x1 + (x2 - x1) / 2;
    const cy1 = y1;
    const cx2 = x1 + (x2 - x1) / 2;
    const cy2 = y2;
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  };

  const getDashArray = (style: string) => {
    if (style === 'dashed') return '10,10';
    if (style === 'long-dashed') return '20,20';
    if (style === 'dotted') return '4,6';
    if (style === 'mixed') return '20,8,4,8';
    return 'none';
  };

  const strokeColor = isActualDark ? "white" : "black";

  const handleConnectorClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (menuData?.id === id) {
      setMenuData(null);
    } else {
      const link = links.find(l => l.id === id);
      if (link) {
        const midX = (link.from.x + link.to.x) / 2;
        const midY = (link.from.y + link.to.y) / 2;
        setMenuData({ id, x: midX, y: midY });
      }
    }
  };
  
  return (
    <>
      <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', zIndex: 0 }}>
        <defs>
          <marker 
            id="arrowhead" 
            markerWidth="10" 
            markerHeight="7" 
            refX="9" 
            refY="3.5" 
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} opacity={0.3} />
          </marker>
          <marker 
            id="arrowhead-active" 
            markerWidth="10" 
            markerHeight="7" 
            refX="9" 
            refY="3.5" 
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
          </marker>
        </defs>

        {links.map(l => {
          const midX = (l.from.x + l.to.x) / 2;
          const midY = (l.from.y + l.to.y) / 2;
          
          return (
            <g key={l.id} className="pointer-events-auto">
              <path
                d={drawBezier(l.from.x, l.from.y, l.to.x, l.to.y)}
                fill="none"
                stroke={currentTheme.ui.connectionLine || strokeColor}
                strokeWidth="3"
                strokeDasharray={getDashArray(l.style)}
                strokeOpacity="0.2"
                markerEnd="url(#arrowhead)"
                className={cn("transition-opacity cursor-pointer", currentTheme.ui.connectionHover || "hover:stroke-indigo-500 hover:stroke-opacity-50")}
                onClick={(e) => handleConnectorClick(e, l.id)}
              />
              <path
                d={drawBezier(l.from.x, l.from.y, l.to.x, l.to.y)}
                fill="none"
                stroke="transparent"
                strokeWidth="24"
                className="cursor-pointer"
                onClick={(e) => handleConnectorClick(e, l.id)}
              />
              
            </g>
          );
        })}

        {activeLink && (
          <path
            d={drawBezier(activeLink.from.x, activeLink.from.y, activeLink.to.x, activeLink.to.y)}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeDasharray="6,6"
            className="animate-[dash_1s_linear_infinite]"
            markerEnd="url(#arrowhead-active)"
          />
        )}
        <style>{`
          @keyframes dash {
            to { stroke-dashoffset: -12; }
          }
        `}</style>
      </svg>
      
      <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible', zIndex: 100 }}>
        {links.map(l => {
          if (!l.label) return null;
          const midX = (l.from.x + l.to.x) / 2;
          const midY = (l.from.y + l.to.y) / 2;
          
          return (
            <text
              key={`label-${l.id}`}
              x={midX}
              y={midY}
              dominantBaseline="middle"
              textAnchor="middle"
              fontSize="14"
              fontWeight="600"
              fill={currentTheme.ui.connectionTextFill || (isActualDark ? "#f8fafc" : "#334155")}
              stroke={currentTheme.ui.connectionTextStroke || (isActualDark ? "#0f172a" : "#ffffff")}
              strokeWidth="4"
              paintOrder="stroke"
              className="pointer-events-none select-none"
            >
              {l.label}
            </text>
          );
        })}
      </svg>

      <AnimatePresence>
        {menuData && (
          <ConnectorMenu
            key={menuData.id}
            menuData={menuData}
            camera={camera}
            isDarkMode={isActualDark}
            currentTheme={currentTheme}
            connector={connectors[menuData.id]}
            onClose={() => setMenuData(null)}
            onUpdate={(data) => updateConnector(menuData.id, data)}
            onDelete={() => {
              deleteConnector(menuData.id);
              setMenuData(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

const ConnectorMenu: React.FC<{
  menuData: { id: string, x: number, y: number },
  camera: { z: number },
  isDarkMode: boolean,
  currentTheme: any,
  connector: any,
  onClose: () => void,
  onUpdate: (data: any) => void,
  onDelete: () => void
}> = ({ 
  menuData, 
  camera, 
  isDarkMode, 
  currentTheme,
  connector, 
  onClose, 
  onUpdate, 
  onDelete 
}) => {
  const [label, setLabel] = useState(connector?.label || '');

  const menuRef = useRef<HTMLDivElement>(null);

  // Keep menu at scaling 1.2 relative to viewport so it remains usable.
  const inverseScale = 1.2 / camera.z;

  const baseBtnClass = cn(
    "p-2.5 rounded-md transition-colors flex items-center justify-center",
    isDarkMode ? "hover:bg-white/10 text-slate-300" : "hover:bg-slate-100 text-slate-600"
  );
  
  const activeBtnClass = isDarkMode ? "bg-white/10 text-white" : "bg-slate-200 text-slate-900";

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      onClose();
    };
    // Use capture phase to ensure it runs before container handlers
    window.addEventListener('pointerdown', handlePointerDown, { capture: true });
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
    };
  }, [onClose]);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 * inverseScale, x: "-50%", y: 10 }}
      animate={{ opacity: 1, scale: 1 * inverseScale, x: "-50%", y: 10 }}
      exit={{ opacity: 0, scale: 0.95 * inverseScale, x: "-50%", y: 10 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "absolute z-[999999] flex flex-col gap-2 p-3 rounded-2xl shadow-2xl border backdrop-blur-xl origin-top shadow-slate-900/10",
        currentTheme.ui.contextMenu,
        "pointer-events-auto"
      )}
      style={{ 
        left: menuData.x, 
        top: menuData.y
      }}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdate({ style: 'solid' })}
          className={cn(baseBtnClass, (connector?.style === 'solid' || !connector?.style) && activeBtnClass)}
          title="Solid line"
        >
          <Minus size={18} strokeWidth={3} />
        </button>
        <button
          onClick={() => onUpdate({ style: 'dashed' })}
          className={cn(baseBtnClass, connector?.style === 'dashed' && activeBtnClass)}
          title="Dashed line"
        >
          <CircleDashed size={18} />
        </button>
        <button
          onClick={() => onUpdate({ style: 'dotted' })}
          className={cn(baseBtnClass, connector?.style === 'dotted' && activeBtnClass)}
          title="Dotted line"
        >
          <Circle size={18} className="fill-current" />
        </button>
        <button
          onClick={() => onUpdate({ style: 'long-dashed' })}
          className={cn(baseBtnClass, connector?.style === 'long-dashed' && activeBtnClass)}
          title="Long Dashed line"
        >
          <span className="font-mono text-xs font-bold tracking-widest">- -</span>
        </button>
        <button
          onClick={() => onUpdate({ style: 'mixed' })}
          className={cn(baseBtnClass, connector?.style === 'mixed' && activeBtnClass)}
          title="Mixed dashed-dotted line"
        >
          <span className="font-mono text-xs font-bold tracking-widest">-.-</span>
        </button>
        
        <div className={cn("w-px h-6 mx-1", isDarkMode ? "bg-slate-700" : "bg-slate-200")} />
        
        <button
          onClick={onDelete}
          className="p-2 rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
          title="Delete connection"
        >
          <Trash2 size={18} />
        </button>
      </div>
      
      <div className="flex items-center gap-2 mt-1">
        <input 
          autoFocus
          type="text"
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            onUpdate({ label: e.target.value });
          }}
          placeholder="Add title to line..."
          className={cn(
            "flex-1 px-3 py-1.5 rounded-lg text-sm bg-transparent border focus:outline-none focus:ring-2 focus:ring-indigo-500",
            isDarkMode ? "border-slate-700 text-white placeholder-slate-500" : "border-slate-300 text-slate-900 placeholder-slate-400"
          )}
        />
        {label && (
          <button 
            onClick={() => {
              setLabel('');
              onUpdate({ label: '' });
            }}
            className={cn("p-1.5 rounded-md transition-colors", isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-black")}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
