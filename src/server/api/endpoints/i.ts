import { pack } from '../../../models/user';
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

export default define(meta, (_, user, app) => pack(user, user, {
		detail: true,
		includeHasUnreadNotes: true,
		includeSecrets: user && !app
	}));
