# Groove Scribe

Groove Scribe is an HTML/JS/CSS application for drummers. It acts as both a point-and-click authoring system to create drum sheet music and a practice tool for learning grooves and exercises.

## 🚀 Getting Started (Local Development)

The application has been modernized to use **Vite** as a module bundler and development server, and **Jest** for continuous unit testing.

### Prerequisites
- Node.js (v16+)
- npm

### Installation
1. Clone the repository.
2. Run `npm install` to install the required development dependencies.

### Running the Application (Dev Server)
To run the local development server with hot module replacement (HMR):
```bash
npm run dev
```
Open the provided URL (usually `http://localhost:5173` or `http://localhost:3001`) in your browser to view the application.

### Building for Production
To compile and minify the optimized static assets:
```bash
npm run build
```
The production-ready output will be placed in the `/dist` folder. You can deploy this folder directly to any static file hosting service.

### Running Tests
The project utilizes Jest for unit testing of core calculation algorithms. To run the test suite:
```bash
npm run test
```

***

## 🏗️ Project Architecture

Groove Scribe runs entirely in the browser with no backend dependencies. The logic is divided primarily into two functional areas: **Groove Writer** (authoring) and **Groove Display** (playback and rendering).

### Groove Writer
- Includes all the authoring code and the interactive grid interface.
- Translates interactive grid clicks into an array of notes and time-signatures that can be parsed as music.
- **Key Files**: 
  - `index.html` (Main authoring view)
  - `js/main.js` (System entry ES module)
  - `js/groove_writer.js` (Authoring logic, makes calls to display utilities)

### Groove Display
- The playback engine and sheet music generator. It is designed to run cohesively with the authoring view, or purely separately for embedding drum loops in other applications.
- Turns internal note arrays into **ABC notation** format.
- Translates the ABC notation using `abc2svg` for sheet music SVG rendering.
- Handles audio fallback using `Midi.js` for MIDI compilation and standard playback.
- **Key Files**:
  - `js/groove_utils.js` (Core timing, rendering, and playback functions/utilities)
  - `js/grooves.js` (Static data dictionaries for groove presets)
  - `js/groove_display.js` (Initialization logic for embedding displays)

***

## 🌎 Live Hosted Versions
- [mikeslessons.com/gscribe](http://www.mikeslessons.com/gscribe/)
- [montulli.github.io/GrooveScribe](http://montulli.github.io/GrooveScribe/)

## 📝 Information & Support
- **Author**: Lou Montulli (`lou at montulli dot org`)
- **Issues**: Please file any bugs or feature requests at [GitHub Issues](https://github.com/montulli/GrooveScribe/issues).
