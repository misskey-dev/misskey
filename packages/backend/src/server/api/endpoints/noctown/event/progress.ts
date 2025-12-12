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
	NoctownEventRewardsRepository,
	NoctownPlayersRepository,
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		properties: {
			event: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					description: { type: 'string', nullable: true },
				},
			},
			participation: {
				type: 'object',
				properties: {
					points: { type: 'number' },
					claimedRewards: { type: 'array', items: { type: 'string' } },
					completedMilestones: { type: 'array', items: { type: 'number' } },
				},
			},
			rewards: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						name: { type: 'string' },
						requiredPoints: { type: 'number' },
						canClaim: { type: 'boolean' },
						claimed: { type: 'boolean' },
					},
				},
			},
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0023-0001-0001-000000000001',
		},
		eventNotFound: {
			message: 'Event not found.',
			code: 'EVENT_NOT_FOUND',
			id: 'c1d2e3f4-0023-0001-0001-000000000002',
		},
		notParticipating: {
			message: 'Not participating in this event.',
			code: 'NOT_PARTICIPATING',
			id: 'c1d2e3f4-0023-0001-0001-000000000003',
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

		@Inject(DI.noctownEventRewardsRepository)
		private noctownEventRewardsRepository: NoctownEventRewardsRepository,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,
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

			const participation = await this.noctownEventParticipationsRepository.findOneBy({
				eventId: ps.eventId,
				playerId: player.id,
			});
			if (!participation) {
				throw new ApiError(meta.errors.notParticipating);
			}

			// Get rewards
			const rewards = await this.noctownEventRewardsRepository.find({
				where: { eventId: ps.eventId },
				order: { requiredPoints: 'ASC', displayOrder: 'ASC' },
			});

			const rewardsWithStatus = rewards.map(reward => ({
				id: reward.id,
				name: reward.name,
				description: reward.description,
				requiredPoints: reward.requiredPoints,
				rewardType: reward.rewardType,
				itemQuantity: reward.itemQuantity,
				coinAmount: reward.coinAmount,
				canClaim: participation.points >= reward.requiredPoints && !participation.claimedRewards.includes(reward.id),
				claimed: participation.claimedRewards.includes(reward.id),
			}));

			return {
				event: {
					id: event.id,
					name: event.name,
					description: event.description,
					eventType: event.eventType,
					bannerUrl: event.bannerUrl,
					startDate: event.startDate.toISOString(),
					endDate: event.endDate.toISOString(),
					requiredPoints: event.requiredPoints,
					milestones: event.milestones,
				},
				participation: {
					points: participation.points,
					claimedRewards: participation.claimedRewards,
					completedMilestones: participation.completedMilestones,
					progressData: participation.progressData,
					joinedAt: participation.joinedAt.toISOString(),
				},
				rewards: rewardsWithStatus,
			};
		});
	}
}
