import $ from 'cafy';
import define from '../../../define.js';
import { ID } from '@/misc/cafy-id.js';
import { Ads } from '@/models/index.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		id: {
			validator: $.type(ID)
		}
	},

	errors: {
		noSuchAd: {
			message: 'No such ad.',
			code: 'NO_SUCH_AD',
			id: 'ccac9863-3a03-416e-b899-8a64041118b1'
		}
	}
};

export default define(meta, async (ps, me) => {
	const ad = await Ads.findOne(ps.id);

	if (ad == null) throw new ApiError(meta.errors.noSuchAd);

	await Ads.delete(ad.id);
});
