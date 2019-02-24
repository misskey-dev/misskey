import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import App, { pack } from '../../../../models/app';
import define from '../../define';
import { ApiError } from '../../error';

export const meta = {
	tags: ['app'],

	params: {
		appId: {
			validator: $.type(ID),
			transform: transform
		},
	},

	errors: {
		noSuchApp: {
			message: 'No such app.',
			code: 'NO_SUCH_APP',
			id: 'dce83913-2dc6-4093-8a7b-71dbb11718a3'
		}
	}
};

export default define(meta, async (ps, user, app) => {
	const isSecure = user != null && app == null;

	// Lookup app
	const ap = await App.findOne({ _id: ps.appId });

	if (ap === null) {
		throw new ApiError(meta.errors.noSuchApp);
	}

	return await pack(ap, user, {
		detail: true,
		includeSecret: isSecure && ap.userId.equals(user._id)
	});
});
