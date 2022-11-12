import define from '../../../define.js';
import { createCleanRemoteFilesJob } from '@/queue/index.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	createCleanRemoteFilesJob();
});
