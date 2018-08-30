import User, { pack, ILocalUser } from '../../../models/user';
import { IApp } from '../../../models/app';

export const meta = {
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

export default (params: any, user: ILocalUser, app: IApp) => new Promise(async (res, rej) => {
	const isSecure = user != null && app == null;

	// Serialize
	res(await pack(user, user, {
		detail: true,
		includeSecrets: isSecure
	}));

	// Update lastUsedAt
	User.update({ _id: user._id }, {
		$set: {
			lastUsedAt: new Date()
		}
	});
});
