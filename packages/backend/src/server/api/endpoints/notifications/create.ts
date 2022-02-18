import define from '../../define';
import { createNotification } from '@/services/create-notification';

export const meta = {
	tags: ['notifications'],

	requireCredential: true,

	kind: 'write:notifications',

	errors: {
	},
} as const;

const paramDef = {
	type: 'object',
	properties: {
		body: { type: 'string' },
		header: { type: 'string', nullable: true },
		icon: { type: 'string', nullable: true },
	},
	required: ['body'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user, token) => {
	createNotification(user.id, 'app', {
		appAccessTokenId: token ? token.id : null,
		customBody: ps.body,
		customHeader: ps.header,
		customIcon: ps.icon,
	});
});
