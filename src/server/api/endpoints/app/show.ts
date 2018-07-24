import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import App, { pack, IApp } from '../../../../models/app';
import { ILocalUser } from '../../../../models/user';

/**
 * Show an app
 */
export default (params: any, user: ILocalUser, app: IApp) => new Promise(async (res, rej) => {
	const isSecure = user != null && app == null;

	// Get 'appId' parameter
	const [appId, appIdErr] = $.type(ID).optional.get(params.appId);
	if (appIdErr) return rej('invalid appId param');

	// Get 'nameId' parameter
	const [nameId, nameIdErr] = $.str.optional.get(params.nameId);
	if (nameIdErr) return rej('invalid nameId param');

	if (appId === undefined && nameId === undefined) {
		return rej('appId or nameId is required');
	}

	// Lookup app
	const ap = appId !== undefined
		? await App.findOne({ _id: appId })
		: await App.findOne({ nameIdLower: nameId.toLowerCase() });

	if (ap === null) {
		return rej('app not found');
	}

	// Send response
	res(await pack(ap, user, {
		includeSecret: isSecure && ap.userId.equals(user._id)
	}));
});
