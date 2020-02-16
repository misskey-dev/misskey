import $ from 'cafy';
import define from '../../define';
import { ApiError } from '../../error';
import { Hashtags } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定したハッシュタグの情報を取得します。',
	},

	tags: ['hashtags'],

	requireCredential: false as const,

	params: {
		tag: {
			validator: $.str,
			desc: {
				'ja-JP': '対象のハッシュタグ(#なし)',
				'en-US': 'Target hashtag. (no # prefixed)'
			}
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
	const hashtag = await Hashtags.findOne({ name: ps.tag.toLowerCase() });
	if (hashtag == null) {
		throw new ApiError(meta.errors.noSuchHashtag);
	}

	return await Hashtags.pack(hashtag);
});
