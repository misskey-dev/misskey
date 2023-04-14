import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/core/IdService.js';
import type { RenoteMutingsRepository } from '@/models/index.js';
import type { RenoteMuting } from '@/models/entities/RenoteMuting.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'write:mutes',

	limit: {
		duration: ms('1hour'),
		max: 20,
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '5e0a5dff-1e94-4202-87ae-4d9c89eb2271',
		},

		muteeIsYourself: {
			message: 'Mutee is yourself.',
			code: 'MUTEE_IS_YOURSELF',
			id: '37285718-52f7-4aef-b7de-c38b8e8a8420',
		},

		alreadyMuting: {
			message: 'You are already muting that user.',
			code: 'ALREADY_MUTING',
			id: 'ccfecbe4-1f1c-4fc2-8a3d-c3ffee61cb7b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.renoteMutingsRepository)
		private renoteMutingsRepository: RenoteMutingsRepository,

		private globalEventService: GlobalEventService,
		private getterService: GetterService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const muter = me;

			// 自分自身
			if (me.id === ps.userId) {
				throw new ApiError(meta.errors.muteeIsYourself);
			}

			// Get mutee
			const mutee = await getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			// Check if already muting
			const exist = await this.renoteMutingsRepository.findOneBy({
				muterId: muter.id,
				muteeId: mutee.id,
			});

			if (exist != null) {
				throw new ApiError(meta.errors.alreadyMuting);
			}

			// Create mute
			await this.renoteMutingsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				muterId: muter.id,
				muteeId: mutee.id,
			} as RenoteMuting);
		});
	}
}
