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
			validator: $.str.optional.nullable,
			default: null as any
		},
	}
};

export default define(meta, (ps, user) => App.insert({
		createdAt: new Date(),
		userId: user && user._id,
		name: ps.name,
		description: ps.description,
		permission: ps.permission,
		callbackUrl: ps.callbackUrl,
		secret: rndstr('a-zA-Z0-9', 32)
	})
	.then(x => pack(x, null, {
		detail: true,
		includeSecret: true
	})));
