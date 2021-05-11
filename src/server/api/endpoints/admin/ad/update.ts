import $ from 'cafy';
import define from '../../../define';
import { ID } from '@/misc/cafy-id';
import { Ads } from '../../../../../models';
import { ApiError } from '../../../error';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		id: {
			validator: $.type(ID)
		},
		memo: {
			validator: $.str
		},
		url: {
			validator: $.str.min(1)
		},
		imageUrl: {
			validator: $.str.min(1)
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
	},

	errors: {
		noSuchAd: {
			message: 'No such ad.',
			code: 'NO_SUCH_AD',
			id: 'b7aa1727-1354-47bc-a182-3a9c3973d300'
		}
	}
};

export default define(meta, async (ps, me) => {
	const ad = await Ads.findOne(ps.id);

	if (ad == null) throw new ApiError(meta.errors.noSuchAd);

	await Ads.update(ad.id, {
		url: ps.url,
		place: ps.place,
		priority: ps.priority,
		ratio: ps.ratio,
		memo: ps.memo,
		imageUrl: ps.imageUrl,
		expiresAt: new Date(ps.expiresAt),
	});
});
