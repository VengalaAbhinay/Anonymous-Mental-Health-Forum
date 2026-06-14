import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/user-api": "http://localhost:8000",
      "/post-api": "http://localhost:8000",
      "/admin-api": "http://localhost:8000",
      "/report-api": "http://localhost:8000",
      "/mood-api": "http://localhost:8000",
      "/resource-api": "http://localhost:8000",
      "/counselor-api": "http://localhost:8000",
      "/chat-api": "http://localhost:8000",
      "/socket.io": { target: "http://localhost:8000", ws: true },
    },
  },
});
