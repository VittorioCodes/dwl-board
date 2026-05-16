import { create } from 'zustand';
import { db, NoteData, FrameData, ImageData, ConnectorData, DrawingData } from './db';
import { parseColors } from './utils';

export interface Camera {
  x: number;
  y: number;
  z: number;
}

export type ToolType = 'pointer' | 'pen' | 'highlighter';

interface AppState {
  notes: Record<string, NoteData>;
  frames: Record<string, FrameData>;
  images: Record<string, ImageData>;
  connectors: Record<string, ConnectorData>;
  drawings: Record<string, DrawingData>;
  camera: Camera;
  highestZ: number;
  highestZFrame: number;
  movingIds: Set<string>;
  isDarkMode: boolean;
  theme: string;
  linkingFrom: string | null;
  linkingTarget: string | null;
  linkingMousePos: { x: number, y: number } | null;
  
  activeTool: ToolType;
  drawingColor: string;
  drawingSize: number;

  initData: () => Promise<void>;
  setIsDarkMode: (val: boolean) => void;
  setTheme: (val: string) => void;
  setActiveTool: (tool: ToolType) => void;
  setDrawingColor: (color: string) => void;
  setDrawingSize: (size: number) => void;
  setCamera: (updater: Camera | ((prev: Camera) => Camera)) => void;
  setMovingIds: (ids: Set<string>) => void;
  setLinkingFrom: (id: string | null) => void;
  setLinkingTarget: (id: string | null) => void;
  setLinkingMousePos: (pos: { x: number, y: number } | null) => void;
  
  addNote: (x: number, y: number) => Promise<string>;
  addChecklist: (x: number, y: number) => Promise<void>;
  addCodeSnippet: (x: number, y: number) => Promise<void>;
  updateNote: (id: string, updates: Partial<NoteData>, saveToDb?: boolean) => void;
  deleteNote: (id: string) => void;
  
  addImage: (x: number, y: number, url?: string) => Promise<void>;
  updateImage: (id: string, updates: Partial<ImageData>, saveToDb?: boolean) => void;
  deleteImage: (id: string) => void;

  addConnector: (fromId: string, toId: string) => Promise<void>;
  updateConnector: (id: string, updates: Partial<ConnectorData>, saveToDb?: boolean) => void;
  deleteConnector: (id: string) => void;
  deleteConnectorsAttachedTo: (itemId: string) => void;

  addDrawing: (drawing: DrawingData) => Promise<void>;
  updateDrawing: (id: string, updates: Partial<DrawingData>, saveToDb?: boolean) => void;
  deleteDrawing: (id: string) => void;

  bringToFront: (id: string, type: 'note' | 'frame' | 'image' | 'drawing') => void;

  addFrame: (x: number, y: number) => Promise<void>;
  updateFrame: (id: string, updates: Partial<FrameData>, saveToDb?: boolean) => void;
  deleteFrame: (id: string) => void;
  moveFrameGroup: (frameId: string, dx: number, dy: number, childrenNotes: string[], childrenFrames: string[], childrenImages: string[], saveToDb?: boolean) => void;

  exportBoard: () => Promise<string>;
  importBoard: (jsonString: string) => Promise<boolean>;
  getSmallestContainingFrame: (itemX: number, itemY: number, itemW?: number, itemH?: number) => FrameData | null;
}

