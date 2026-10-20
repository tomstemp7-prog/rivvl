// MapLibre runs map work in a web worker that it loads from a URL. Next bundles
// MapLibre's main script, so the worker isn't where MapLibre expects it: copy the
// installed version's worker files into public/ (runs before dev and build).
import { copyFile, mkdir } from "node:fs/promises";

const from = new URL("../node_modules/maplibre-gl/dist/", import.meta.url);
const to = new URL("../public/maplibre/", import.meta.url);
await mkdir(to, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  await copyFile(new URL(file, from), new URL(file, to));
}
