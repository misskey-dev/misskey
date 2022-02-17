import define from '../../define';
import { createNotification } from '@/services/create-notification';

export const meta = {
	tags: ['notifications'],

	requireCredential: true,

	kind: 'write:notifications',

	params: {
		type: 'object',
		properties: {
			body: { type: 'string', },
			header: { type: 'string', nullable: true, },
			icon: { type: 'string', nullable: true, },
		},
		required: ['body'],
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
