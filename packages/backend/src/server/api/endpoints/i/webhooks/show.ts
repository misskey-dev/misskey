import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { Webhooks } from '@/models/index.js';

export const meta = {
	tags: ['webhooks'],

	requireCredential: true,

	kind: 'read:account',

	errors: {
		noSuchWebhook: {
			message: 'No such webhook.',
			code: 'NO_SUCH_WEBHOOK',
			id: '50f614d9-3047-4f7e-90d8-ad6b2d5fb098',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		webhookId: { type: 'string', format: 'misskey:id' },
	},
	required: ['webhookId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const webhook = await Webhooks.findOneBy({
		id: ps.webhookId,
		userId: user.id,
	});

	if (webhook == null) {
		throw new ApiError(meta.errors.noSuchWebhook);
	}

	return webhook;
});
