import React, { useEffect, useRef, useState } from "react";
import { useStore } from "../lib/store";
import { NoteNode } from "./NoteNode";
import { FrameNode } from "./FrameNode";
import { ImageNode } from "./ImageNode";
import { ConnectorsOverlay } from "./ConnectorsOverlay";
import { DrawingNode } from "./DrawingLayer";
import { AnimatePresence } from "motion/react";
import { DrawingData } from "../lib/db";

export function Canvas({ isDarkMode }: { isDarkMode?: boolean }) {
  const { notes, frames, images, drawings, camera, setCamera, addNote, activeTool, drawingColor, drawingSize, addDrawing, highestZ } = useStore(state => state);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inProgressDrawing, setInProgressDrawing] = useState<DrawingData | null>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const el = containerRef.current;
      if (!el) return;

      const zoomDelta = Math.exp(-e.deltaY * 0.002);
      const rect = el.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      setCamera(cam => {
        const newZ = Math.max(0.1, Math.min(5, cam.z * zoomDelta));
        const scaleChange = newZ - cam.z;
        
        const newX = cam.x - (centerX - cam.x) * (scaleChange / cam.z);
        const newY = cam.y - (centerY - cam.y) * (scaleChange / cam.z);

        return { x: newX, y: newY, z: newZ };
      });
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (el) el.removeEventListener('wheel', handleWheel);
    };
  }, [setCamera]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.target !== containerRef.current) return;
    if (e.button !== 0 && e.button !== 1) return; // allow left or middle click to pan

    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);

    if (e.button === 1 || (e.button === 0 && activeTool === 'pointer')) {
      let startX = e.clientX;
      let startY = e.clientY;

      const onPointerMove = (moveEvt: PointerEvent) => {
        const dx = moveEvt.clientX - startX;
        const dy = moveEvt.clientY - startY;
        startX = moveEvt.clientX;
        startY = moveEvt.clientY;
        setCamera(cam => ({ ...cam, x: cam.x + dx, y: cam.y + dy }));
      };

      const onPointerUp = (upEvt: PointerEvent) => {
        el.releasePointerCapture(upEvt.pointerId);
        el.removeEventListener('pointermove', onPointerMove);
        el.removeEventListener('pointerup', onPointerUp);
      };

      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerup', onPointerUp);
    } else if (e.button === 0 && (activeTool === 'pen' || activeTool === 'highlighter')) {
      const rect = el.getBoundingClientRect();
      const getSvgPoint = (evt: PointerEvent) => {
        return {
          x: (evt.clientX - rect.left - camera.x) / camera.z,
          y: (evt.clientY - rect.top - camera.y) / camera.z,
          pressure: evt.pressure
        };
      };

      const startPoint = getSvgPoint(e.nativeEvent as PointerEvent);
      
      const newDrawing: DrawingData = {
        id: crypto.randomUUID(),
        tool: activeTool,
        color: drawingColor,
        size: drawingSize,
        points: [startPoint],
        zIndex: highestZ + 1,
        createdAt: Date.now()
      };

      setInProgressDrawing(newDrawing);

      const onPointerMove = (moveEvt: PointerEvent) => {
        if (moveEvt.buttons !== 1) return; // ensure left click is held
        const pt = getSvgPoint(moveEvt);
        setInProgressDrawing(prev => prev ? { ...prev, points: [...prev.points, pt] } : null);
      };

      const onPointerUp = (upEvt: PointerEvent) => {
        el.releasePointerCapture(upEvt.pointerId);
        el.removeEventListener('pointermove', onPointerMove);
        el.removeEventListener('pointerup', onPointerUp);
        
        setInProgressDrawing(prev => {
          if (prev && prev.points.length > 2) {
            addDrawing(prev);
          }
          return null;
        });
      };

      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerup', onPointerUp);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current) return;
    const x = (e.clientX - camera.x) / camera.z;
    const y = (e.clientY - camera.y) / camera.z;
    addNote(x, y);
  };

  const hiddenNoteIds = new Set<string>();
  Object.values(frames).forEach(frame => {
    if (frame.collapsed) {
      Object.values(notes).forEach(note => {
        const w = typeof note.width === 'number' ? note.width : 280;
        const h = typeof note.height === 'number' ? note.height : 140;
        const cx = note.x + w / 2;
        const cy = note.y + h / 2;
        if (cx >= frame.x && cx <= frame.x + frame.width && cy >= frame.y && cy <= frame.y + frame.height) {
          hiddenNoteIds.add(note.id);
        }
      });
    }
  });

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Infinite Grid Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <pattern 
          id="grid" 
          width={32 * camera.z} 
          height={32 * camera.z} 
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${camera.x}, ${camera.y})`}
        >
          <circle cx={1.5 * camera.z} cy={1.5 * camera.z} r={1.5 * Math.max(0.2, camera.z)} fill={isDarkMode ? "#334155" : "#cbd5e1"} />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" style={{ opacity: 0.4 }} />
      </svg>

      <div 
        className="absolute inset-0 origin-top-left pointer-events-none canvas-content"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})`,
        }}
      >
        <div className="absolute top-0 left-0 w-0 h-0 pointer-events-auto">
          <AnimatePresence>
            {Object.values(drawings).map(drawing => (
              <DrawingNode key={drawing.id} drawing={drawing} />
            ))}
            {inProgressDrawing && <DrawingNode key="in-progress" drawing={inProgressDrawing} />}
            {Object.values(images).map(image => (
              <ImageNode key={image.id} id={image.id} image={image} />
            ))}
            {Object.values(frames).map(frame => (
              <FrameNode key={frame.id} id={frame.id} frame={frame} />
            ))}
            {Object.values(notes).map(note => {
              if (hiddenNoteIds.has(note.id)) return null;
              return <NoteNode key={note.id} id={note.id} note={note} />;
            })}
          </AnimatePresence>
          <ConnectorsOverlay />
        </div>
      </div>
    </div>
  );
}
