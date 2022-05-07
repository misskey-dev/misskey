import define from '../../../define.js';
import { Ads } from '@/models/index.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: {
		noSuchAd: {
			message: 'No such ad.',
			code: 'NO_SUCH_AD',
			id: 'b7aa1727-1354-47bc-a182-3a9c3973d300',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', format: 'misskey:id' },
		memo: { type: 'string' },
		url: { type: 'string', minLength: 1 },
		imageUrl: { type: 'string', minLength: 1 },
		place: { type: 'string' },
		priority: { type: 'string' },
		ratio: { type: 'integer' },
		expiresAt: { type: 'integer' },
	},
	required: ['id', 'memo', 'url', 'imageUrl', 'place', 'priority', 'ratio', 'expiresAt'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const ad = await Ads.findOneBy({ id: ps.id });

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
