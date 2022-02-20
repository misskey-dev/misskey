import define from '../../define';
import { SwSubscriptions } from '../../../../models';

export const meta = {
	tags: ['account'],

	requireCredential: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		endpoint: { type: 'string' },
	},
	required: ['endpoint'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	await SwSubscriptions.delete({
		userId: user.id,
		endpoint: ps.endpoint,
	});
});
