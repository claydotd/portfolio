import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  base: "/claydleslie.github.io/",
  server: {
    port: 5173
  }
});
