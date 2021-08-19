import define from '../define.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { DriveFiles } from '@/models/index.js';

export const meta = {
	tags: ['drive', 'account'],

	requireCredential: true as const,

	kind: 'read:drive',

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			capacity: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
			},
			usage: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
			}
		}
	}
};

export default define(meta, async (ps, user) => {
	const instance = await fetchMeta(true);

	// Calculate drive usage
	const usage = await DriveFiles.calcDriveUsageOf(user.id);

	return {
		capacity: 1024 * 1024 * instance.localDriveCapacityMb,
		usage: usage
	};
});
