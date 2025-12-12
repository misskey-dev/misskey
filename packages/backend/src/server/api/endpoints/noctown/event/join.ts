/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownEventsRepository,
	NoctownEventParticipationsRepository,
	NoctownPlayersRepository,
} from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'write:account',

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0022-0001-0001-000000000001',
		},
		eventNotFound: {
			message: 'Event not found.',
			code: 'EVENT_NOT_FOUND',
			id: 'c1d2e3f4-0022-0001-0001-000000000002',
		},
		eventNotActive: {
			message: 'Event is not active.',
			code: 'EVENT_NOT_ACTIVE',
			id: 'c1d2e3f4-0022-0001-0001-000000000003',
		},
		alreadyJoined: {
			message: 'Already joined this event.',
			code: 'ALREADY_JOINED',
			id: 'c1d2e3f4-0022-0001-0001-000000000004',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		eventId: { type: 'string', format: 'misskey:id' },
	},
	required: ['eventId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownEventsRepository)
		private noctownEventsRepository: NoctownEventsRepository,

		@Inject(DI.noctownEventParticipationsRepository)
		private noctownEventParticipationsRepository: NoctownEventParticipationsRepository,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			const event = await this.noctownEventsRepository.findOneBy({ id: ps.eventId });
			if (!event) {
				throw new ApiError(meta.errors.eventNotFound);
			}

			// Check if event is active and within date range
			const now = new Date();
			if (!event.isActive || event.startDate > now || event.endDate < now) {
				throw new ApiError(meta.errors.eventNotActive);
			}

			// Check if already joined
			const existing = await this.noctownEventParticipationsRepository.findOneBy({
				eventId: ps.eventId,
				playerId: player.id,
			});
			if (existing) {
				throw new ApiError(meta.errors.alreadyJoined);
			}

			// Create participation
			await this.noctownEventParticipationsRepository.insert({
				id: this.idService.gen(),
				eventId: ps.eventId,
				playerId: player.id,
				points: 0,
				claimedRewards: [],
				completedMilestones: [],
				progressData: null,
			});

			return {
				success: true,
				eventId: event.id,
				eventName: event.name,
			};
		});
	}
}
