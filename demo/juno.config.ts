import {defineConfig} from '@junobuild/config';

export default defineConfig({
  satellite: {
    ids: {
      development: 'jx5yt-yyaaa-aaaal-abzbq-cai',
    },
    source: 'build',
  },
	emulator: {
		satellite: {}
	}
});
