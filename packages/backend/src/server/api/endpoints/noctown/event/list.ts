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
import { ApiError } from '@/server/api/error.js';
import { LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		properties: {
			events: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						name: { type: 'string' },
						description: { type: 'string', nullable: true },
						eventType: { type: 'string' },
						bannerUrl: { type: 'string', nullable: true },
						startDate: { type: 'string' },
						endDate: { type: 'string' },
						requiredPoints: { type: 'number' },
						isParticipating: { type: 'boolean' },
						currentPoints: { type: 'number' },
						status: { type: 'string' },
					},
				},
			},
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0021-0001-0001-000000000001',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		includeEnded: { type: 'boolean', default: false },
		includeFuture: { type: 'boolean', default: true },
	},
	required: [],
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
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			const now = new Date();
			const query = this.noctownEventsRepository.createQueryBuilder('event')
				.where('event.isActive = :isActive', { isActive: true });

			if (!ps.includeEnded) {
				query.andWhere('event.endDate >= :now', { now });
			}

			if (!ps.includeFuture) {
				query.andWhere('event.startDate <= :now', { now });
			}

			query.orderBy('event.startDate', 'ASC');

			const events = await query.getMany();

			// Get participation status for each event
			const results = await Promise.all(events.map(async (event) => {
				const participation = await this.noctownEventParticipationsRepository.findOneBy({
					eventId: event.id,
					playerId: player.id,
				});

				// Determine status
				let status: string;
				if (event.startDate > now) {
					status = 'upcoming';
				} else if (event.endDate < now) {
					status = 'ended';
				} else {
					status = 'active';
				}

				return {
					id: event.id,
					name: event.name,
					description: event.description,
					eventType: event.eventType,
					bannerUrl: event.bannerUrl,
					startDate: event.startDate.toISOString(),
					endDate: event.endDate.toISOString(),
					requiredPoints: event.requiredPoints,
					milestones: event.milestones,
					isParticipating: !!participation,
					currentPoints: participation?.points ?? 0,
					claimedRewards: participation?.claimedRewards ?? [],
					status,
				};
			}));

			return { events: results };
		});
	}
}
