import React from 'react';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';

export function ConnectionHandle({ id, isHovered, collapsed }: { id: string, isHovered: boolean, collapsed?: boolean }) {
  const { setLinkingFrom, setLinkingTarget, setLinkingMousePos, addConnector, camera, linkingFrom, isDarkMode } = useStore(state => state);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    setLinkingFrom(id);
    
    const clickWorldX = (e.clientX - camera.x) / camera.z;
    const clickWorldY = (e.clientY - camera.y) / camera.z;
    setLinkingMousePos({ x: clickWorldX, y: clickWorldY });

    const onPointerMove = (moveEvt: PointerEvent) => {
      const wX = (moveEvt.clientX - useStore.getState().camera.x) / useStore.getState().camera.z;
      const wY = (moveEvt.clientY - useStore.getState().camera.y) / useStore.getState().camera.z;
      
      // Update mouse pos
      useStore.getState().setLinkingMousePos({ x: wX, y: wY });

      // Find if we are over a connectable target using bounding client rects.
      // This is necessary because some connectable elements (like frames) may have
      // pointer-events: none on their main container, meaning elementsFromPoint won't hit them.
      const connectables = Array.from(document.querySelectorAll('.connectable')).filter(el => el.getAttribute('data-id') !== id);
      
      let bestTarget = null;
      let minArea = Infinity;

      for (const el of connectables) {
        const rect = el.getBoundingClientRect();
        if (moveEvt.clientX >= rect.left && moveEvt.clientX <= rect.right && moveEvt.clientY >= rect.top && moveEvt.clientY <= rect.bottom) {
          const area = rect.width * rect.height;
          // Prefer smaller targets (e.g. nested children over their parent container)
          if (area < minArea) {
            minArea = area;
            bestTarget = el;
          }
        }
      }
      
      const targetEl = bestTarget;
      
      if (targetEl) {
        const targetId = targetEl.getAttribute('data-id');
        useStore.getState().setLinkingTarget(targetId);
      } else {
        useStore.getState().setLinkingTarget(null);
      }
    };

    const onPointerUp = async (upEvt: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      
      const st = useStore.getState();
      if (st.linkingTarget && st.linkingTarget !== id) {
        await st.addConnector(id, st.linkingTarget);
      }
      
      st.setLinkingFrom(null);
      st.setLinkingTarget(null);
      st.setLinkingMousePos(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const isLinking = linkingFrom === id;

  return (
    <div
      className={cn(
        "absolute flex items-center justify-center z-[110] transition-opacity cursor-crosshair pointer-events-auto",
        collapsed ? "right-[15px] top-1/2 -translate-y-1/2" : "-right-4 top-1/2 -translate-y-1/2",
        (isHovered || isLinking) ? "opacity-100" : "opacity-0"
      )}
      style={{ width: '32px', height: '32px' }}
      onPointerDown={handlePointerDown}
    >
      <div className={cn(
        "flex items-center justify-center backdrop-blur-md rounded-full shadow-sm transition-colors border",
        isDarkMode ? "bg-white/10 hover:bg-white/20 border-white/20 text-white" : "bg-white/80 hover:bg-white border-black/10 text-slate-700",
        isLinking && "bg-blue-500 text-white border-blue-600 ring-2 ring-blue-300"
      )}>
        <div className="w-2.5 h-2.5 rounded-full bg-current m-1.5" />
      </div>
    </div>
  );
}
