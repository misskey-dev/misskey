/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { isJsonObject } from '@/misc/json-value.js';
import type { JsonObject, JsonValue } from '@/misc/json-value.js';
import type { NoctownPlayersRepository } from '@/models/_.js';
import { NoctownService } from '@/core/NoctownService.js';
import Channel, { type MiChannelService } from '../channel.js';

class NoctownChannel extends Channel {
	public readonly chName = 'noctown';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:account' as const;
	private playerId: string | null = null;

	constructor(
		private noctownService: NoctownService,
		private noctownPlayersRepository: NoctownPlayersRepository,
		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
	}

	@bindThis
	public async init(params: JsonObject) {
		if (this.user == null) return;

		// Get or create player record
		let player = await this.noctownPlayersRepository.findOneBy({ userId: this.user.id });
		if (!player) {
			// Create player on first connection
			player = await this.noctownService.createPlayer(this.user.id);
		}

		this.playerId = player.id;

		// Subscribe to noctown events
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(this.subscriber as any).on('noctownStream', this.onNoctownEvent);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(this.subscriber as any).on(`noctownPlayerStream:${this.playerId}`, this.send);

		// Mark player as online and broadcast
		await this.noctownService.setPlayerOnline(this.playerId, this.user.id);
	}

	@bindThis
	private onNoctownEvent(data: { type: string; body: JsonValue }) {
		// Filter events based on proximity or relevance
		this.send(data.type, data.body);
	}

	@bindThis
	public onMessage(type: string, body: JsonValue) {
		switch (type) {
			case 'move':
				if (!isJsonObject(body)) return;
				this.handleMove(body);
				break;
			case 'pickItem':
				if (!isJsonObject(body)) return;
				this.handlePickItem(body);
				break;
			case 'placeItem':
				if (!isJsonObject(body)) return;
				this.handlePlaceItem(body);
				break;
			case 'interact':
				if (!isJsonObject(body)) return;
				this.handleInteract(body);
				break;
			case 'emotion':
				if (!isJsonObject(body)) return;
				this.handleEmotion(body);
				break;
			case 'chat':
				if (!isJsonObject(body)) return;
				this.handleChat(body);
				break;
			case 'heartbeat':
				this.handleHeartbeat();
				break;
			case 'generateChunk':
				if (!isJsonObject(body)) return;
				this.handleGenerateChunk(body);
				break;
		}
	}

	@bindThis
	private async handleMove(body: JsonObject) {
		if (this.user == null || this.playerId == null) return;

		const x = typeof body.x === 'number' ? body.x : null;
		const y = typeof body.y === 'number' ? body.y : null;
		const z = typeof body.z === 'number' ? body.z : null;
		const rotation = typeof body.rotation === 'number' ? body.rotation : null;

		if (x == null || y == null || z == null) return;

		await this.noctownService.updatePlayerPosition(this.playerId, this.user.id, x, y, z, rotation);
	}

	@bindThis
	private async handlePickItem(body: JsonObject) {
		if (this.user == null || this.playerId == null) return;

		const droppedItemId = typeof body.droppedItemId === 'string' ? body.droppedItemId : null;
		if (droppedItemId == null) return;

		await this.noctownService.pickUpItem(this.playerId, droppedItemId);
	}

	@bindThis
	private async handlePlaceItem(body: JsonObject) {
		if (this.user == null || this.playerId == null) return;

		const playerItemId = typeof body.playerItemId === 'string' ? body.playerItemId : null;
		const x = typeof body.x === 'number' ? body.x : null;
		const y = typeof body.y === 'number' ? body.y : null;
		const z = typeof body.z === 'number' ? body.z : null;
		const rotation = typeof body.rotation === 'number' ? body.rotation : 0;

		if (playerItemId == null || x == null || y == null || z == null) return;

		await this.noctownService.placeItem(this.playerId, playerItemId, x, y, z, rotation);
	}

