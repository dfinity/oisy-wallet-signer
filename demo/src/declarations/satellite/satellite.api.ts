// This file was automatically generated by the Juno CLI.
// Any modifications may be overwritten.

import type {_SERVICE as SatelliteActor, MetadataValue} from './satellite.did';
import {idlFactory} from './satellite.factory.did.js';
import {getSatelliteExtendedActor} from '@junobuild/core';

export const buildVersion = async (): Promise<string> => {
	const {build_version} = await getSatelliteExtendedActor<SatelliteActor>({
		idlFactory
	});

	return await build_version();
}

export const icrc1Metadata = async (): Promise<Array> => {
	const {icrc1_metadata} = await getSatelliteExtendedActor<SatelliteActor>({
		idlFactory
	});

	return await icrc1_metadata();
}