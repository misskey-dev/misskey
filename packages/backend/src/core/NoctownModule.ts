/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Module } from '@nestjs/common';
import type { Provider } from '@nestjs/common';

// Noctown misc services (services that don't depend on CoreModule services)
import { ShopNpcService } from '@/misc/noctown/shop-npc-service.js';
import { TradeService } from '@/misc/noctown/trade-service.js';
import { PlayerItemService } from '@/misc/noctown/player-item-service.js';
import { UniqueItemService } from '@/misc/noctown/unique-item-service.js';
import { ItemDropService } from '@/misc/noctown/item-drop-service.js';
import { ChestRespawnService } from '@/misc/noctown/chest-respawn-service.js';
import { FenceService } from '@/misc/noctown/fence-service.js';
import { ScoreCalculatorService } from '@/misc/noctown/score-calculator.js';
import { NoctownPermissionService } from '@/misc/noctown/permission-check.js';
import { NoctownNoteSubscriptionService } from '@/misc/noctown/note-subscription.js';
import { RecipeSeedService } from '@/misc/noctown/recipe-seed.js';

//#region String-based injection providers
const $ShopNpcService: Provider = { provide: 'ShopNpcService', useExisting: ShopNpcService };
const $TradeService: Provider = { provide: 'TradeService', useExisting: TradeService };
const $PlayerItemService: Provider = { provide: 'PlayerItemService', useExisting: PlayerItemService };
const $UniqueItemService: Provider = { provide: 'UniqueItemService', useExisting: UniqueItemService };
const $ItemDropService: Provider = { provide: 'ItemDropService', useExisting: ItemDropService };
const $ChestRespawnService: Provider = { provide: 'ChestRespawnService', useExisting: ChestRespawnService };
const $FenceService: Provider = { provide: 'FenceService', useExisting: FenceService };
const $ScoreCalculatorService: Provider = { provide: 'ScoreCalculatorService', useExisting: ScoreCalculatorService };
const $NoctownPermissionService: Provider = { provide: 'NoctownPermissionService', useExisting: NoctownPermissionService };
const $NoctownNoteSubscriptionService: Provider = { provide: 'NoctownNoteSubscriptionService', useExisting: NoctownNoteSubscriptionService };
const $RecipeSeedService: Provider = { provide: 'RecipeSeedService', useExisting: RecipeSeedService };
//#endregion

/**
 * NoctownModule
 *
 * Noctown misc servicesをまとめたモジュール。
 * NoctownService自体はCoreModuleに含まれる（IdService、GlobalEventServiceへの依存があるため）。
 * このモジュールはCoreModuleからimportされ、re-exportされる。
 */
@Module({
	imports: [],
	providers: [
		// Misc services
		ShopNpcService,
		TradeService,
		PlayerItemService,
		UniqueItemService,
		ItemDropService,
		ChestRespawnService,
		FenceService,
		ScoreCalculatorService,
		NoctownPermissionService,
		NoctownNoteSubscriptionService,
		RecipeSeedService,

		// String-based providers
		$ShopNpcService,
		$TradeService,
		$PlayerItemService,
		$UniqueItemService,
		$ItemDropService,
		$ChestRespawnService,
		$FenceService,
		$ScoreCalculatorService,
		$NoctownPermissionService,
		$NoctownNoteSubscriptionService,
		$RecipeSeedService,
	],
	exports: [
		// Misc services
		ShopNpcService,
		TradeService,
		PlayerItemService,
		UniqueItemService,
		ItemDropService,
		ChestRespawnService,
		FenceService,
		ScoreCalculatorService,
		NoctownPermissionService,
		NoctownNoteSubscriptionService,
		RecipeSeedService,

		// String-based providers
		$ShopNpcService,
		$TradeService,
		$PlayerItemService,
		$UniqueItemService,
		$ItemDropService,
		$ChestRespawnService,
		$FenceService,
		$ScoreCalculatorService,
		$NoctownPermissionService,
		$NoctownNoteSubscriptionService,
		$RecipeSeedService,
	],
})
export class NoctownModule {}
