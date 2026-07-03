import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GHP_BASE is set by the GitHub Actions workflow:
//   "/<repo-name>/" for project pages, "/" for <user>.github.io repos.
// Locally it defaults to "/".
export default defineConfig({
  base: process.env.GHP_BASE || "/",
  plugins: [react()],
});
