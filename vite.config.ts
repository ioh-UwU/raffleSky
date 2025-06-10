import type {UserConfig} from "vite";

export default {
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
