import juno from '@junobuild/vite-plugin';
import inject from '@rollup/plugin-inject';
import { sveltekit } from '@sveltejs/kit/vite';
import { type UserConfig } from 'vite';

export const defineConfig = ({ port }: { port?: number } = {}): UserConfig => {
	return {
		build: {
			emptyOutDir: true,
			rollupOptions: {
				plugins: [
					inject({
						modules: { Buffer: ['buffer', 'Buffer'] }
					})
				]
			}
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
