import { UserIps } from '@/models/index.js';
import define from '../../define.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const ips = await UserIps.find({
		where: { userId: ps.userId },
		order: { createdAt: 'DESC' },
		take: 30,
	});

	return ips.map(x => ({
		ip: x.ip,
		createdAt: x.createdAt.toISOString(),
	}));
});
