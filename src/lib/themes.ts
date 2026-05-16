export interface ThemeUI {
  toolbar: string;
  sidebar: string;
  sidebarToggle: string;
  note: string;
  frame: string;
  frameHeader: string;
  image: string;
  selector: string;
  selectorMenu: string;
  contextMenu: string;
  connectionLine?: string;
  connectionHover?: string;
  connectionTextFill?: string;
  connectionTextStroke?: string;
}

export interface ThemeConfig {
  name: string;
  colors: string[];
  lightClass?: string;
  darkClass?: string;
  darkOverlay?: string;
  forceDark?: boolean;
  forceLight?: boolean;
  ui: ThemeUI;
}

export const THEMES: Record<string, ThemeConfig> = {
  default: {
    name: 'Default',
    colors: ['#e0e7ff', '#0f172a'],
    lightClass: 'bg-gradient-to-br from-indigo-100 via-white to-sky-50',
    darkClass: 'bg-slate-900',
    darkOverlay: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80 pointer-events-none',
    ui: {
      toolbar: "bg-white/30 dark:bg-slate-800/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-xl shadow-indigo-900/10 dark:shadow-black/30 rounded-2xl",
      sidebar: "bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-slate-200/50 dark:border-white/10",
      sidebarToggle: "bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-l-0 border-slate-200 dark:border-white/10 shadow-lg hover:bg-white/90 dark:hover:bg-slate-700/80 rounded-r-xl",
      note: "backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 border border-white/40 dark:border-white/10 shadow-xl rounded-xl",
      frame: "bg-white/40 dark:bg-slate-800/40 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-2xl",
      frameHeader: "bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-white/40 dark:border-white/10",
      image: "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl rounded-xl",
      selector: "bg-white/20 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl rounded-full text-slate-600 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-slate-700/50",
      selectorMenu: "bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-xl",
      contextMenu: "bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-xl"
    }
  },
  midnight: {
    name: 'Midnight',
    colors: ['#020617', '#1e1b4b'],
    forceDark: true,
    darkClass: 'bg-slate-950',
    darkOverlay: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black opacity-90 pointer-events-none',
    ui: {
      toolbar: "bg-slate-900 border border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)] text-slate-300 rounded-lg",
      sidebar: "bg-slate-950 border-r-4 border-slate-900 text-slate-300",
      sidebarToggle: "bg-slate-900 border-y-2 border-r-2 border-slate-800 shadow-[4px_0_15px_rgb(0,0,0,0.5)] text-slate-400 hover:text-white hover:bg-slate-800 rounded-r-lg",
      note: "bg-slate-900 border-t-2 border-slate-700 shadow-2xl shadow-black/80 text-slate-200 rounded-none",
      frame: "bg-slate-950 border-2 border-slate-800 shadow-inner rounded-none",
      frameHeader: "bg-slate-900 border-r border-b border-slate-800",
      image: "bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 rounded-none",
      selector: "bg-slate-900 border-2 border-slate-800 shadow-xl text-slate-400 hover:text-white hover:bg-slate-800 rounded-md",
      selectorMenu: "bg-slate-900 border-2 border-slate-800 rounded-md",
      contextMenu: "bg-slate-900 border border-slate-800 rounded-md shadow-2xl shadow-black/80",
      connectionLine: "white",
      connectionHover: "hover:stroke-slate-400 hover:stroke-opacity-80"
    }
  },
  cyberpunk: {
    name: 'Cyberpunk',
    colors: ['#4a044e', '#831843'],
    forceDark: true,
    darkClass: 'bg-fuchsia-950',
    darkOverlay: 'bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900 via-fuchsia-950 to-pink-950 opacity-80 pointer-events-none',
    ui: {
      toolbar: "bg-fuchsia-950 border-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)] text-pink-200 rounded-none",
      sidebar: "bg-purple-950 border-r-2 border-pink-500/50 text-pink-200",
      sidebarToggle: "bg-fuchsia-900 border-y-2 border-r-2 border-pink-500 hover:bg-fuchsia-800 text-pink-200 shadow-[4px_0_15px_rgba(236,72,153,0.5)] rounded-none",
      note: "bg-fuchsia-950/90 border-l-4 border-t border-r border-b border-pink-400 shadow-[8px_8px_0_rgba(236,72,153,0.3)] text-fuchsia-100 rounded-sm",
      frame: "bg-purple-950/80 border-2 border-dashed border-fuchsia-500 rounded-none",
      frameHeader: "bg-fuchsia-950 border-r-2 border-b-2 border-pink-500 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.3)]",
      image: "bg-fuchsia-950/90 border-2 border-pink-400 shadow-[8px_8px_0_rgba(236,72,153,0.3)] rounded-sm",
      selector: "bg-fuchsia-900 border-2 border-pink-500 text-pink-200 hover:bg-fuchsia-800 shadow-[0_0_15px_rgba(236,72,153,0.5)] rounded-none",
      selectorMenu: "bg-fuchsia-950 border-2 border-pink-500 rounded-none",
      contextMenu: "bg-fuchsia-950 border-2 border-pink-500 shadow-[8px_8px_0_rgba(236,72,153,0.3)] rounded-sm text-pink-200",
      connectionLine: "#f472b6",
      connectionHover: "hover:stroke-pink-400 hover:stroke-opacity-80"
    }
  },
  forest: {
    name: 'Forest',
    colors: ['#ecfdf5', '#022c22'],
    lightClass: 'bg-green-50',
    darkClass: 'bg-green-950',
    darkOverlay: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900 via-green-950 to-black opacity-80 pointer-events-none',
    ui: {
      toolbar: "bg-emerald-100 dark:bg-emerald-900 border-2 border-emerald-300 dark:border-emerald-700 shadow-lg text-emerald-900 dark:text-emerald-100 rounded-3xl",
      sidebar: "bg-emerald-50 dark:bg-emerald-950 border-r border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100",
      sidebarToggle: "bg-emerald-200 dark:bg-emerald-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-300 dark:hover:bg-emerald-700 text-emerald-900 dark:text-emerald-100 rounded-r-2xl",
      note: "bg-[#fdfbf7] dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 shadow-[4px_4px_10px_rgba(4,120,87,0.1)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.5)] text-emerald-900 dark:text-emerald-100 rounded-2xl",
      frame: "bg-emerald-50/50 dark:bg-green-950/50 border-2 border-emerald-200 dark:border-emerald-800 rounded-3xl",
      frameHeader: "bg-emerald-100 dark:bg-emerald-900 border-r border-b border-emerald-200 dark:border-emerald-800",
      image: "bg-[#fdfbf7] dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 shadow-lg rounded-2xl",
      selector: "bg-emerald-100 dark:bg-emerald-800 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-200 dark:hover:bg-emerald-700 rounded-3xl",
      selectorMenu: "bg-emerald-50 dark:bg-emerald-900 border-2 border-emerald-200 dark:border-emerald-700 rounded-2xl",
      contextMenu: "bg-emerald-50 dark:bg-emerald-900 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl shadow-lg",
      connectionHover: "hover:stroke-emerald-500 hover:stroke-opacity-80"
    }
  },
  lofi: {
    name: 'Lo-Fi',
    colors: ['#FDF6E3', '#E8D4C8'],
    forceLight: true,
    lightClass: 'bg-[#FDF6E3] bg-[url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d9c5b2\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]',
    ui: {
      toolbar: "bg-[#F5E6D3] border-2 border-[#D9C5B2] shadow-[4px_4px_0px_#D9C5B2] text-[#5C4D42] rounded-none",
      sidebar: "bg-[#FDF6E3] border-r-2 border-[#D9C5B2] text-[#5C4D42]",
      sidebarToggle: "bg-[#F5E6D3] border-2 border-l-0 border-[#D9C5B2] shadow-[4px_4px_0px_#D9C5B2] text-[#5C4D42] hover:bg-[#FDF6E3] rounded-r-none rounded-br-lg rounded-tr-lg",
      note: "bg-[#FDF6E3] border-2 border-[#D9C5B2] shadow-[6px_6px_0px_#D9C5B2] text-[#5C4D42] rounded-sm filter sepia-[0.2]",
      frame: "bg-[#F5E6D3]/50 border-2 border-dashed border-[#D9C5B2] rounded-sm",
      frameHeader: "bg-[#FDF6E3] border-r-2 border-b-2 border-[#D9C5B2] text-[#5C4D42]",
      image: "bg-[#FDF6E3] border-2 border-[#D9C5B2] shadow-[6px_6px_0px_#D9C5B2] rounded-sm",
      selector: "bg-[#F5E6D3] border-2 border-[#D9C5B2] shadow-[4px_4px_0px_#D9C5B2] text-[#5C4D42] hover:bg-[#FDF6E3] rounded-none",
      selectorMenu: "bg-[#FDF6E3] border-2 border-[#D9C5B2] shadow-[4px_4px_0px_#D9C5B2] rounded-none",
      contextMenu: "bg-[#FDF6E3] border-2 border-[#D9C5B2] shadow-[4px_4px_0px_#D9C5B2] rounded-none text-[#5C4D42]",
      connectionLine: "#5C4D42",
      connectionHover: "hover:stroke-[#5C4D42] hover:stroke-opacity-50",
      connectionTextFill: "#5C4D42",
      connectionTextStroke: "#FDF6E3"
    }
  },
  luxurious: {
    name: 'Luxurious',
    colors: ['#27272a', '#d4af37'],
    forceDark: true,
    darkClass: 'bg-zinc-950',
    darkOverlay: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black opacity-80 pointer-events-none',
    ui: {
      toolbar: "luxurious-glow bg-gradient-to-r from-zinc-900/95 via-zinc-800/95 to-zinc-900/95 backdrop-blur-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] text-[#d4af37] rounded-xl border border-[#d4af37]/20",
      sidebar: "luxurious-glow bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 backdrop-blur-xl text-[#d4af37] shadow-[5px_0_30px_rgba(212,175,55,0.1)] border-r border-[#d4af37]/20",
      sidebarToggle: "luxurious-glow bg-gradient-to-r from-zinc-900 to-zinc-800 shadow-[4px_0_20px_rgba(212,175,55,0.3)] text-[#d4af37] hover:text-[#f1d570] hover:shadow-[4px_0_30px_rgba(212,175,55,0.5)] rounded-r-2xl border border-l-0 border-[#d4af37]/20",
      note: "luxurious-glow bg-gradient-to-br from-zinc-800/95 via-zinc-900/95 to-zinc-950/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] text-[#f9f6ee] rounded-xl border border-[#d4af37]/20",
      frame: "luxurious-glow bg-zinc-950/60 backdrop-blur-3xl rounded-2xl border border-[#d4af37]/20",
      frameHeader: "luxurious-glow bg-gradient-to-r from-zinc-800/95 to-zinc-900/95 backdrop-blur-xl text-[#d4af37] rounded-tl-xl border-r border-b border-[#d4af37]/20",
      image: "luxurious-glow bg-gradient-to-br from-zinc-800/95 via-zinc-900/95 to-zinc-950/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] rounded-xl border border-[#d4af37]/20",
      selector: "luxurious-glow bg-gradient-to-br from-zinc-800/95 to-zinc-900/95 backdrop-blur-xl shadow-[0_4px_20px_rgba(212,175,55,0.3)] text-[#d4af37] hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] hover:scale-105 rounded-full border border-[#d4af37]/20",
      selectorMenu: "luxurious-glow bg-gradient-to-br from-zinc-900/95 to-zinc-950/95 backdrop-blur-xl rounded-xl text-[#d4af37] shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-[#d4af37]/20",
      contextMenu: "luxurious-glow bg-gradient-to-br from-zinc-900/95 to-zinc-950/95 backdrop-blur-xl rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.2)] text-[#f9f6ee] border border-[#d4af37]/20",
      connectionLine: "#d4af37",
      connectionHover: "hover:stroke-[#f1d570] hover:stroke-opacity-100",
      connectionTextFill: "#d4af37",
      connectionTextStroke: "#18181b"
    }
  }
};
