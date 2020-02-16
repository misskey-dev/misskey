import define from '../define';
import { Users } from '../../../models';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '自分のアカウント情報を取得します。'
	},

	tags: ['account'],

	requireCredential: true as const,

	params: {},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
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
