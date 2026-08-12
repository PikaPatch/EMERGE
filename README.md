# EMERGE

**EMERGE** — cEll Morphology and gene Expression for embRyoGEnesis [web:11]

EMERGE is an interactive web database and visualization platform for exploring cell morphology and gene expression data during embryogenesis. It provides tools to browse embryonic cell lineage trees, inspect 3D cell/embryo models, view gene expression patterns, and explore cell contact networks across developmental stages.

## Features

- **Lineage Tree Explorer** — interactive cell lineage tree visualization to trace cell divisions and fates across embryogenesis.
- **3D Embryo/Cell Morphology Viewer** — three.js/WebGL-based 3D rendering of embryo and cell models for spatial exploration.
- **Cell Contact Network** — graph-based visualization of cell-cell contact relationships at different developmental stages.
- **Browse & Search** — query and filter the underlying gene expression and morphology database.
- **Data Download** — export datasets for offline analysis.

## What technologies are used for this project?

This project is built with:

- **Vite** — build tool and dev server
- **TypeScript** — type-safe application code
- **React** — UI framework
- **shadcn-ui** — accessible, composable UI component library
- **Tailwind CSS** — utility-first CSS styling

Additional key libraries power the platform's data and visualization layers:

| Purpose | Libraries |
|---|---|
| 3D rendering | three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing |
| Data visualization | D3.js, d3-cloud, react-d3-tree, Recharts |
| Database | sql.js, sqlite3, better-sqlite3 |
| Routing & state | react-router-dom, @tanstack/react-query |
| Forms & validation | react-hook-form, zod |
| Utilities | date-fns, jszip, lucide-react icons |

## How to deploy

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone https://github.com/PikaPatch/EMERGE.git

# Step 2: Navigate to the project directory.
cd EMERGE

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

### Other available scripts

```sh
npm run build       # Production build
npm run build:dev   # Development-mode build
npm run preview      # Preview the production build locally
npm run lint         # Run ESLint checks
```

### Requirements

- Node.js (LTS recommended) and npm, or Bun (a `bun.lockb` lockfile is included as an alternative package manager option)

## License

Refer to the repository for license details, or contact the repository owner for usage terms.
