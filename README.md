# ScribrEngine

Scribr Engine is a web-based tool for building interactive gamebook-style stories with branching paths, stats, and dice-driven outcomes.

## Features

- **Node-Based Editor**: Visual story editor with drag-and-drop nodes for creating branching narratives
- **Multiple Node Types**: 
  - Text nodes for narrative content
  - Choice nodes for player decisions
  - Dice nodes for skill checks and random outcomes
- **3D Book Interface**: Immersive gameplay experience with page-turning animations
- **Custom Variables**: Track player stats, inventory, and story progress
- **Physical Dice Rolls**: Interactive dice mechanics for in-game checks

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JacopoColangelo/ScribrEngine.git
   cd ScribrEngine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start the development server:
```bash
npm run dev
```

The application will automatically open in your default browser at `http://localhost:5173/`

### Building for Production

To create a production build:
```bash
npm run build
```

The built files will be in the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

## Usage

1. **Editor Mode**: Create your story using the node-based editor
   - Add nodes by clicking the "+" buttons in the toolbar
   - Connect nodes by dragging from output handles to input handles
   - Edit node properties in the sidebar
   - Toggle grid and snap-to-grid for precise positioning

2. **Play Mode**: Test your story by clicking the "Play" button
   - Navigate through your story using the 3D book interface
   - Make choices and roll dice as defined in your nodes
   - Track variables and story progress

## License

MIT License - see [LICENSE](LICENSE) file for details