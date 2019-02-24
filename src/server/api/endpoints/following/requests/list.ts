import FollowRequest, { pack } from '../../../../../models/follow-request';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': '自分に届いたフォローリクエストの一覧を取得します。',
		'en-US': 'Get all pending received follow requests.'
	},

	tags: ['following', 'account'],

	requireCredential: true,

	kind: 'following-read'
};

export default define(meta, async (ps, user) => {
	const reqs = await FollowRequest.find({
		followeeId: user._id
	});

	return await Promise.all(reqs.map(req => pack(req)));
});
