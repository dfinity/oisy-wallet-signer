import { defineConfig } from 'vite';
import { defineConfig as defineConfigSigner } from '../../vite.config';

export default defineConfig(defineConfigSigner({ port: 5174 }));