export const useStore = create<AppState>((set, get) => ({
  notes: {},
  frames: {},
  images: {},
  connectors: {},
  drawings: {},
  camera: { x: 0, y: 0, z: 1 },
  highestZ: 10,
  highestZFrame: 1,
  movingIds: new Set<string>(),
  isDarkMode: false,
  theme: 'default',
  linkingFrom: null,
  linkingTarget: null,
  linkingMousePos: null,
  
  activeTool: 'pointer',
  drawingColor: '#cbd5e1',
  drawingSize: 4,

  setIsDarkMode: (val) => {
    set({ isDarkMode: val });
  },

  setTheme: (val) => {
    set({ theme: val });
  },

  setActiveTool: (tool) => set({ activeTool: tool }),
  setDrawingColor: (color) => set({ drawingColor: color }),
  setDrawingSize: (size) => set({ drawingSize: size }),

  initData: async () => {
    const notesArr = await db.notes.toArray();
    const framesArr = await db.frames.toArray();
    const imagesArr = await db.images.toArray();
    const connectorsArr = await db.connectors.toArray();
    const drawingsArr = await db.drawings.toArray();
    
    let maxZ = 10;
    const notesMap: Record<string, NoteData> = {};
    for (const n of notesArr) {
      notesMap[n.id] = n;
      if (n.zIndex > maxZ) maxZ = n.zIndex;
    }

    const imagesMap: Record<string, ImageData> = {};
    for (const i of imagesArr) {
      imagesMap[i.id] = i;
      if (i.zIndex > maxZ) maxZ = i.zIndex;
    }

    const drawingsMap: Record<string, DrawingData> = {};
    for (const d of drawingsArr) {
      drawingsMap[d.id] = d;
      if (d.zIndex > maxZ) maxZ = d.zIndex;
    }

    let maxZFrame = 1;
    const framesMap: Record<string, FrameData> = {};
    for (const f of framesArr) {
      framesMap[f.id] = f;
      if (f.zIndex > maxZFrame) maxZFrame = f.zIndex;
    }

    const connectorsMap: Record<string, ConnectorData> = {};
    for (const c of connectorsArr) {
      connectorsMap[c.id] = c;
    }

    set({
      notes: notesMap,
      frames: framesMap,
      images: imagesMap,
      connectors: connectorsMap,
      drawings: drawingsMap,
      highestZ: maxZ,
      highestZFrame: maxZFrame
    });
  },

  setCamera: (updater) => {
    set(state => ({
      camera: typeof updater === 'function' ? updater(state.camera) : updater
    }));
  },

  setMovingIds: (ids) => set({ movingIds: ids }),
  setLinkingFrom: (id) => set({ linkingFrom: id }),
  setLinkingTarget: (id) => set({ linkingTarget: id }),
  setLinkingMousePos: (pos) => set({ linkingMousePos: pos }),


  addNote: async (x, y) => {
    const { highestZ } = get();
    const newZ = highestZ + 1;
    
    const newNote: NoteData = {
      id: crypto.randomUUID(),
      x,
      y,
      width: 280,
      height: 140,
      zIndex: newZ,
      title: '',
      content: '',
      palette: [],
      variant: 'default',
      textPreviewColor: '',
      textPreviewText: 'Sample text',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    set(state => ({
      notes: { ...state.notes, [newNote.id]: newNote },
      highestZ: newZ
    }));
    await db.notes.put(newNote);
    return newNote.id;
  },

  addChecklist: async (x, y) => {
    const { highestZ } = get();
    const newZ = highestZ + 1;
    
    const newNote: NoteData = {
      id: crypto.randomUUID(),
      x,
      y,
      width: 280,
      zIndex: newZ,
      title: 'Action Items',
      content: '',
      tasks: [
        { id: crypto.randomUUID(), text: 'New Task', completed: false, priority: 'Med' }
      ],
      palette: [],
      variant: 'task',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    set(state => ({
      notes: { ...state.notes, [newNote.id]: newNote },
      highestZ: newZ
    }));
    await db.notes.put(newNote);
  },

  addCodeSnippet: async (x, y) => {
    const { highestZ } = get();
    const newZ = highestZ + 1;
    
    const newNote: NoteData = {
      id: crypto.randomUUID(),
      x,
      y,
      width: 480,
      height: 320,
      zIndex: newZ,
      title: 'main.ts',
      content: 'console.log("Hello, world!");',
      palette: [],
      variant: 'code',
      codeLanguage: 'typescript',
      codeTheme: 'dark',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    set(state => ({
      notes: { ...state.notes, [newNote.id]: newNote },
      highestZ: newZ
    }));
    await db.notes.put(newNote);
  },

  updateNote: (id, updates, saveToDb = true) => {
    set(state => {
      const existing = state.notes[id];
      if (!existing) return state;

      // Extract colors dynamically if content changed
      let newPalette = existing.palette;
      let safeUpdates = { ...updates };
      
      if (updates.content !== undefined) {
        newPalette = parseColors(updates.content);
        safeUpdates.palette = newPalette;
      }

      const updated = { ...existing, ...safeUpdates, updatedAt: Date.now() };
      if (saveToDb) {
        db.notes.put(updated); // Sync to IndexedDB without awaiting to keep UI responsive
      }
      return { notes: { ...state.notes, [id]: updated } };
    });
  },

  deleteNote: (id) => {
    set(state => {
      const newNotes = { ...state.notes };
      delete newNotes[id];
      db.notes.delete(id);
      return { notes: newNotes };
    });
    get().deleteConnectorsAttachedTo(id);
  },

  addImage: async (x, y, url = '') => {
    const { highestZ } = get();
    const newZ = highestZ + 1;
    
    const newImage: ImageData = {
      id: crypto.randomUUID(),
      x,
      y,
      width: 320,
      height: 240,
      zIndex: newZ,
      url,
      caption: '',
      pinnedToBackground: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    set(state => ({
      images: { ...state.images, [newImage.id]: newImage },
      highestZ: newZ
    }));
    await db.images.put(newImage);
  },

  updateImage: (id, updates, saveToDb = true) => {
    set(state => {
      const existing = state.images[id];
      if (!existing) return state;
      const updated = { ...existing, ...updates, updatedAt: Date.now() };
      if (saveToDb) {
        db.images.put(updated);
      }
      return { images: { ...state.images, [id]: updated } };
    });
  },

  deleteImage: (id) => {
    set(state => {
      const newImages = { ...state.images };
      delete newImages[id];
      db.images.delete(id);
      return { images: newImages };
    });
    get().deleteConnectorsAttachedTo(id);
  },

  addConnector: async (fromId, toId) => {
    const newConnector: ConnectorData = {
      id: crypto.randomUUID(),
      fromId,
      toId,
      createdAt: Date.now()
    };
    set(state => ({
      connectors: { ...state.connectors, [newConnector.id]: newConnector }
    }));
    await db.connectors.put(newConnector);
  },

  deleteConnector: (id) => {
    set(state => {
      const newConnectors = { ...state.connectors };
      delete newConnectors[id];
      db.connectors.delete(id);
      return { connectors: newConnectors };
    });
  },

  updateConnector: (id, updates, saveToDb = true) => {
    set(state => {
      const target = state.connectors[id];
      if (!target) return state;
      const updated = { ...target, ...updates };
      if (saveToDb) {
        db.connectors.put(updated);
      }
      return {
        connectors: { ...state.connectors, [id]: updated }
      };
    });
  },

  deleteConnectorsAttachedTo: (itemId: string) => {
    set(state => {
      const newConnectors = { ...state.connectors };
      let changed = false;
      Object.values(newConnectors).forEach(c => {
        if (c.fromId === itemId || c.toId === itemId) {
          delete newConnectors[c.id];
          db.connectors.delete(c.id);
          changed = true;
        }
      });
      return changed ? { connectors: newConnectors } : state;
    });
  },

  addDrawing: async (drawing) => {
    const { highestZ } = get();
    const newZ = highestZ + 1;
    const newDrawing = { ...drawing, zIndex: newZ, createdAt: Date.now() };

    set(state => ({
      drawings: { ...state.drawings, [newDrawing.id]: newDrawing },
      highestZ: newZ
    }));
    await db.drawings.put(newDrawing);
  },

  updateDrawing: (id, updates, saveToDb = true) => {
    set(state => {
      const existing = state.drawings[id];
      if (!existing) return state;
      const updated = { ...existing, ...updates };
      if (saveToDb) {
        db.drawings.put(updated);
      }
      return { drawings: { ...state.drawings, [id]: updated } };
    });
  },

  deleteDrawing: (id) => {
    set(state => {
      const newDrawings = { ...state.drawings };
      delete newDrawings[id];
      db.drawings.delete(id);
      return { drawings: newDrawings };
    });
  },
  
  bringToFront: (id, type) => {
    set(state => {
      if (type === 'note' && state.notes[id]) {
        const newZ = state.highestZ + 1;
        const updated = { ...state.notes[id], zIndex: newZ };
        db.notes.put(updated);
        return { notes: { ...state.notes, [id]: updated }, highestZ: newZ };
      } else if (type === 'image' && state.images[id]) {
        const newZ = state.highestZ + 1;
        const updated = { ...state.images[id], zIndex: newZ };
        db.images.put(updated);
        return { images: { ...state.images, [id]: updated }, highestZ: newZ };
      } else if (type === 'drawing' && state.drawings[id]) {
        const newZ = state.highestZ + 1;
        const updated = { ...state.drawings[id], zIndex: newZ };
        db.drawings.put(updated);
        return { drawings: { ...state.drawings, [id]: updated }, highestZ: newZ };
      } else if (type === 'frame' && state.frames[id]) {
        const newZ = state.highestZFrame + 1;
        const updated = { ...state.frames[id], zIndex: newZ };
        db.frames.put(updated);
        return { frames: { ...state.frames, [id]: updated }, highestZFrame: newZ };
      }
      return state;
    });
  },

  addFrame: async (x, y) => {
    const { highestZFrame } = get();
    const newZ = highestZFrame + 1;

    const newFrame: FrameData = {
      id: crypto.randomUUID(),
      x,
      y,
      width: 400,
      height: 400,
      zIndex: newZ,
      title: 'New Section',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    set(state => ({ 
      frames: { ...state.frames, [newFrame.id]: newFrame },
      highestZFrame: newZ
    }));
    await db.frames.put(newFrame);
  },

  updateFrame: (id, updates, saveToDb = true) => {
    set(state => {
      const existing = state.frames[id];
      if (!existing) return state;
      const updated = { ...existing, ...updates, updatedAt: Date.now() };
      if (saveToDb) {
        db.frames.put(updated);
      }
      return { frames: { ...state.frames, [id]: updated } };
    });
  },

  deleteFrame: (id) => {
    set(state => {
      const newFrames = { ...state.frames };
      delete newFrames[id];
      db.frames.delete(id);
      return { frames: newFrames };
    });
    get().deleteConnectorsAttachedTo(id);
  },

  moveFrameGroup: (frameId, dx, dy, childrenNotes, childrenFrames, childrenImages, saveToDb = true) => {
    set(state => {
      const frame = state.frames[frameId];
      if (!frame) return state;

      const newFrames = { ...state.frames };
      const newNotes = { ...state.notes };
      const newImages = { ...state.images };

      const updatedFrame = { ...frame, x: frame.x + dx, y: frame.y + dy, updatedAt: Date.now() };
      newFrames[frameId] = updatedFrame;
      if (saveToDb) db.frames.put(updatedFrame);

      for (const cid of childrenFrames) {
        const cf = state.frames[cid];
        if (cf) {
          const updatedCF = { ...cf, x: cf.x + dx, y: cf.y + dy };
          newFrames[cid] = updatedCF;
          if (saveToDb) db.frames.put(updatedCF);
        }
      }

      for (const nid of childrenNotes) {
        const cn = state.notes[nid];
        if (cn) {
          const updatedCN = { ...cn, x: cn.x + dx, y: cn.y + dy };
          newNotes[nid] = updatedCN;
          if (saveToDb) db.notes.put(updatedCN);
        }
      }

      for (const iid of childrenImages) {
        const ci = state.images[iid];
        if (ci) {
          const updatedCI = { ...ci, x: ci.x + dx, y: ci.y + dy };
          newImages[iid] = updatedCI;
          if (saveToDb) db.images.put(updatedCI);
        }
      }

      return { frames: newFrames, notes: newNotes, images: newImages };
    });
  },

  exportBoard: async () => {
    const notes = await db.notes.toArray();
    const frames = await db.frames.toArray();
    const images = await db.images.toArray();
    const connectors = await db.connectors.toArray();
    const drawings = await db.drawings.toArray();
    const data = {
      board: { version: 4, createdAt: Date.now() },
      notes,
      frames,
      images,
      connectors,
      drawings
    };
    return JSON.stringify(data, null, 2);
  },

  importBoard: async (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.board || !data.notes) return false;

      await db.notes.clear();
      await db.frames.clear();
      await db.images.clear();
      await db.connectors.clear();
      await db.drawings.clear();
      
      const notes = data.notes as NoteData[];
      const frames = (data.frames || []) as FrameData[];
      const images = (data.images || []) as ImageData[];
      const connectors = (data.connectors || []) as ConnectorData[];
      const drawings = (data.drawings || []) as DrawingData[];

      await db.notes.bulkAdd(notes);
      await db.frames.bulkAdd(frames);
      await db.images.bulkAdd(images);
      await db.connectors.bulkAdd(connectors);
      await db.drawings.bulkAdd(drawings);

      let maxZ = 10;
      const notesMap: Record<string, NoteData> = {};
      for (const n of notes) {
        notesMap[n.id] = n;
        if (n.zIndex > maxZ) maxZ = n.zIndex;
      }

      const imagesMap: Record<string, ImageData> = {};
      for (const i of images) {
        imagesMap[i.id] = i;
        if (i.zIndex > maxZ) maxZ = i.zIndex;
      }

      const drawingsMap: Record<string, DrawingData> = {};
      for (const d of drawings) {
        drawingsMap[d.id] = d;
        if (d.zIndex > maxZ) maxZ = d.zIndex;
      }

      const framesMap: Record<string, FrameData> = {};
      for (const f of frames) {
        framesMap[f.id] = f;
      }

      const connectorsMap: Record<string, ConnectorData> = {};
      for (const c of connectors) {
        connectorsMap[c.id] = c;
      }

      set({
        notes: notesMap,
        frames: framesMap,
        images: imagesMap,
        connectors: connectorsMap,
        drawings: drawingsMap,
        highestZ: maxZ
      });

      return true;
    } catch (e) {
      console.error("Failed to parse board file:", e);
      return false;
    }
  },

  getSmallestContainingFrame: (itemX: number, itemY: number, itemW: number = 280, itemH: number = 140) => {
    const { frames } = get();
    const cx = itemX + itemW / 2;
    const cy = itemY + itemH / 2;
    
    let smallestFrame: FrameData | null = null;
    let minArea = Infinity;

    Object.values(frames).forEach(f => {
      if (cx >= f.x && cx <= f.x + f.width && cy >= f.y && cy <= f.y + f.height) {
        const area = f.width * f.height;
        if (area < minArea) {
          minArea = area;
          smallestFrame = f;
        }
      }
    });

    return smallestFrame;
  }
}));
