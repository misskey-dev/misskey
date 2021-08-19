import $ from 'cafy';
import define from '../../../define.js';
import { Ads } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		url: {
			validator: $.str.min(1)
		},
		memo: {
			validator: $.str
		},
		place: {
			validator: $.str
		},
		priority: {
			validator: $.str
		},
		ratio: {
			validator: $.num.int().min(0)
		},
		expiresAt: {
			validator: $.num.int()
		},
		imageUrl: {
			validator: $.str.min(1)
		}
	},
};

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
