import { defineDevConfig } from '@junobuild/config';

/** @type {import('@junobuild/config').JunoDevConfig} */
export default defineDevConfig(() => ({
	satellite: {
		collections: {
			datastore: [],
			storage: []
		}
	}
}));
