import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import App, { pack } from '../../../../models/app';
import define from '../../define';

export const meta = {
	params: {
		appId: {
			validator: $.type(ID),
			transform: transform
		},
	}
};

export default define(meta, (ps, user, app) => new Promise(async (res, rej) => {
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
}));
