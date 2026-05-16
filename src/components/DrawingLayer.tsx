import React, { useMemo, useState, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';
import { DrawingData } from '../lib/db';
import { Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';

const getSvgPathFromStroke = (stroke: number[][]) => {
  if (!stroke.length) return "";
  
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  
  d.push("Z");
  return d.join(" ");
};

export const DrawingNode = React.memo(({ drawing }: { drawing: DrawingData }) => {
  const [clickPos, setClickPos] = useState<{x: number, y: number} | null>(null);
  const deleteDrawing = useStore(state => state.deleteDrawing);
  const camera = useStore(state => state.camera);
  const isHighlighter = drawing.tool === 'highlighter';
  const size = drawing.size;
  
  const points = drawing.points.map(p => [p.x, p.y, p.pressure || 0.5]);
  
  const strokeOptions = isHighlighter ? {
    size: size * 4,
    thinning: 0.1,
    smoothing: 0.8,
    streamline: 0.8,
  } : {
    size: size,
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.5,
  };

  const pathData = useMemo(() => {
    if (points.length === 0) return '';
    try {
      const strokeObj = getStroke(points, strokeOptions);
      return getSvgPathFromStroke(strokeObj);
    } catch (e) {
      return '';
    }
  }, [points, strokeOptions]);

  useEffect(() => {
    if (!clickPos) return;
    const hideMenu = () => setClickPos(null);
    window.addEventListener('pointerdown', hideMenu);
    return () => window.removeEventListener('pointerdown', hideMenu);
  }, [clickPos]);

  if (!pathData) return null;

  return (
    <>
      <svg 
        className="absolute top-0 left-0 overflow-visible pointer-events-none" 
        style={{ zIndex: drawing.zIndex }}
      >
        <path
          d={pathData}
          fill={drawing.color}
          style={{
            mixBlendMode: isHighlighter ? 'multiply' : 'normal',
            opacity: isHighlighter ? 0.5 : 1,
          }}
          className="pointer-events-auto cursor-pointer"
          onPointerDown={(e) => {
            if (drawing.id === 'in-progress') return;
            e.stopPropagation();
            setClickPos({
              x: (e.clientX - camera.x) / camera.z,
              y: (e.clientY - camera.y) / camera.z
            });
            useStore.getState().updateDrawing(drawing.id, { zIndex: useStore.getState().highestZ + 1 });
          }}
        />
      </svg>
      {clickPos && drawing.id !== 'in-progress' && (
        <div 
          className="absolute z-[1000] p-1 bg-white dark:bg-slate-800 rounded shadow-md border border-slate-200 dark:border-slate-700 flex gap-1 pointer-events-auto"
          style={{ 
            left: clickPos.x, 
            top: clickPos.y,
            transformOrigin: 'bottom center',
            transform: `translate(-50%, -100%) scale(${1 / camera.z}) translateY(-20px)`
          }}
          onPointerDown={e => e.stopPropagation()}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              deleteDrawing(drawing.id);
            }}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-red-500 transition-colors"
            title="Delete Drawing"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </>
  );
});
