import $ from 'cafy';
import define from '../../define';
import { createNotification } from '@/services/create-notification';

export const meta = {
	tags: ['notifications'],

	requireCredential: true,

	kind: 'write:notifications',

	params: {
		body: {
			validator: $.str,
		},

		header: {
			validator: $.optional.nullable.str,
		},

		icon: {
			validator: $.optional.nullable.str,
		},
	},

	errors: {
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user, token) => {
	createNotification(user.id, 'app', {
		appAccessTokenId: token ? token.id : null,
		customBody: ps.body,
		customHeader: ps.header,
		customIcon: ps.icon,
	});
});
