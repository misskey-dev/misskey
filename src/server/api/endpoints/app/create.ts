import rndstr from 'rndstr';
import $ from 'cafy';
import App, { pack } from '../../../../models/app';
import define from '../../define';

export const meta = {
	requireCredential: false,

	params: {
		name: {
			validator: $.str
		},

		description: {
			validator: $.str
		},

		permission: {
			validator: $.arr($.str).unique()
		},

		// TODO: Check it is valid url
		callbackUrl: {
			validator: $.optional.nullable.str,
			default: null as any
		},
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Generate secret
	const secret = rndstr('a-zA-Z0-9', 32);

	// Create account
	const app = await App.insert({
		createdAt: new Date(),
		userId: user && user._id,
		name: ps.name,
		description: ps.description,
		permission: ps.permission,
		callbackUrl: ps.callbackUrl,
		secret: secret
	});

	// Response
	res(await pack(app, null, {
		detail: true,
		includeSecret: true
	}));
}));