	@bindThis
	private async handleInteract(body: JsonObject) {
		if (this.user == null || this.playerId == null) return;

		const targetType = typeof body.targetType === 'string' ? body.targetType : null;
		const targetId = typeof body.targetId === 'string' ? body.targetId : null;

		if (targetType == null || targetId == null) return;

		await this.noctownService.interact(this.playerId, targetType, targetId);
	}

	@bindThis
	private async handleEmotion(body: JsonObject) {
		if (this.user == null || this.playerId == null) return;

		const emoji = typeof body.emoji === 'string' ? body.emoji : null;
		const isCustomEmoji = typeof body.isCustomEmoji === 'boolean' ? body.isCustomEmoji : false;

		if (emoji == null) return;

		// Broadcast emotion to nearby players
		await this.noctownService.broadcastEmotion(this.playerId, this.user.id, emoji, isCustomEmoji);
	}

	@bindThis
	private async handleChat(body: JsonObject) {
		if (this.user == null || this.playerId == null) return;

		const message = typeof body.message === 'string' ? body.message : null;

		if (message == null || message.trim().length === 0) return;
		if (message.length > 100) return; // T131: Max 100 characters

		// T143, T144: Broadcast chat to nearby players
		await this.noctownService.broadcastChat(this.playerId, this.user.id, message.trim());
	}

	// FR-007-6: ハートビートでオンライン状態を維持
	@bindThis
	private async handleHeartbeat() {
		if (this.playerId == null) return;

		await this.noctownPlayersRepository.update(this.playerId, {
			isOnline: true,
			lastActiveAt: new Date(),
		});
	}

	@bindThis
	private async handleGenerateChunk(body: JsonObject) {
		if (this.user == null || this.playerId == null) return;

		const chunkX = typeof body.chunkX === 'number' ? body.chunkX : null;
		const chunkZ = typeof body.chunkZ === 'number' ? body.chunkZ : null;
		const worldId = typeof body.worldId === 'string' ? body.worldId : 'default';

		if (chunkX == null || chunkZ == null) return;

		// Validate chunk coordinates (security check)
		if (!Number.isInteger(chunkX) || !Number.isInteger(chunkZ)) return;
		if (chunkX < -1000 || chunkX > 1000 || chunkZ < -1000 || chunkZ > 1000) return;

		try {
			const chunk = await this.noctownService.generateChunk(worldId, chunkX, chunkZ);
			if (chunk && 'terrainData' in chunk && 'biome' in chunk) {
				// Send generated chunk data back to requesting client only
				this.send('chunkGenerated', {
					chunkX,
					chunkZ,
					worldId,
					terrainData: chunk.terrainData as JsonValue,
					biome: chunk.biome as JsonValue,
					environmentObjects: chunk.environmentObjects as JsonValue,
				} as JsonValue);
			}
		} catch (error) {
			// If chunk already exists or generation failed, silently fail
			// (client will retry if needed)
			console.error('Chunk generation error:', error);
		}
	}

	@bindThis
	public async dispose() {
		// Unsubscribe events
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(this.subscriber as any).off('noctownStream', this.onNoctownEvent);
		if (this.playerId) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(this.subscriber as any).off(`noctownPlayerStream:${this.playerId}`, this.send);

			// Mark player as offline and broadcast full PlayerData
			// Note: Offline transition now happens through background job (processOfflineTransitions)
			// which checks lastActiveAt > 30 seconds
			// This immediate call is kept for explicit disconnections
			if (this.user) {
				await this.noctownService.setPlayerOfflineAndBroadcast(this.playerId);
			}
		}
	}
}

@Injectable()
export class NoctownChannelService implements MiChannelService<true> {
	public readonly shouldShare = NoctownChannel.shouldShare;
	public readonly requireCredential = NoctownChannel.requireCredential;
	public readonly kind = NoctownChannel.kind;

	constructor(
		private noctownService: NoctownService,
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): NoctownChannel {
		return new NoctownChannel(
			this.noctownService,
			this.noctownPlayersRepository,
			id,
			connection,
		);
	}
}
