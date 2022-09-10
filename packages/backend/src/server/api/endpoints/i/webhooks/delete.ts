import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '../../../error.js';
import { Webhooks } from '@/models/index.js';
import { publishInternalEvent } from '@/services/stream.js';

export const meta = {
	tags: ['webhooks'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchWebhook: {
			message: 'No such webhook.',
			code: 'NO_SUCH_WEBHOOK',
			id: 'bae73e5a-5522-4965-ae19-3a8688e71d82',
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
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
	const webhook = await Webhooks.findOneBy({
		id: ps.webhookId,
		userId: user.id,
	});

	if (webhook == null) {
		throw new ApiError(meta.errors.noSuchWebhook);
	}

	await Webhooks.delete(webhook.id);

	publishInternalEvent('webhookDeleted', webhook);
});
