import $ from 'cafy';
import define from '../../define.js';
import { createNotification } from '@/services/create-notification.js';

export const meta = {
	tags: ['notifications'],

	requireCredential: true as const,

	kind: 'write:notifications',

	params: {
		body: {
			validator: $.str
		},

		header: {
			validator: $.optional.nullable.str
		},

		icon: {
			validator: $.optional.nullable.str
		},
	},

	errors: {
	}
};

export default define(meta, async (ps, user, token) => {
	createNotification(user.id, 'app', {
		appAccessTokenId: token ? token.id : null,
		customBody: ps.body,
		customHeader: ps.header,
		customIcon: ps.icon,
	});
});
