# Portfolio Site (React + TypeScript)

This is a starter template for your personal portfolio built with **React**, **TypeScript**, and **Vite**. It includes:

- A homepage with a hero section, projects, and contact area
- An about page
- A top navigation bar using **React Router**
- Simple, modern styling you can customize

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the dev server**

   ```bash
   npm run dev
   ```

3. Open the printed URL (usually `http://localhost:5173`) in your browser.

## Project structure

- `index.html` – HTML entry
- `src/main.tsx` – React entry, sets up the router
- `src/App.tsx` – Defines routes and wraps pages in the layout
- `src/components/Layout.tsx` – Header, navigation, and footer
- `src/pages/Home.tsx` – Homepage content
- `src/pages/About.tsx` – About page content
- `src/styles.css` – Global styles and layout

## Adding a new page

1. **Create a page component**, e.g. `src/pages/Projects.tsx`:

   ```tsx
   export const Projects = () => {
     return (
       <section className="page">
         <h1>Projects</h1>
         <p className="section-subtitle">Describe or list your projects here.</p>
       </section>
     );
   };
   ```

2. **Register the route** in `src/App.tsx`:

   ```tsx
   import { Projects } from "./pages/Projects";

   // inside <Routes>:
   <Route path="/projects" element={<Projects />} />
   ```

3. **Add a navigation link** in `src/components/Layout.tsx`:

   ```tsx
   <NavLink
     to="/projects"
     className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
   >
     Projects
   </NavLink>
   ```

Now you can visit `/projects` in the browser.

## Customizing

- Update text in `Home.tsx` and `About.tsx` with your own story and links.
- Adjust colors and spacing in `src/styles.css`.
- Add more sections or components under `src/components`.

