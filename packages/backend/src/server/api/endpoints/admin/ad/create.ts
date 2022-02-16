import $ from 'cafy';
import define from '../../../define';
import { Ads } from '@/models/index';
import { genId } from '@/misc/gen-id';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		type: 'object',
		properties: {
			url: { type: 'string', minLength: 1, },
			memo: { type: 'string', },
			place: { type: 'string', },
			priority: { type: 'string', },
			ratio: { type: 'integer', },
			expiresAt: { type: 'integer', },
			imageUrl: { type: 'string', minLength: 1, },
		},
		required: ['url', 'memo', 'place', 'priority', 'ratio', 'expiresAt', 'imageUrl'],
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps) => {
	await Ads.insert({
		id: genId(),
		createdAt: new Date(),
		expiresAt: new Date(ps.expiresAt),
		url: ps.url,
		imageUrl: ps.imageUrl,
		priority: ps.priority,
		ratio: ps.ratio,
		place: ps.place,
		memo: ps.memo,
	});
});
