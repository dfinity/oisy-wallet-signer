import juno from '@junobuild/vite-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import { type UserConfig } from 'vite';

export const defineConfig = ({ port }: { port?: number } = {}): UserConfig => {
	return {
		build: {
			emptyOutDir: true
		},
		plugins: [sveltekit(), juno({ container: true })],
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
	};
};
