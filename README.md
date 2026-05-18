# DWL Board - Don't Want to Login Board

DWL Board is a powerful, serverless, infinite-canvas workspace designed for ideation, organization, and visual collaboration. Built with modern web technologies, it provides a flexible environment to bring your ideas to life through notes, code snippets, checklists, and images.
I've created this project because I didn't want to login or buy a premium subscription to basically use a whiteboard to my liking.

Created by **[VittorioCodes](https://github.com/vittoriocodes)**.

## ✨ Features

- **Infinite Canvas**: Unrestricted space to brainstorm and organize. Pan, zoom, and navigate freely across your workspace.
- **Rich Node Types**:
  - **Notes**: Standard text notes for quick thoughts. Customize colors and text previews.
  - **Checklists**: Interactive to-do lists to track progress.
  - **Code Snippets**: Syntax-highlighted code blocks with easy editing.
  - **Images**: Seamlessly integrate visual assets via URL or local upload.
- **Sections (Frames)**: Group related nodes together within collapsible, resizable containers to keep your board structured.
- **Connectors / Relationships**: Draw relationship lines between different nodes to map out workflows, architectures, or mind maps.
- **Multiple Themes**: Switch between carefully crafted aesthetics including Light, Dark, and a special "Luxurious" theme.
- **Local & Serverless**: All data lives locally in your browser/memory. No backend required, ensuring complete privacy and fast startup.
- **Export & Import**:
  - Export your entire project as a portable `.json` file to back up or share your work.
  - Take high-quality screenshots (PNG with transparent or solid color backgrounds).
  - Export your board directly to PDF.
  - Import previously saved `.json` projects seamlessly.

## 🛠️ Tech Stack

- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Export Utilities**: `html-to-image`, `jspdf`

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vittoriocodes/dwl-board.git
   ```

2. Navigate to the project directory:
   ```bash
   cd dwl-board
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:3000` or `http://localhost:5173`).

## 💡 Usage Guide

- **Toolbar Navigation**: Use the bottom toolbar to switch between the Pointer (Select), Pen (Draw), and Highlighter tools.
- **Adding Content**: Click the specific `+` icons to add new Notes, Checklists, Code Snippets, Sections (Frames), or Images to your board.
- **Connecting Nodes**: Hover over any node to reveal the connection handle on the right edge. Click and drag the handle to another node to establish a connecting line.
- **Exporting (Crucial)**: Because DWL Board is completely serverless, **it is highly recommended to export your project regularly** via the `Export` menu in the toolbar to prevent unexpected data loss.
- **Customizing Nodes**: Use the context menus and inline controls on individual notes to change their appearance, toggle modes, or to duplicate/delete them.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📝 License

This project is open-source and available under the terms of the MIT License.
