import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { Instances } from '@/models/index.js';
import { toPuny } from '@/misc/convert-host.js';
import { fetchInstanceMetadata } from '@/services/fetch-instance-metadata.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		host: { type: 'string' },
	},
	required: ['host'],
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
			const instance = await Instances.findOneBy({ host: toPuny(ps.host) });

			if (instance == null) {
				throw new Error('instance not found');
			}

			fetchInstanceMetadata(instance, true);
		});
	}
}
