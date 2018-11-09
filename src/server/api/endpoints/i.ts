import User, { pack } from '../../../models/user';
import define from '../define';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '自分のアカウント情報を取得します。'
	},

	requireCredential: true,

	params: {},

	res: {
		type: 'entity',
		entity: 'User'
	}
};

export default define(meta, (ps, user, app) => new Promise(async (res, rej) => {
	const isSecure = user != null && app == null;

	// Serialize
	res(await pack(user, user, {
		detail: true,
		includeHasUnreadNotes: true,
		includeSecrets: isSecure
	}));

	// Update lastUsedAt
	User.update({ _id: user._id }, {
		$set: {
			lastUsedAt: new Date()
		}
	});
}));
