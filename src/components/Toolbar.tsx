import React, { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { Plus, LayoutTemplate, Download, Upload, Target, Image as ImageIcon, ListTodo, Code2, Pen, Highlighter, MousePointer2 } from 'lucide-react';
import { THEMES } from '../lib/themes';
import { cn } from '../lib/utils';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const DRAWING_COLORS = [
  '#cbd5e1', // Slate 300
  '#ef4444', // Red 500
  '#f97316', // Orange 500
  '#eab308', // Yellow 500
  '#22c55e', // Green 500
  '#3b82f6', // Blue 500
  '#a855f7', // Purple 500
  '#0f172a', // Slate 900 (Dark mode white-ish / Light mode black-ish, let's keep it fixed for now)
];

export function Toolbar() {
  const { addNote, addChecklist, addCodeSnippet, addFrame, addImage, exportBoard, importBoard, setCamera, camera, theme: themeId, activeTool, setActiveTool, drawingColor, setDrawingColor, drawingSize, setDrawingSize, frames, isDarkMode } = useStore(state => state);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleCenterAdd = (type: 'note' | 'checklist' | 'code' | 'frame' | 'image') => {
    // Add item roughly to the center of the current camera view
    const targetX = (window.innerWidth / 2 - camera.x) / camera.z - (type === 'frame' || type === 'image' ? 200 : 140);
    const targetY = (window.innerHeight / 2 - camera.y) / camera.z - (type === 'frame' || type === 'image' ? 200 : 70);
    
    if (type === 'note') addNote(targetX, targetY);
    else if (type === 'checklist') addChecklist(targetX, targetY);
    else if (type === 'code') addCodeSnippet(targetX, targetY);
    else if (type === 'frame') addFrame(targetX, targetY);
    else addImage(targetX, targetY);
  };

  const handleExportJSON = async () => {
    setShowExportMenu(false);
    const json = await exportBoard();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dwl-board-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const captureCanvas = async (overrideBg?: string) => {
    const el = document.getElementById('board-canvas') as HTMLElement | null;
    if (!el) return null;
    
    // Add watermark
    const watermark = document.createElement('div');
    watermark.innerText = 'DWL Board by VittorioCodes';
    watermark.style.position = 'absolute';
    watermark.style.bottom = '10px';
    watermark.style.right = '10px';
    watermark.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    watermark.style.padding = '5px 10px';
    watermark.style.borderRadius = '5px';
    watermark.style.fontSize = '14px';
    watermark.style.zIndex = '10000';
    watermark.style.color = '#334155';
    watermark.style.pointerEvents = 'none';
    el.appendChild(watermark);
    
    try {
      // Small delay to allow menus to close before capturing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      
      const dataUrl = await toPng(el, {
        width,
        height,
        pixelRatio: 2, // Use pixel ratio 2 for high-res but prevent browser zoom bugs
        style: {
          transform: 'none', // Prevent html-to-image from getting confused by any container transforms
        },
        backgroundColor: overrideBg || (isDarkMode ? '#0f172a' : '#ffffff'),
        filter: (node) => {
          if (node instanceof HTMLElement) {
            // Drop resize handles
            if (node.classList?.contains('cursor-se-resize')) return false;
            // Drop floating menus that might be left hovering around
            if (node.style?.zIndex === '1000') return false; 
          }
          return true;
        }
      });
      
      return dataUrl;
    } catch (e) {
      console.error('Error capturing canvas:', e);
      return null;
    } finally {
      el.removeChild(watermark);
    }
  };

  const handleExportPNG = async () => {
    setShowExportMenu(false);
    const dataUrl = await captureCanvas();
    if (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `dwl-board-${new Date().toISOString().split('T')[0]}.png`;
      a.click();
    }
  };

  const handleExportPNGWithBackground = async () => {
    setShowExportMenu(false);
    // Use white background as solid background
    const dataUrl = await captureCanvas('#ffffff');
    if (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `dwl-board-${new Date().toISOString().split('T')[0]}-bg.png`;
      a.click();
    }
  };

  const handleExportPDF = async () => {
    setShowExportMenu(false);
    const dataUrl = await captureCanvas();
    if (dataUrl) {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const isLandscape = img.width > img.height;
        const pdf = new jsPDF({
          orientation: isLandscape ? 'landscape' : 'portrait',
          unit: 'px',
          format: [img.width, img.height]
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, img.width, img.height);
        pdf.save(`dwl-board-${new Date().toISOString().split('T')[0]}.pdf`);
      };
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        const success = await importBoard(content);
        if (!success) alert("Failed to import board. Invalid file format.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const currentTheme = THEMES[themeId] || THEMES.default;

  return (
    <>
      {showExportMenu && (
        <div className="fixed bottom-20 sm:bottom-28 right-4 sm:right-1/2 sm:translate-x-[200px] mb-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col z-[100]">
          <button 
            onClick={handleExportJSON}
            className="px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
          >
            Export JSON
          </button>
          <div className="h-px bg-slate-100 dark:bg-slate-700" />
          <button 
            onClick={handleExportPNG}
            className="px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
          >
            Take Screenshot (PNG)
          </button>
          <div className="h-px bg-slate-100 dark:bg-slate-700" />
          <button 
            onClick={handleExportPNGWithBackground}
            className="px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
          >
            Take Screenshot (PNG w/ Background)
          </button>
          <div className="h-px bg-slate-100 dark:bg-slate-700" />
          <button 
            onClick={handleExportPDF}
            className="px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
          >
            Take Screenshot (PDF)
          </button>
        </div>
      )}

      {activeTool !== 'pointer' && (
        <div className="fixed bottom-20 sm:bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">
          <div className={cn("px-4 py-2 flex items-center gap-2 shadow-lg rounded-full border border-slate-200 dark:border-slate-700", currentTheme.ui.toolbar)}>
            {DRAWING_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setDrawingColor(color)}
                className={cn(
                  "w-6 h-6 rounded-full transition-transform",
                  drawingColor === color ? "scale-125 ring-2 ring-offset-2 ring-indigo-500" : "hover:scale-110"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className={cn("px-4 py-2 flex items-center gap-4 shadow-lg rounded-full border border-slate-200 dark:border-slate-700", currentTheme.ui.toolbar)}>
            <input 
              type="range" 
              min="1" 
              max="24" 
              value={drawingSize}
              onChange={e => setDrawingSize(parseInt(e.target.value))}
              className="w-32"
            />
          </div>
        </div>
      )}

      <div 
        className={cn(
          "fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50 w-full px-2"
        )}
      >
        <div 
          className={cn(
            "px-2 sm:px-4 py-2 flex items-center gap-1 sm:gap-4 max-w-[calc(100vw-1rem)] sm:max-w-none overflow-x-auto toolbar-scroll rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl",
            currentTheme.ui.toolbar
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`
            .toolbar-scroll::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          <button 
            onClick={() => setActiveTool('pointer')}
            className={cn("shrink-0 flex items-center gap-2 p-2 transition-colors drop-shadow-sm rounded-lg", activeTool === 'pointer' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600' : 'hover:text-indigo-600 dark:hover:text-indigo-400')}
            title="Pointer/Select Tool"
          >
            <MousePointer2 size={20} />
          </button>
  
          <button 
            onClick={() => setActiveTool('pen')}
            className={cn("shrink-0 flex items-center gap-2 p-2 transition-colors drop-shadow-sm rounded-lg", activeTool === 'pen' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600' : 'hover:text-indigo-600 dark:hover:text-indigo-400')}
            title="Pen Tool"
          >
            <Pen size={20} />
          </button>
  
          <button 
            onClick={() => setActiveTool('highlighter')}
            className={cn("shrink-0 flex items-center gap-2 p-2 transition-colors drop-shadow-sm rounded-lg", activeTool === 'highlighter' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600' : 'hover:text-indigo-600 dark:hover:text-indigo-400')}
            title="Highlighter Tool"
          >
            <Highlighter size={20} />
          </button>
  
          <div className="shrink-0 w-[1px] h-4 bg-current opacity-20" />
  
          <button 
            onClick={() => handleCenterAdd('note')}
            className="shrink-0 flex items-center gap-2 p-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors drop-shadow-sm"
            title="New Note"
          >
            <Plus size={20} />
          </button>
  
          <button 
            onClick={() => handleCenterAdd('checklist')}
            className="shrink-0 flex items-center gap-2 p-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors drop-shadow-sm"
            title="New Checklist"
          >
            <ListTodo size={20} />
          </button>
  
          <button 
            onClick={() => handleCenterAdd('code')}
            className="shrink-0 flex items-center gap-2 p-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors drop-shadow-sm"
            title="New Code Snippet"
          >
            <Code2 size={20} />
          </button>
  
          <button 
            onClick={() => handleCenterAdd('frame')}
            className="shrink-0 flex items-center gap-2 p-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors drop-shadow-sm"
            title="Add Section"
          >
            <LayoutTemplate size={20} />
          </button>
  
          <button 
            onClick={() => handleCenterAdd('image')}
            className="shrink-0 flex items-center gap-2 p-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors drop-shadow-sm"
            title="Add Image"
          >
            <ImageIcon size={20} />
          </button>
  
          <div className="shrink-0 w-[1px] h-4 bg-current opacity-20" />
  
          <button 
            onClick={() => setCamera({ x: window.innerWidth / 2 - 140, y: window.innerHeight / 2 - 70, z: 1 })}
            className="shrink-0 flex items-center justify-center p-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors drop-shadow-sm"
            title="Reset View"
          >
            <Target size={20} />
          </button>
  
          <div className="shrink-0 w-[1px] h-4 bg-current opacity-20" />
  
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="shrink-0 flex items-center justify-center p-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors drop-shadow-sm"
            title="Export"
          >
            <Download size={20} />
          </button>
  
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 flex items-center justify-center p-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors drop-shadow-sm"
            title="Import JSON"
          >
            <Upload size={20} />
          </button>
          
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleImport}
            className="hidden" 
          />
        </div>
        
        {/* Footer */}
        <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 text-center whitespace-nowrap mt-0.5">
          <a href="https://github.com/vittoriocodes/dwl-board" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 hover:underline">Github Repo</a>
          <span className="mx-1.5">•</span>
          Credit: <span className="font-semibold text-slate-700 dark:text-slate-300">VittorioCodes</span>
          <span className="mx-1.5">•</span>
          <span>Reminder: Export your project regularly because it's serverless.</span>
        </div>
      </div>
    </>
  );
}
