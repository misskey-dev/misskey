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
	NoctownPlayerItemsRepository,
	NoctownWalletsRepository,
	NoctownItemsRepository,
} from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'write:account',

	res: {
		type: 'object',
		properties: {
			success: { type: 'boolean' },
			reward: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					rewardType: { type: 'string' },
				},
			},
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0024-0001-0001-000000000001',
		},
		eventNotFound: {
			message: 'Event not found.',
			code: 'EVENT_NOT_FOUND',
			id: 'c1d2e3f4-0024-0001-0001-000000000002',
		},
		notParticipating: {
			message: 'Not participating in this event.',
			code: 'NOT_PARTICIPATING',
			id: 'c1d2e3f4-0024-0001-0001-000000000003',
		},
		rewardNotFound: {
			message: 'Reward not found.',
			code: 'REWARD_NOT_FOUND',
			id: 'c1d2e3f4-0024-0001-0001-000000000004',
		},
		alreadyClaimed: {
			message: 'Reward already claimed.',
			code: 'ALREADY_CLAIMED',
			id: 'c1d2e3f4-0024-0001-0001-000000000005',
		},
		insufficientPoints: {
			message: 'Not enough points to claim this reward.',
			code: 'INSUFFICIENT_POINTS',
			id: 'c1d2e3f4-0024-0001-0001-000000000006',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		eventId: { type: 'string', format: 'misskey:id' },
		rewardId: { type: 'string', format: 'misskey:id' },
	},
	required: ['eventId', 'rewardId'],
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

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownWalletsRepository)
		private noctownWalletsRepository: NoctownWalletsRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,

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

			const participation = await this.noctownEventParticipationsRepository.findOneBy({
				eventId: ps.eventId,
				playerId: player.id,
			});
			if (!participation) {
				throw new ApiError(meta.errors.notParticipating);
			}

			const reward = await this.noctownEventRewardsRepository.findOneBy({
				id: ps.rewardId,
				eventId: ps.eventId,
			});
			if (!reward) {
				throw new ApiError(meta.errors.rewardNotFound);
			}

			// Check if already claimed
			if (participation.claimedRewards.includes(ps.rewardId)) {
				throw new ApiError(meta.errors.alreadyClaimed);
			}

			// Check if has enough points
			if (participation.points < reward.requiredPoints) {
				throw new ApiError(meta.errors.insufficientPoints);
			}

			// Grant reward based on type
			if (reward.rewardType === 'item' && reward.itemId) {
				// Add item to inventory
				const existingItem = await this.noctownPlayerItemsRepository.findOneBy({
					playerId: player.id,
					itemId: reward.itemId,
				});

				if (existingItem) {
					await this.noctownPlayerItemsRepository.update(
						{ id: existingItem.id },
						{ quantity: existingItem.quantity + reward.itemQuantity },
					);
				} else {
					await this.noctownPlayerItemsRepository.insert({
						id: this.idService.gen(),
						playerId: player.id,
						itemId: reward.itemId,
						quantity: reward.itemQuantity,
					});
				}
			} else if (reward.rewardType === 'coins' && reward.coinAmount) {
				// Add coins to wallet
				const wallet = await this.noctownWalletsRepository.findOneBy({ playerId: player.id });
				if (wallet) {
					const newBalance = BigInt(wallet.balance) + BigInt(reward.coinAmount);
					await this.noctownWalletsRepository.update(
						{ playerId: player.id },
						{ balance: newBalance.toString() },
					);
				}
			}

			// Mark reward as claimed
			const updatedClaimedRewards = [...participation.claimedRewards, ps.rewardId];
			await this.noctownEventParticipationsRepository.update(
				{ id: participation.id },
				{ claimedRewards: updatedClaimedRewards },
			);

			// Get item name if applicable
			let itemName: string | null = null;
			if (reward.itemId) {
				const item = await this.noctownItemsRepository.findOneBy({ id: reward.itemId });
				itemName = item?.name ?? null;
			}

			return {
				success: true,
				reward: {
					id: reward.id,
					name: reward.name,
					rewardType: reward.rewardType,
					itemName,
					itemQuantity: reward.itemQuantity,
					coinAmount: reward.coinAmount,
				},
			};
		});
	}
}
