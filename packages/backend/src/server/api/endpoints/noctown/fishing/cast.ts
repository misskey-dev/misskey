/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownPlayersRepository,
	NoctownPlayerItemsRepository,
	NoctownItemsRepository,
} from '@/models/_.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'write:account',
	res: {
		type: 'object',
		properties: {
			success: { type: 'boolean' },
			fishingSessionId: { type: 'string' },
			waitTime: { type: 'number' },
		},
	},
	errors: {
		noPlayer: {
			message: 'Player not found',
			code: 'NO_PLAYER',
			id: 'a5c01f91-0019-4000-a000-000000000001',
		},
		noFishingRod: {
			message: 'No fishing rod in inventory',
			code: 'NO_FISHING_ROD',
			id: 'a5c01f91-0019-4000-a000-000000000002',
		},
		notAtFishingSpot: {
			message: 'Not at a valid fishing spot',
			code: 'NOT_AT_FISHING_SPOT',
			id: 'a5c01f91-0019-4000-a000-000000000003',
		},
		alreadyFishing: {
			message: 'Already fishing',
			code: 'ALREADY_FISHING',
			id: 'a5c01f91-0019-4000-a000-000000000004',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		pondX: { type: 'number' },
		pondZ: { type: 'number' },
	},
	required: ['pondX', 'pondZ'],
} as const;

// Constants
const FISHING_ROD_NAME = '釣り竿';
const MIN_WAIT_TIME_MS = 3000; // 3 seconds minimum
const MAX_WAIT_TIME_MS = 10000; // 10 seconds maximum
const FISHING_RANGE = 2; // Must be within 2 tiles of pond

// Active fishing sessions (in-memory)
interface FishingSession {
	playerId: string;
	startTime: number;
	waitTime: number;
	pondX: number;
	pondZ: number;
}

export const activeFishingSessions = new Map<string, FishingSession>();

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private idService: IdService,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownPlayerItemsRepository)
		private noctownPlayerItemsRepository: NoctownPlayerItemsRepository,

		@Inject(DI.noctownItemsRepository)
		private noctownItemsRepository: NoctownItemsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.noPlayer);
			}

			// Check if already fishing
			if (activeFishingSessions.has(player.id)) {
				throw new ApiError(meta.errors.alreadyFishing);
			}

			// Check if player has a fishing rod
			const fishingRodItem = await this.noctownItemsRepository.findOne({
				where: { name: FISHING_ROD_NAME },
			});

			if (fishingRodItem) {
				const playerFishingRod = await this.noctownPlayerItemsRepository.findOne({
					where: { playerId: player.id, itemId: fishingRodItem.id },
				});

				if (!playerFishingRod || playerFishingRod.quantity < 1) {
					throw new ApiError(meta.errors.noFishingRod);
				}
			}
			// If fishing rod item doesn't exist in DB, allow fishing (for testing)

			// Validate position (within range of pond)
			const playerX = player.positionX ?? 0;
			const playerZ = player.positionZ ?? 0;
			const distance = Math.sqrt(
				Math.pow(ps.pondX - playerX, 2) + Math.pow(ps.pondZ - playerZ, 2),
			);

			if (distance > FISHING_RANGE) {
				throw new ApiError(meta.errors.notAtFishingSpot);
			}

			// Calculate random wait time for fish to bite
			const waitTime = Math.floor(
				Math.random() * (MAX_WAIT_TIME_MS - MIN_WAIT_TIME_MS) + MIN_WAIT_TIME_MS,
			);

			// Create fishing session
			const sessionId = this.idService.gen();
			activeFishingSessions.set(player.id, {
				playerId: player.id,
				startTime: Date.now(),
				waitTime,
				pondX: ps.pondX,
				pondZ: ps.pondZ,
			});

			// Auto-cleanup session after timeout (wait time + 10 seconds grace period)
			setTimeout(() => {
				const session = activeFishingSessions.get(player.id);
				if (session && session.startTime === Date.now() - waitTime - 10000) {
					activeFishingSessions.delete(player.id);
				}
			}, waitTime + 10000);

			return {
				success: true,
				fishingSessionId: sessionId,
				waitTime,
			};
		});
	}
}
