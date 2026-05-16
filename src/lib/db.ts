import Dexie, { type Table } from 'dexie';

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'Low' | 'Med' | 'High';
}

export interface NoteData {
  id: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  zIndex: number;
  title: string;
  content: string;
  palette: string[];
  textPreviewColor?: string;
  textPreviewText?: string;
  showTextPreview?: boolean;
  variant?: 'default' | 'nested' | 'task' | 'code';
  tasks?: TaskItem[];
  codeLanguage?: string;
  codeTheme?: 'light' | 'dark';
  showMarkdownPreview?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface FrameData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  title: string;
  collapsed?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ImageData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  url: string;
  caption: string;
  pinnedToBackground?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ConnectorData {
  id: string;
  fromId: string;
  toId: string;
  style?: 'solid' | 'dashed' | 'dotted' | 'long-dashed' | 'mixed';
  label?: string;
  createdAt: number;
}

export interface DrawingData {
  id: string;
  points: { x: number; y: number; pressure?: number }[];
  tool: 'pen' | 'highlighter';
  color: string;
  size: number;
  zIndex: number;
  createdAt: number;
}

export class ColorBoardDB extends Dexie {
  notes!: Table<NoteData, string>;
  frames!: Table<FrameData, string>;
  images!: Table<ImageData, string>;
  connectors!: Table<ConnectorData, string>;
  drawings!: Table<DrawingData, string>;

  constructor() {
    super('ColorBoardDB');
    this.version(1).stores({
      notes: 'id, x, y, zIndex',
      frames: 'id, x, y, zIndex'
    });
    this.version(2).stores({
      notes: 'id, x, y, zIndex',
      frames: 'id, x, y, zIndex',
      images: 'id, x, y, zIndex' // Add images table in v2
    });
    this.version(3).stores({
      notes: 'id, x, y, zIndex',
      frames: 'id, x, y, zIndex',
      images: 'id, x, y, zIndex',
      connectors: 'id, fromId, toId'
    });
    this.version(4).stores({
      notes: 'id, x, y, zIndex',
      frames: 'id, x, y, zIndex',
      images: 'id, x, y, zIndex',
      connectors: 'id, fromId, toId',
      drawings: 'id, zIndex'
    });
  }
}

export const db = new ColorBoardDB();
