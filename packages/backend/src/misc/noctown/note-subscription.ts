/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { NoctownPlayersRepository } from '@/models/_.js';

const NOCTOWN_HASHTAG = '#ノクタウン';
const NOCTOWN_HASHTAG_ALT = '#noctown';
const MAX_BUBBLE_LENGTH = 50;

interface NoteEvent {
	id: string;
	userId: string;
	text: string | null;
	visibility: string;
	localOnly: boolean;
	renoteId?: string | null;
	replyId?: string | null;
	user?: {
		id: string;
		name?: string | null;
		username: string;
		host?: string | null;
		avatarUrl?: string | null;
	};
}

/**
 * Service that subscribes to Misskey notes with #ノクタウン hashtag
 * and broadcasts them to Noctown players as speech bubbles.
 */
@Injectable()
export class NoctownNoteSubscriptionService implements OnModuleInit {
	constructor(
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		private globalEventService: GlobalEventService,
	) {}

	@bindThis
	async onModuleInit() {
		// Subscribe to internal note events
		this.redisForSub.on('message', this.onMessage);
		await this.redisForSub.subscribe('internal:note');
	}

	@bindThis
	private async onMessage(channel: string, message: string) {
		if (channel !== 'internal:note') return;

		try {
			const note = JSON.parse(message) as NoteEvent;
			await this.processNote(note);
		} catch {
			// Ignore parse errors
		}
	}

	@bindThis
	private async processNote(note: NoteEvent) {
		// Skip if no text
		if (!note.text) return;

		// Skip renotes and replies (only original notes with hashtag)
		if (note.renoteId || note.replyId) return;

		// Check visibility - only public and home visibility allowed
		if (!this.isVisibilityAllowed(note.visibility)) return;

		// Check if note contains the Noctown hashtag
		if (!this.hasNoctownHashtag(note.text)) return;

		// Find the player associated with this user
		const player = await this.noctownPlayersRepository.findOneBy({
			userId: note.userId,
		});

		// Only broadcast if the user has a Noctown player and is online
		if (!player || !player.isOnline) return;

		// Extract and truncate the note text for display
		const displayText = this.extractDisplayText(note.text);

		// Broadcast the note bubble to all connected Noctown clients
		this.broadcastNoteBubble({
			playerId: player.id,
			userId: note.userId,
			noteId: note.id,
			text: displayText,
			username: note.user?.username ?? 'unknown',
			displayName: note.user?.name ?? note.user?.username ?? 'Unknown',
			avatarUrl: note.user?.avatarUrl ?? null,
			positionX: player.positionX,
			positionY: player.positionY,
			positionZ: player.positionZ,
		});
	}

	/**
	 * Check if the note visibility is allowed for Noctown display.
	 * Only public and home (followers) visibility is allowed.
	 */
	@bindThis
	private isVisibilityAllowed(visibility: string): boolean {
		return visibility === 'public' || visibility === 'home';
	}

	/**
	 * Check if the note contains the Noctown hashtag.
	 */
	@bindThis
	private hasNoctownHashtag(text: string): boolean {
		const lowerText = text.toLowerCase();
		return lowerText.includes(NOCTOWN_HASHTAG.toLowerCase()) ||
			lowerText.includes(NOCTOWN_HASHTAG_ALT.toLowerCase());
	}

	/**
	 * Extract display text from note, removing hashtags and truncating.
	 */
	@bindThis
	private extractDisplayText(text: string): string {
		// Remove the Noctown hashtags
		let displayText = text
			.replace(new RegExp(NOCTOWN_HASHTAG, 'gi'), '')
			.replace(new RegExp(NOCTOWN_HASHTAG_ALT, 'gi'), '')
			.trim();

		// Remove other common hashtags at the end (but keep hashtags in the middle of text)
		displayText = displayText.replace(/\s*#\S+\s*$/g, '').trim();

		// Truncate if too long
		if (displayText.length > MAX_BUBBLE_LENGTH) {
			displayText = displayText.substring(0, MAX_BUBBLE_LENGTH - 3) + '...';
		}

		return displayText;
	}

	/**
	 * Broadcast a note bubble to all Noctown clients.
	 */
	@bindThis
	private broadcastNoteBubble(data: {
		playerId: string;
		userId: string;
		noteId: string;
		text: string;
		username: string;
		displayName: string;
		avatarUrl: string | null;
		positionX: number;
		positionY: number;
		positionZ: number;
	}): void {
		this.globalEventService.publishNoctownStream('playerNoteBubble', {
			playerId: data.playerId,
			userId: data.userId,
			noteId: data.noteId,
			text: data.text,
			username: data.username,
			displayName: data.displayName,
			avatarUrl: data.avatarUrl,
			positionX: data.positionX,
			positionY: data.positionY,
			positionZ: data.positionZ,
		});
	}

	/**
	 * Clean up on module destroy.
	 */
	@bindThis
	async onModuleDestroy() {
		await this.redisForSub.unsubscribe('internal:note');
		this.redisForSub.off('message', this.onMessage);
	}
}
