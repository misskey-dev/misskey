import $ from 'cafy';
import define from '../../../define';
import { Ads } from '../../../../../models';
import { genId } from '@/misc/gen-id';

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
		place: ps.place,
		memo: ps.memo,
	});
});
