import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron/simple';
import pkg from './package.json';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ command }) => {
    fs.rmSync('dist', { recursive: true, force: true });
    const isServe = command === 'serve';
    const isBuild = command === 'build';
    const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

    return {
        plugins: [
            vue(),
            tsConfigPaths(),
            electron({
                main: {
                    entry: 'src/main/main.ts',
                    vite: {
                        build: {
                            sourcemap,
                            minify: isBuild,
                            outDir: 'dist/main',
                            rollupOptions: {
                                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                            },
                        },
                        resolve: {
                            alias: {
                                "@main": path.resolve("src/main"),
                                "electron/main": "electron",
                                "electron/common": "electron",
                                "electorn/renderer": "electron",
                            }
                        }
                    },
                },
                preload: {
                    input: 'src/preload/preload.ts',
                    vite: {
                        build: {
                            sourcemap: sourcemap ? 'inline' : undefined,
                            minify: isBuild,
                            outDir: 'dist/preload',
                            rollupOptions: {
                                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                            },
                        },
                    },
                },
                renderer: {},
            }),
        ],
        server:
            process.env.VSCODE_DEBUG &&
            (() => {
                const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
                return {
                    host: url.hostname,
                    port: +url.port,
                };
            })(),
        clearScreen: false,
        resolve: {
            alias: {
                '@renderer': path.resolve("src/renderer"),
            }
        },
    };
});
