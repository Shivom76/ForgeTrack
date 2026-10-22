import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // If 5173 is taken (e.g. your old client is still running) FAIL instead of
    // silently moving to another port. A different port would be blocked by the
    // API's CORS setting and look like a login bug.
    strictPort: true,
  },
});
