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
import { activeFishingSessions } from './cast.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'write:account',
	res: {
		type: 'object',
		properties: {
			success: { type: 'boolean' },
			caught: { type: 'boolean' },
			item: {
				type: 'object',
				nullable: true,
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
					rarity: { type: 'number' },
					flavorText: { type: 'string', nullable: true },
				},
			},
			message: { type: 'string', nullable: true },
		},
	},
	errors: {
		noPlayer: {
			message: 'Player not found',
			code: 'NO_PLAYER',
			id: 'a5c01f91-0020-4000-a000-000000000001',
		},
		notFishing: {
			message: 'Not currently fishing',
			code: 'NOT_FISHING',
			id: 'a5c01f91-0020-4000-a000-000000000002',
		},
		tooEarly: {
			message: 'Fish has not bitten yet',
			code: 'TOO_EARLY',
			id: 'a5c01f91-0020-4000-a000-000000000003',
		},
		tooLate: {
			message: 'Fish got away - you were too slow',
			code: 'TOO_LATE',
			id: 'a5c01f91-0020-4000-a000-000000000004',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// Fishing items with rarity weights
interface FishItem {
	name: string;
	flavorText: string;
	rarity: number;
	weight: number; // Higher = more common
}

const FISH_ITEMS: FishItem[] = [
	// Common fish (rarity 0)
	{ name: 'フナ', flavorText: '池でよく見かける魚。食用にもなる。', rarity: 0, weight: 30 },
	{ name: 'コイ', flavorText: '大きな淡水魚。力強く泳ぐ。', rarity: 0, weight: 25 },
	{ name: 'メダカ', flavorText: '小さくて可愛い魚。観賞用に人気。', rarity: 0, weight: 20 },
	{ name: 'ドジョウ', flavorText: '泥の中に潜む魚。ヌルヌルしている。', rarity: 0, weight: 15 },
	// Rare fish (rarity 1)
	{ name: '金魚', flavorText: '美しい赤色の観賞魚。', rarity: 1, weight: 8 },
	{ name: 'ナマズ', flavorText: 'ヒゲの生えた大きな魚。地震を予知するとか。', rarity: 1, weight: 7 },
	// Super Rare fish (rarity 2)
	{ name: 'アロワナ', flavorText: '神秘的な銀色の魚。高級観賞魚。', rarity: 2, weight: 3 },
	{ name: '錦鯉', flavorText: '色鮮やかな模様を持つ鯉。', rarity: 2, weight: 3 },
	// SSR fish (rarity 3)
	{ name: '黄金の鯉', flavorText: '全身が黄金色に輝く伝説の魚。', rarity: 3, weight: 1.5 },
	// Ultra Rare fish (rarity 4)
	{ name: '龍魚', flavorText: '龍のような姿をした幻の魚。', rarity: 4, weight: 0.5 },
	// Legendary (rarity 5)
	{ name: 'ヌシ', flavorText: 'この池に住む伝説の大魚。出会えるのは奇跡。', rarity: 5, weight: 0.1 },
	// Junk items
	{ name: '空き缶', flavorText: '誰かが捨てたゴミ。リサイクルしよう。', rarity: 0, weight: 5 },
	{ name: '長靴', flavorText: '池に落ちていた長靴。誰のだろう？', rarity: 0, weight: 3 },
	{ name: '古いタイヤ', flavorText: 'タイヤが釣れた...池をきれいにしよう。', rarity: 0, weight: 2 },
];

// Timing window for successful catch (milliseconds)
const CATCH_WINDOW_MS = 2000; // 2 second window after fish bites

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
		super(meta, paramDef, async (_ps, me) => {
			// Get player
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.noPlayer);
			}

			// Check if player is fishing
			const session = activeFishingSessions.get(player.id);
			if (!session) {
				throw new ApiError(meta.errors.notFishing);
			}

			const elapsed = Date.now() - session.startTime;

			// Check timing
			if (elapsed < session.waitTime) {
				// Too early - fish hasn't bitten yet
				activeFishingSessions.delete(player.id);
				throw new ApiError(meta.errors.tooEarly);
			}

			if (elapsed > session.waitTime + CATCH_WINDOW_MS) {
				// Too late - fish got away
				activeFishingSessions.delete(player.id);
				throw new ApiError(meta.errors.tooLate);
			}

			// Clear fishing session
			activeFishingSessions.delete(player.id);

			// Select fish based on weighted random
			const totalWeight = FISH_ITEMS.reduce((sum, item) => sum + item.weight, 0);
			let random = Math.random() * totalWeight;
			let selectedFish: FishItem | null = null;

			for (const fish of FISH_ITEMS) {
				random -= fish.weight;
				if (random <= 0) {
					selectedFish = fish;
					break;
				}
			}

			if (!selectedFish) {
				selectedFish = FISH_ITEMS[0]; // Fallback to first item
			}

			// Get or create the fish item
			let fishItem = await this.noctownItemsRepository.findOne({
				where: { name: selectedFish.name },
			});

			if (!fishItem) {
				fishItem = await this.noctownItemsRepository.save({
					id: this.idService.gen(),
					name: selectedFish.name,
					flavorText: selectedFish.flavorText,
					imageUrl: null,
					fullImageUrl: null,
					rarity: selectedFish.rarity,
					itemType: 'normal',
					isUnique: false,
					isPlayerCreated: false,
					creatorId: null,
					shopPrice: null,
					shopSellPrice: this.calculateSellPrice(selectedFish.rarity),
				});
			}

			// Add to player inventory
			const existingPlayerItem = await this.noctownPlayerItemsRepository.findOne({
				where: { playerId: player.id, itemId: fishItem.id },
			});

			if (existingPlayerItem) {
				await this.noctownPlayerItemsRepository.update(
					{ id: existingPlayerItem.id },
					{ quantity: existingPlayerItem.quantity + 1 },
				);
			} else {
				await this.noctownPlayerItemsRepository.save({
					id: this.idService.gen(),
					playerId: player.id,
					itemId: fishItem.id,
					quantity: 1,
				});
			}

			// Generate message based on rarity
			const message = this.generateCatchMessage(selectedFish);

			return {
				success: true,
				caught: true,
				item: {
					id: fishItem.id,
					name: fishItem.name,
					rarity: fishItem.rarity,
					flavorText: fishItem.flavorText,
				},
				message,
			};
		});
	}

	private calculateSellPrice(rarity: number): number {
		const basePrices: Record<number, number> = {
			0: 10,
			1: 50,
			2: 200,
			3: 500,
			4: 2000,
			5: 10000,
		};
		return basePrices[rarity] ?? 10;
	}

	private generateCatchMessage(fish: FishItem): string {
		const messages: Record<number, string[]> = {
			0: [
				`${fish.name}を釣り上げた！`,
				`${fish.name}が釣れた！`,
			],
			1: [
				`お！${fish.name}だ！なかなか良い獲物！`,
				`${fish.name}を釣り上げた！レアな魚だ！`,
			],
			2: [
				`すごい！${fish.name}を釣った！珍しい！`,
				`やった！${fish.name}だ！かなりレア！`,
			],
			3: [
				`信じられない！${fish.name}が釣れた！！`,
				`SSレア！${fish.name}を手に入れた！`,
			],
			4: [
				`ウルトラレア！${fish.name}を釣り上げた！！！`,
				`伝説級の${fish.name}が釣れた！！`,
			],
			5: [
				`奇跡だ！${fish.name}を釣り上げた！！！`,
				`レジェンダリー！${fish.name}！！！`,
			],
		};

		const rarityMessages = messages[fish.rarity] ?? messages[0];
		return rarityMessages[Math.floor(Math.random() * rarityMessages.length)];
	}
}
