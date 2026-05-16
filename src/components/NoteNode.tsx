import React, { useEffect, useState, useRef } from "react";
import { NoteData } from "../lib/db";
import { useStore } from "../lib/store";
import { cn, getTextColorForBackground } from "../lib/utils";
import { THEMES } from "../lib/themes";
import { Trash2, LayoutTemplate, Layers, Maximize2, Type, Plus, CheckCircle2, Circle, Copy, Moon, Sun, Code2, Eye, EyeOff } from "lucide-react";
import { ConnectionHandle } from "./ConnectionHandle";
import { motion, useMotionValue, useSpring, AnimatePresence } from "motion/react";
import Editor from 'react-simple-code-editor';
import Markdown from 'react-markdown';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';

export function NoteNode({ id, note }: { id: string; note: NoteData; key?: React.Key }) {
  const updateNote = useStore(state => state.updateNote);
  const deleteNote = useStore(state => state.deleteNote);
  const bringToFront = useStore(state => state.bringToFront);
  const isGroupMoving = useStore(state => state.movingIds.has(id));
  const isDarkMode = useStore(state => state.isDarkMode);
  const themeId = useStore(state => state.theme);
  const currentTheme = THEMES[themeId] || THEMES.default;

  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | undefined>(undefined);
  
  const dragVelocityX = useMotionValue(0);
  const dragRotation = useSpring(dragVelocityX, { stiffness: 300, damping: 20 });
  
  const nodeRef = useRef<HTMLDivElement>(null);
  const [actualDimensions, setActualDimensions] = useState({ width: note.width || 280, height: note.height || 140 });

  useEffect(() => {
    if (!nodeRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setActualDimensions({
          width: entry.borderBoxSize?.[0]?.inlineSize || entry.contentRect.width,
          height: entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height
        });
      }
    });
    observer.observe(nodeRef.current);
    return () => observer.disconnect();
  }, []);

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
    // Ignore middle mouse or right click
    if (e.button !== 0) return;
    
    // Ignore drags that start inside interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'textarea' || target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'button' || target.closest('button')) {
      return;
    }

    e.stopPropagation();
    bringToFront(note.id, 'note');
    setIsMoving(true);
    useStore.getState().setMovingIds(new Set([note.id]));

    const node = e.currentTarget;
    node.setPointerCapture(e.pointerId);

    const camAtStart = useStore.getState().camera;
    const clickWorldX = (e.clientX - camAtStart.x) / camAtStart.z;
    const clickWorldY = (e.clientY - camAtStart.y) / camAtStart.z;
    const offsetFromNodeX = clickWorldX - note.x;
    const offsetFromNodeY = clickWorldY - note.y;

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
        
        useStore.getState().updateNote(note.id, { 
          x: mouseWorldX - offsetFromNodeX, 
          y: mouseWorldY - offsetFromNodeY 
        }, false);
      }
      
      panRAF = requestAnimationFrame(edgePan);
    };
    panRAF = requestAnimationFrame(edgePan);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - lastClientX;
      dragVelocityX.set(Math.max(-15, Math.min(15, dx * 0.8)));

      lastClientX = moveEvent.clientX;
      lastClientY = moveEvent.clientY;
      const cam = useStore.getState().camera;
      
      const mouseWorldX = (moveEvent.clientX - cam.x) / cam.z;
      const mouseWorldY = (moveEvent.clientY - cam.y) / cam.z;
      
      updateNote(note.id, { 
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
      dragVelocityX.set(0);
      useStore.getState().setMovingIds(new Set());
      
      const cam = useStore.getState().camera;
      const mouseWorldX = (upEvent.clientX - cam.x) / cam.z;
      const mouseWorldY = (upEvent.clientY - cam.y) / cam.z;
      
      updateNote(note.id, { x: mouseWorldX - offsetFromNodeX, y: mouseWorldY - offsetFromNodeY }, true);
    };

    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerup', onPointerUp);
  };

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    bringToFront(note.id, 'note');
    setIsResizing(true);

    const node = e.currentTarget;
    node.setPointerCapture(e.pointerId);

    const initialClientX = e.clientX;
    const initialClientY = e.clientY;
    const initialW = nodeRef.current?.offsetWidth || note.width || 280;
    const initialH = nodeRef.current?.offsetHeight || note.height || 140;

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
        const totalDx = (lastClientX - initialClientX) / z;
        const totalDy = (lastClientY - initialClientY) / z;
        
        useStore.getState().updateNote(note.id, { 
          width: Math.max(200, initialW + totalDx), 
          height: Math.max(140, initialH + totalDy) 
        }, false);
      }
      
      panRAF = requestAnimationFrame(edgePan);
    };
    panRAF = requestAnimationFrame(edgePan);

    const onPointerMove = (moveEvent: PointerEvent) => {
      lastClientX = moveEvent.clientX;
      lastClientY = moveEvent.clientY;
      const z = useStore.getState().camera.z;
      const totalDx = (moveEvent.clientX - initialClientX) / z;
      const totalDy = (moveEvent.clientY - initialClientY) / z;
      
      updateNote(note.id, { 
        width: Math.max(200, initialW + totalDx), 
        height: Math.max(140, initialH + totalDy) 
      }, false);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      cancelAnimationFrame(panRAF);
      node.releasePointerCapture(upEvent.pointerId);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerUp);
      setIsResizing(false);

      const z = useStore.getState().camera.z;
      const totalDx = (upEvent.clientX - initialClientX) / z;
      const totalDy = (upEvent.clientY - initialClientY) / z;
      
      updateNote(note.id, { 
        width: Math.max(200, initialW + totalDx), 
        height: Math.max(140, initialH + totalDy) 
      }, true);
    };

    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerup', onPointerUp);
  };

  const primaryColor = note.palette.length > 0 ? note.palette[0] : 'rgba(255, 255, 255, 0.7)';
  const isDefault = note.palette.length === 0;
  const hexForCurrent = note.palette.length > 0 ? note.palette[0] : (isDarkMode ? '#1e293b' : '#ffffff');
  const textColor = isDefault ? undefined : getTextColorForBackground(hexForCurrent);
  const isWhiteText = textColor === '#ffffff';
  const isDarkText = textColor && !isWhiteText && !isDefault;
  const isLight = hexForCurrent.toUpperCase() === '#FFFFFF' || getTextColorForBackground(hexForCurrent) === '#111111';

  const renderNested = (colors: string[], index = 1): React.ReactNode => {
    if (index >= colors.length) return null;
    if (index === 1) {
      return (
        <div className="mt-4 w-full flex-1 rounded-xl flex items-center justify-center p-3 border border-black/10 overflow-hidden shrink-0 shadow-inner min-h-[120px]" style={{ backgroundColor: colors[1] }}>
          {renderNested(colors, 2)}
        </div>
      );
    }
    return (
      <div className="w-full h-full min-h-[60px] rounded-lg flex items-center justify-center p-3 border border-black/10 overflow-hidden shadow-md" style={{ backgroundColor: colors[index] }}>
        {renderNested(colors, index + 1)}
      </div>
    );
  };

  const renderTasks = () => {
    const tasks = note.tasks || [];
    const completedCount = tasks.filter(t => t.completed).length;
    const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

    return (
      <div className="flex flex-col gap-2 mt-2 w-full font-sans flex-1 pointer-events-auto">
        <div className="flex-1 overflow-y-auto min-h-[60px] flex flex-col gap-2 pr-1" onScroll={(e) => e.stopPropagation()}>
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-2 group/task bg-black/5 dark:bg-white/5 p-2 rounded-lg transition-colors border border-black/5 dark:border-white/5">
              <button
                onClick={(e) => { e.stopPropagation(); updateNote(id, { tasks: tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t) }); }}
                className={cn("shrink-0 transition-colors", task.completed ? "text-green-500" : (isWhiteText ? "text-white/40 hover:text-white" : isDarkText ? "text-black/40 hover:text-black" : "text-current opacity-40 hover:opacity-100"))}
              >
                {task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </button>
              
              <input
                type="text"
                value={task.text}
                onChange={(e) => updateNote(id, { tasks: tasks.map(t => t.id === task.id ? { ...t, text: e.target.value } : t) })}
                className={cn(
                  "flex-1 bg-transparent outline-none text-sm min-w-0 pointer-events-auto",
                  task.completed && "line-through opacity-50",
                  isWhiteText ? "text-white placeholder:text-white/30" : isDarkText ? "text-black placeholder:text-black/30" : "text-current placeholder:text-current placeholder:opacity-50"
                )}
                placeholder="Walk the dog..."
              />
              
              <button
                onClick={(e) => { 
                  e.stopPropagation();
                  const nextP = task.priority === 'Low' ? 'Med' : task.priority === 'Med' ? 'High' : 'Low';
                  updateNote(id, { tasks: tasks.map(t => t.id === task.id ? { ...t, priority: nextP } : t) });
                }}
                className={cn(
                  "shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded transition-colors bg-black/10 dark:bg-white/10",
                  task.priority === 'High' ? "text-red-500" : task.priority === 'Med' ? "text-amber-500" : "text-blue-500"
                )}
              >
                {task.priority}
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); updateNote(id, { tasks: tasks.filter(t => t.id !== task.id) }); }}
                className={cn("shrink-0 opacity-0 group-hover/task:opacity-100 transition-opacity p-1 rounded-md", isWhiteText ? "hover:bg-white/10 text-white/60" : isDarkText ? "hover:bg-black/10 text-black/60" : "hover:bg-black/10 dark:hover:bg-white/10 text-current opacity-60")}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={(e) => { e.stopPropagation(); updateNote(id, { tasks: [...tasks, { id: crypto.randomUUID(), text: '', completed: false, priority: 'Med' }] }); }}
            className={cn("flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-sm font-medium transition-colors w-max", isWhiteText ? "text-white/60 hover:text-white hover:bg-white/10" : isDarkText ? "text-black/60 hover:text-black hover:bg-black/10" : "text-current opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10")}
          >
            <Plus size={14} /> Add task
          </button>
        </div>

        {tasks.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs font-medium opacity-70">
              <span>{Math.round(progress)}% Complete</span>
              {completedCount > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); updateNote(id, { tasks: tasks.filter(t => !t.completed) }); }}
                  className="hover:underline transition-all active:scale-95"
                >
                  Clear Completed
                </button>
              )}
            </div>
            <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCodeSnippet = () => {
    const isDarkTheme = note.codeTheme === 'dark';
    const lang = note.codeLanguage || 'javascript';
    const copyToClipboard = () => {
      navigator.clipboard.writeText(note.content || '');
    };

    return (
      <div className={cn(
        "flex flex-col mt-2 w-full flex-1 pointer-events-auto rounded-lg overflow-hidden border transition-colors",
        isDarkTheme ? "bg-[#1E1E1E] border-white/10" : "bg-white border-black/10"
      )}>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 border-b text-xs shrink-0 transition-colors",
          isDarkTheme ? "border-white/10 bg-white/5 text-slate-300" : "border-black/10 bg-black/5 text-slate-600"
        )}>
          <Code2 size={14} />
          <select
            value={lang}
            onChange={(e) => updateNote(id, { codeLanguage: e.target.value, showMarkdownPreview: false })}
            className={cn(
              "bg-transparent outline-none cursor-pointer flex-1 appearance-none",
              isDarkTheme ? "text-slate-300 [&>option]:text-slate-800" : "text-slate-600 [&>option]:text-slate-800"
            )}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="json">JSON</option>
            <option value="bash">Bash</option>
            <option value="css">CSS</option>
            <option value="markdown">Markdown</option>
          </select>
          <div className="flex items-center gap-1">
            {lang === 'markdown' && (
              <button
                onClick={(e) => { e.stopPropagation(); updateNote(id, { showMarkdownPreview: !note.showMarkdownPreview }); }}
                className={cn("p-1 rounded transition-colors", isDarkTheme ? "hover:bg-white/10" : "hover:bg-black/10", note.showMarkdownPreview ? "text-sky-400" : "")}
                title={note.showMarkdownPreview ? "Hide preview" : "Show preview"}
              >
                {note.showMarkdownPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); updateNote(id, { codeTheme: isDarkTheme ? 'light' : 'dark' }); }}
              className={cn("p-1 rounded transition-colors", isDarkTheme ? "hover:bg-white/10" : "hover:bg-black/10")}
              title="Toggle theme"
            >
              {isDarkTheme ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); copyToClipboard(); }}
              className={cn("p-1 rounded transition-colors", isDarkTheme ? "hover:bg-white/10" : "hover:bg-black/10")}
              title="Copy code"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar relative" onPointerDown={e => e.stopPropagation()}>
          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: ${isDarkTheme ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
              border-radius: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: ${isDarkTheme ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
            }
            
            ${isDarkTheme ? `
            .token.comment, .token.block-comment, .token.prolog, .token.doctype, .token.cdata { color: #8b949e; }
            .token.punctuation { color: #c9d1d9; }
            .token.tag, .token.attr-name, .token.namespace, .token.deleted { color: #ff7b72; }
            .token.function-name { color: #d2a8ff; }
            .token.boolean, .token.number, .token.function { color: #79c0ff; }
            .token.property, .token.class-name, .token.constant, .token.symbol { color: #ffa657; }
            .token.selector, .token.important, .token.atrule, .token.keyword, .token.builtin { color: #ff7b72; }
            .token.string, .token.char, .token.attr-value, .token.regex, .token.variable { color: #a5d6ff; }
            .token.operator, .token.entity, .token.url { color: #79c0ff; }
            ` : `
            .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #6a737d; }
            .token.punctuation { color: #24292e; }
            .token.namespace { opacity: .7; }
            .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol, .token.deleted { color: #005cc5; }
            .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #032f62; }
            .token.operator, .token.entity, .token.url, .language-css .token.string, .style .token.string { color: #d73a49; }
            .token.atrule, .token.attr-value, .token.keyword { color: #d73a49; }
            .token.function, .token.class-name { color: #6f42c1; }
            .token.regex, .token.important, .token.variable { color: #e36209; }
            `}
          `}</style>
          {lang === 'markdown' && note.showMarkdownPreview ? (
            <div className={cn("p-4 prose prose-sm max-w-none dark:prose-invert pointer-events-auto", isDarkTheme ? "text-slate-200" : "text-slate-800")}>
              <Markdown>{note.content || '*No content*'}</Markdown>
            </div>
          ) : (
            <Editor
              value={note.content || ''}
              onValueChange={(code) => {
                if (code !== note.content) {
                  setTimeout(() => updateNote(id, { content: code }), 0);
                }
              }}
              highlight={(code) => {
                try {
                  return Prism.highlight(code, Prism.languages[lang] || Prism.languages.javascript, lang);
                } catch (e) {
                  return code;
                }
              }}
              padding={16}
              className={cn(
                "font-mono text-[13px] leading-relaxed outline-none min-h-full",
                isDarkTheme ? "text-slate-50" : "text-slate-800"
              )}
              style={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              }}
            />
          )}
        </div>
      </div>
    );
  };

  let transitionClass = "transition-[box-shadow,background-color,border-color,scale,rotate,opacity] duration-200 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]";
  if (isResizing) {
    transitionClass = "transition-[box-shadow,background-color,border-color,opacity]";
  } else if (isMoving || isGroupMoving) {
    transitionClass = "transition-[box-shadow,background-color,border-color,scale,rotate,opacity] duration-[150ms] ease-out"; 
  }

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
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        x: note.x,
        y: note.y,
        rotate: dragRotation,
        backgroundColor: isDefault ? undefined : primaryColor,
        color: textColor,
        zIndex: ((isMoving || isGroupMoving) && !isResizing) ? 50 : note.zIndex,
        width: note.width || 280,
        height: note.height || 'auto',
        minHeight: 140
      }}
      className={cn(
        "absolute top-0 left-0 p-4 cursor-grab active:cursor-grabbing flex flex-col group origin-center connectable isolate",
        transitionClass,
        isDefault ? currentTheme.ui.note.replace(/backdrop-blur-\w+/g, '') : cn(
          "shadow-xl shadow-indigo-900/10 border border-white/30 rounded-3xl",
          themeId === 'luxurious' && "luxurious-glow border-[#d4af37]/20"
        ),
        (isMoving || isGroupMoving) && !isResizing && "shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
      )}
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2 gap-2">
          <input
            type="text"
            value={note.title}
            onChange={(e) => updateNote(id, { title: e.target.value })}
            placeholder="Note title..."
            className={cn(
              "bg-transparent outline-none font-bold text-xs uppercase tracking-tight w-full placeholder:opacity-50",
              isWhiteText ? "placeholder:text-white/50 text-white/60" : isDarkText ? "placeholder:text-black/50 text-black/60" : "placeholder:text-current text-current opacity-80"
            )}
          />
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {note.variant !== 'task' && note.variant !== 'code' && (
              <>
                <motion.button 
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.1)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => updateNote(id, { showTextPreview: !note.showTextPreview })}
                  className="p-1 rounded-md"
                  title="Toggle text preview"
                >
                  <Type size={14} color={textColor} />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.1)" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => updateNote(id, { variant: note.variant === 'nested' ? 'default' : 'nested' })}
                  className="p-1 rounded-md"
                  title="Toggle variant"
                >
                  {note.variant === 'nested' ? <LayoutTemplate size={14} color={textColor} /> : <Layers size={14} color={textColor} />}
                </motion.button>
              </>
            )}
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,0,0,0.15)" }}
              whileTap={{ scale: 0.9 }}
              onClick={() => deleteNote(id)}
              className="p-1 rounded-md text-red-500"
              title="Delete note"
            >
              <Trash2 size={14} color={textColor} />
            </motion.button>
          </div>
        </div>
        
        {note.variant === 'task' ? (
          renderTasks()
        ) : note.variant === 'code' ? (
          renderCodeSnippet()
        ) : (
          <>
            <textarea
              value={note.content}
              onChange={(e) => updateNote(id, { content: e.target.value })}
              placeholder="Drop some hex codes! e.g. #ff0055"
              className={cn(
                "w-full flex-1 bg-transparent outline-none resize-none text-sm font-mono leading-tight placeholder:opacity-50 min-h-[60px] pointer-events-auto",
                isWhiteText ? "placeholder:text-white/50 text-white" : isDarkText ? "placeholder:text-black/50 text-black" : "placeholder:text-current text-current opacity-90"
              )}
            />

            <AnimatePresence mode="popLayout">
              {note.showTextPreview && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-2 mt-2 shrink-0 overflow-hidden pointer-events-auto"
                  key="text-preview"
                >
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      value={note.textPreviewColor || ''}
                      onChange={(e) => updateNote(id, { textPreviewColor: e.target.value })}
                      placeholder="Text color code"
                      className={cn(
                        "w-24 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none rounded px-2 py-1 text-xs font-mono placeholder:opacity-50",
                        isWhiteText ? "text-white placeholder:text-white/50 border-white/20" : isDarkText ? "text-black placeholder:text-black/50 border-black/20" : "text-current placeholder:text-current"
                      )}
                    />
                    <input 
                      type="text"
                      value={note.textPreviewText || ''}
                      onChange={(e) => updateNote(id, { textPreviewText: e.target.value })}
                      placeholder="Sample text..."
                      className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:text-current placeholder:opacity-60"
                      style={{ color: note.textPreviewColor || textColor }}
                    />
                  </div>
                </motion.div>
              )}

              {note.palette.length > 1 && (
                <motion.div
                  key={note.variant === 'nested' ? 'nested-variant' : 'default-variant'}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="w-full shrink-0"
                >
                  {note.variant === 'nested' ? (
                    renderNested(note.palette)
                  ) : (
                    <div className="flex h-8 gap-1 mt-4 rounded-lg overflow-hidden shrink-0">
                      {note.palette.map((c, i) => (
                        <motion.div 
                          key={`${c}-${i}`} 
                          whileHover={{ scale: 1.1, zIndex: 10 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className="flex-1 rounded-sm" 
                          style={{ backgroundColor: c }} 
                          title={c}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            {note.palette.length === 1 && (
              <div className="mt-4 flex items-center gap-2 text-[10px] font-mono opacity-80 shrink-0">
                {note.palette[0].toUpperCase()}
              </div>
            )}
          </>
        )}
      </div>

      {/* Resize Handle */}
      <div 
        className={cn(
          "absolute -right-4 -bottom-4 cursor-se-resize flex items-center justify-center z-[100] transition-opacity pointer-events-auto",
          (isHovered || isMoving || isResizing || isGroupMoving) ? "opacity-100" : "opacity-0"
        )}
        style={{
          width: '40px',
          height: '40px'
        }}
        onPointerDown={handleResizePointerDown}
      >
        <div className={cn(
          "flex items-center justify-center rounded-md p-1 shadow-sm transition-colors",
          isWhiteText ? "bg-white/20 hover:bg-white/30 text-white/70" : isDarkText ? "bg-black/10 hover:bg-black/20 text-black/70" : "bg-black/5 hover:bg-black/10 dark:hover:bg-white/20 dark:bg-white/10 text-black/50 dark:text-white/60"
        )}>
          <Maximize2 size={13} className="rotate-90" />
        </div>
      </div>

      <ConnectionHandle id={id} isHovered={isHovered} />
    </motion.div>
  );
}
