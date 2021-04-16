import $ from 'cafy';
import define from '../../define';
import Resolver from '../../../../remote/activitypub/resolver';
import { ApiError } from '../../error';

export const meta = {
	tags: ['federation'],

	desc: {
		'ja-JP': 'URIを指定してActivityPubオブジェクトを参照します。',
		'en-US': 'Browse to the ActivityPub object by specifying the URI.'
	},

	requireCredential: false as const,

	params: {
		uri: {
			validator: $.str,
			desc: {
				'ja-JP': 'ActivityPubオブジェクトのURI'
			}
		},
	},

	errors: {
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
	}
};

export default define(meta, async (ps) => {
	const resolver = new Resolver();
	const object = await resolver.resolve(ps.uri);
	return object;
});
