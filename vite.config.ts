import type {UserConfig} from "vite";

export default {
    root: "src",
    build: {
        emptyOutDir: false,
        rollupOptions: {
            output: {
                entryFileNames: `assets/[name].js`,
                chunkFileNames: `assets/[name].js`,
                assetFileNames: `assets/[name].[ext]`
            }
        }
    }
} satisfies UserConfig;
