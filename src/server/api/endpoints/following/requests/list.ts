//import $ from 'cafy'; import ID, { transform } from '../../../../../cafy-id';
import FollowRequest, { pack } from '../../../../../models/follow-request';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': '自分に届いたフォローリクエストの一覧を取得します。',
		'en-US': 'Get all pending received follow requests.'
	},

	requireCredential: true,

	kind: 'following-read'
};

export default define(meta, (_, user) => FollowRequest.find({ followeeId: user._id })
	.then(x => Promise.all(x.map(x => pack(x)))));
