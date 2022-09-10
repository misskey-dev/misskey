import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { Webhooks } from '@/models/index.js';

export const meta = {
	tags: ['webhooks', 'account'],

	requireCredential: true,

	kind: 'read:account',
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
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
		super(meta, paramDef, async (ps, me) => {
			const webhooks = await Webhooks.findBy({
				userId: me.id,
			});

			return webhooks;
		});
	}
}
