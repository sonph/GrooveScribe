# Groove Scribe

Groove Scribe is an HTML/JS/CSS application for drummers. It acts as both a point-and-click authoring system to create drum sheet music and a practice tool for learning grooves and exercises.

## 🚀 Getting Started (Local Development)

The codebase is written in **TypeScript** (in `src/`), compiled to JavaScript (in `js/`), and tested with **Jest**.

### Prerequisites
- Node.js (v16+)
- npm
- Python 3 (optional, for local HTTP server)

### Installation
1. Clone the repository.
2. Run `npm install` to install dependencies.

### TypeScript Compilation
TypeScript source files are located in `src/` and compiled to JavaScript in `js/` according to `tsconfig.json`.

- **Build once:**
  ```bash
  npm run build
  ```
- **Watch mode (auto-recompile on change):**
  ```bash
  npm run watch
  ```

### Running the Application (Local Web Server)
Groove Scribe runs statically in the browser:
```bash
npm run serve
```
Or use any static web server (such as `python3 -m http.server 8001` or `npx serve .`).

Then open [http://localhost:8001/](http://localhost:8001/) in your browser.

### Running Tests
The project utilizes Jest for unit testing of core algorithms, URL codecs, MIDI mappings, ABC notation generation, and UI state transformations:
```bash
npm test
```

***

## 🏗️ Project Architecture

Groove Scribe runs entirely in the browser with no backend dependencies. The logic is divided primarily into two functional areas: **Groove Writer** (authoring) and **Groove Display** (playback and rendering).

### Groove Writer
- Includes all the authoring code and the interactive grid interface.
- Translates interactive grid clicks into measures, notes, and time-signatures that can be parsed as music.
- **Key Files**: 
  - `src/groove_writer.ts` (TypeScript authoring logic)
  - `index.html` (Main authoring view)

### Groove Display
- The playback engine and sheet music generator. It is designed to run cohesively with the authoring view, or purely separately for embedding drum loops in other applications.
- Turns internal note arrays into **ABC notation** format.
- Translates the ABC notation using `abc2svg` for sheet music SVG rendering.
- Handles audio fallback using `Midi.js` for MIDI compilation and standard playback.
- **Key Files**:
  - `src/groove_utils.ts` (Core timing, rendering, and playback functions/utilities)
  - `js/groove_display.js` (Initialization logic for embedding displays)

***

## 🌎 Live Hosted Versions
- [mikeslessons.com/gscribe](http://www.mikeslessons.com/gscribe/)
- [montulli.github.io/GrooveScribe](http://montulli.github.io/GrooveScribe/)

## 📝 Information & Support
- **Author**: Lou Montulli (`lou at montulli dot org`)
- **Issues**: Please file any bugs or feature requests at [GitHub Issues](https://github.com/montulli/GrooveScribe/issues).
