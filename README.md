# Geo-Dashboard
#### A Next.js timeline dashboard with an interactive map, real-time data visualization, and dynamic polygon coloring.

## Initial Setup

### 1. Create a new Next.js project with TypeScript

```shellscript
npx create-next-app@latest geo-dashboard --typescript --eslint --tailwind --app
```

### 2. Navigate to the project directory

```shellscript
cd geo-dashboard
```

## Install Required Dependencies

### Core Mapping Libraries 🌍
#### These are essential for the map functionality.
```shellscript
# Install Leaflet for interactive maps
npm install leaflet @types/leaflet

# Install the Leaflet.draw plugin for drawing polygons
npm install leaflet-draw @types/leaflet-draw

# Note: You may also need to install the CSS for these libraries
# either through a package or by importing the CSS files.
```

### Core UI Components (shadcn/ui)

```shellscript
# Initialize shadcn/ui
npx shadcn@latest init

# Install required UI components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add switch
npx shadcn@latest add badge
npx shadcn@latest add dialog
```

### Additional Dependencies

```shellscript
# Install Lucide React for icons (if not already included)
npm install lucide-react

# Install React hooks for advanced state management
npm install react
```

## Project Structure Setup

After installation, your project structure should look like this:

```plaintext
geo-dashboard/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── map/
│   │   ├── data-source-dialog.tsx
│   │   ├── map-controls.tsx
│   │   ├── map-header.tsx
│   │   ├── map-status.tsx
│   │   └── polygon-list.tsx
│   ├── timeline-slider.tsx
│   ├── interactive-map.tsx
│   └── data-sidebar.tsx
├── hooks/
│   ├── use-leaflet.ts
│   └── use-polygon-drawing.ts
├── lib/
│   ├── utils.ts                 # shadcn/ui utilities
│   ├── open-meteo.ts
│   └── polygon-data-service.ts
├── package.json
└── tailwind.config.ts

```

## ‍️ Running the Project

### Development Mode

```shellscript
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```shellscript
# Build for production
npm run build

# Start production server
npm run start


That's it! After running these commands, you'll have a fully functional timeline dashboard with interactive maps, data visualization, and real-time polygon coloring. 🎉

```
### Output

<img width="1916" height="964" alt="image" src="https://github.com/user-attachments/assets/7875a33d-467e-4fbf-979c-b8e9bec935dc" />


<img width="1914" height="960" alt="image" src="https://github.com/user-attachments/assets/d2abadcc-da88-48c0-82ff-e796d068685f" />


<img width="1918" height="840" alt="image" src="https://github.com/user-attachments/assets/dbdb0de6-f684-4669-ae5f-9d65d3d74b70" />


<img width="1919" height="852" alt="image" src="https://github.com/user-attachments/assets/6f04b3dc-57d1-417f-8b66-79ce49fb24d0" />


