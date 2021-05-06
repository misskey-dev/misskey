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
