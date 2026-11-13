// Copies the QR reader's WebAssembly engine into public/ so the app serves it itself
// (no third-party CDN). Runs before `dev` and `build`; the copy is git-ignored.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public/zxing", { recursive: true });
copyFileSync("node_modules/zxing-wasm/dist/reader/zxing_reader.wasm", "public/zxing/zxing_reader.wasm");
