import rndstr from 'rndstr';
import $ from 'cafy';
import App, { pack } from '../../../../models/app';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

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
			validator: $.str.optional.nullable,
			default: null as any
		},
	}
};

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Generate secret
	const secret = rndstr('a-zA-Z0-9', 32);

	// Create account
	const app = await App.insert({
		createdAt: new Date(),
		userId: user && user._id,
		name: name,
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
});
