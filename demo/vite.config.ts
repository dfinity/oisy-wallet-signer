import { sveltekit } from '@sveltejs/kit/vite';
import { loadEnv, type UserConfig } from 'vite';
import environment from 'vite-plugin-environment';

export const defineConfig = ({ port }: { port?: number } = {}): UserConfig => {
	process.env = {
		...process.env,
		...loadEnv('development', '../../', 'CANISTER_'),
		...loadEnv('development', '../../', 'DFX_')
	};

	return {
		build: {
			emptyOutDir: true
		},
		plugins: [
			sveltekit(),
			environment('all', { prefix: 'CANISTER_', defineOn: 'import.meta.env' }),
			environment('all', { prefix: 'DFX_', defineOn: 'import.meta.env' })
		],
		server: {
			...(port !== undefined && { port }),
			proxy: {
				'/api': 'http://localhost:4943'
			}
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
