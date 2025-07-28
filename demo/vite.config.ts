import juno from '@junobuild/vite-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import type { UserConfig } from 'vite';

export const defineConfig = ({ port }: { port?: number } = {}): UserConfig => ({
	envDir: __dirname,
	build: {
		emptyOutDir: true
	},
	plugins: [sveltekit(), juno({ container: true }), tailwindcss()],
	server: {
		...(port !== undefined && { port })
	},
	optimizeDeps: {
		esbuildOptions: {
			define: {
				global: 'globalThis'
			}
		}
	},
	worker: {
		format: 'es'
	}
});
