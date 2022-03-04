import define from '../../define.js';
import { Channels } from '@/models/index.js';

export const meta = {
	tags: ['channels'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Channel',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const query = Channels.createQueryBuilder('channel')
		.where('channel.lastNotedAt IS NOT NULL')
		.orderBy('channel.lastNotedAt', 'DESC');

	const channels = await query.take(10).getMany();

	return await Promise.all(channels.map(x => Channels.pack(x, me)));
});
