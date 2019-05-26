import define from '../define';
import { Users } from '../../../models';
import { types, bool } from '../../../misc/schema';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '自分のアカウント情報を取得します。'
	},

	tags: ['account'],

	requireCredential: true,

	params: {},

	res: {
		type: types.object,
		optional: bool.false, nullable: bool.false,
		ref: 'User',
	},
};

export default define(meta, async (ps, user, app) => {
	const isSecure = user != null && app == null;

	return await Users.pack(user, user, {
		detail: true,
		includeHasUnreadNotes: true,
		includeSecrets: isSecure
	});
});
