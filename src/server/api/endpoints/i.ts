import { pack } from '../../../models/user';
import define from '../define';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '自分のアカウント情報を取得します。'
	},

	tags: ['account'],

	requireCredential: true,

	params: {},

	res: {
		type: 'User',
	}
};

export default define(meta, async (ps, user, app) => {
	const isSecure = user != null && app == null;

	return await pack(user, user, {
		detail: true,
		includeHasUnreadNotes: true,
		includeSecrets: isSecure
	});
});
