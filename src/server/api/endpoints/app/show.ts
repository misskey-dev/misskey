import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import App, { pack, IApp } from '../../../../models/app';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	params: {
		appId: {
			validator: $.type(ID),
			transform: transform
		},
	}
};

export default (params: any, user: ILocalUser, app: IApp) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	const isSecure = user != null && app == null;

	// Lookup app
	const ap = await App.findOne({ _id: ps.appId });

	if (ap === null) {
		return rej('app not found');
	}

	// Send response
	res(await pack(ap, user, {
		detail: true,
		includeSecret: isSecure && ap.userId.equals(user._id)
	}));
});
