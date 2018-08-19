import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import App, { pack, IApp } from '../../../../models/app';
import { ILocalUser } from '../../../../models/user';

/**
 * Show an app
 */
export default (params: any, user: ILocalUser, app: IApp) => new Promise(async (res, rej) => {
	const isSecure = user != null && app == null;

	// Get 'appId' parameter
	const [appId, appIdErr] = $.type(ID).get(params.appId);
	if (appIdErr) return rej('invalid appId param');

	// Lookup app
	const ap = await App.findOne({ _id: appId });

	if (ap === null) {
		return rej('app not found');
	}

	// Send response
	res(await pack(ap, user, {
		includeSecret: isSecure && ap.userId.equals(user._id)
	}));
});
