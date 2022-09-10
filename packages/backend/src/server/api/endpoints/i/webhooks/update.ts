import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { Webhooks } from '@/models/index.js';
import { publishInternalEvent } from '@/services/stream.js';
import { webhookEventTypes } from '@/models/entities/webhook.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['webhooks'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchWebhook: {
			message: 'No such webhook.',
			code: 'NO_SUCH_WEBHOOK',
			id: 'fb0fea69-da18-45b1-828d-bd4fd1612518',
		},
	},

} as const;

export const paramDef = {
	type: 'object',
	properties: {
		webhookId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string', minLength: 1, maxLength: 100 },
		url: { type: 'string', minLength: 1, maxLength: 1024 },
		secret: { type: 'string', minLength: 1, maxLength: 1024 },
		on: { type: 'array', items: {
			type: 'string', enum: webhookEventTypes,
		} },
		active: { type: 'boolean' },
	},
	required: ['webhookId', 'name', 'url', 'secret', 'on', 'active'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
    private usersRepository: typeof Users,

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

			await Webhooks.update(webhook.id, {
				name: ps.name,
				url: ps.url,
				secret: ps.secret,
				on: ps.on,
				active: ps.active,
			});

			publishInternalEvent('webhookUpdated', webhook);
		});
	}
}
