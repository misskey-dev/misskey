import define from '../define.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { DriveFiles } from '@/models/index.js';

export const meta = {
	tags: ['drive', 'account'],

	requireCredential: true,

	kind: 'read:drive',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			capacity: {
				type: 'number',
				optional: false, nullable: false,
			},
			usage: {
				type: 'number',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const instance = await fetchMeta(true);

	// Calculate drive usage
	const usage = await DriveFiles.calcDriveUsageOf(user.id);

	return {
		capacity: 1024 * 1024 * instance.localDriveCapacityMb,
		usage: usage,
	};
});
