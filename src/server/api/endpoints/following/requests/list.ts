import define from '../../../define';
import { FollowRequests } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': '自分に届いたフォローリクエストの一覧を取得します。',
		'en-US': 'Get all pending received follow requests.'
	},

	tags: ['following', 'account'],

	requireCredential: true as const,

	kind: 'read:following'
};

export default define(meta, async (ps, user) => {
	const reqs = await FollowRequests.find({
		followeeId: user.id
	});

	return await Promise.all(reqs.map(req => FollowRequests.pack(req)));
});
