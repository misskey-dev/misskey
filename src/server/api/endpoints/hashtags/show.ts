import $ from 'cafy';
import define from '../../define';
import { ApiError } from '../../error';
import { Hashtags } from '@/models/index';
import { normalizeForSearch } from '@/misc/normalize-for-search';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false as const,

	params: {
		tag: {
			validator: $.str,
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'Hashtag',
	},

	errors: {
		noSuchHashtag: {
			message: 'No such hashtag.',
			code: 'NO_SUCH_HASHTAG',
			id: '110ee688-193e-4a3a-9ecf-c167b2e6981e'
		}
	}
};

export default define(meta, async (ps, user) => {
	const hashtag = await Hashtags.findOne({ name: normalizeForSearch(ps.tag) });
	if (hashtag == null) {
		throw new ApiError(meta.errors.noSuchHashtag);
	}

	return await Hashtags.pack(hashtag);
});
