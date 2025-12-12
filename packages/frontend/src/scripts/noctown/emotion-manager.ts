/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';
import { SpeechBubbleRenderer, type SpeechBubbleConfig } from './speech-bubble.js';

export interface EmotionEvent {
	playerId: string;
	userId: string;
	emoji: string;
	isCustomEmoji: boolean;
	customEmojiUrl?: string;
	timestamp: number;
}

export interface EmotionManagerConfig {
	/** Bubble display configuration */
	bubbleConfig: Partial<SpeechBubbleConfig>;
	/** Cooldown between emotions from same player (ms) */
	cooldownMs: number;
	/** Maximum emotions stored in history */
	maxHistory: number;
	/** Enable emotion sounds */
	enableSounds: boolean;
}

const DEFAULT_CONFIG: EmotionManagerConfig = {
	bubbleConfig: {
		duration: 4000,
		maxPerPlayer: 3,
		fadeDuration: 500,
	},
	cooldownMs: 500,
	maxHistory: 100,
	enableSounds: true,
};

type EmotionCallback = (event: EmotionEvent) => void;

/**
 * Manages emotion display and events for Noctown
 */
export class EmotionManager {
	private bubbleRenderer: SpeechBubbleRenderer;
	private config: EmotionManagerConfig;
	private playerPositions: Map<string, THREE.Vector3> = new Map();
	private lastEmotionTime: Map<string, number> = new Map();
	private emotionHistory: EmotionEvent[] = [];
	private callbacks: Set<EmotionCallback> = new Set();
	private isDisposed = false;

	constructor(scene: THREE.Scene, config: Partial<EmotionManagerConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.bubbleRenderer = new SpeechBubbleRenderer(scene, this.config.bubbleConfig);
	}

	/**
	 * Update player position for bubble following
	 */
	public updatePlayerPosition(playerId: string, position: THREE.Vector3): void {
		if (this.isDisposed) return;
		this.playerPositions.set(playerId, position.clone());
	}

	/**
	 * Remove player position tracking
	 */
	public removePlayer(playerId: string): void {
		this.playerPositions.delete(playerId);
		this.lastEmotionTime.delete(playerId);
		this.bubbleRenderer.clearPlayerBubbles(playerId);
	}

	/**
	 * Handle incoming emotion event
	 */
	public handleEmotion(event: EmotionEvent): boolean {
		if (this.isDisposed) return false;

		// Check cooldown
		const lastTime = this.lastEmotionTime.get(event.playerId) ?? 0;
		const now = Date.now();
		if (now - lastTime < this.config.cooldownMs) {
			return false;
		}

		// Get player position
		const position = this.playerPositions.get(event.playerId);
		if (!position) {
			// If position not found, try to use a default or skip
			return false;
		}

		// Show bubble
		this.bubbleRenderer.showBubble(
			event.playerId,
			position,
			event.emoji,
			event.isCustomEmoji,
			event.customEmojiUrl,
		);

		// Update cooldown
		this.lastEmotionTime.set(event.playerId, now);

		// Add to history
		this.addToHistory(event);

		// Play sound effect
		if (this.config.enableSounds) {
			this.playEmotionSound(event.emoji);
		}

		// Notify callbacks
		for (const callback of this.callbacks) {
			try {
				callback(event);
			} catch (e) {
				console.error('Emotion callback error:', e);
			}
		}

		return true;
	}

	/**
	 * Send local player's emotion
	 */
	public sendEmotion(
		localPlayerId: string,
		localUserId: string,
		emoji: string,
		isCustomEmoji: boolean,
		customEmojiUrl?: string,
	): EmotionEvent | null {
		const event: EmotionEvent = {
			playerId: localPlayerId,
			userId: localUserId,
			emoji,
			isCustomEmoji,
			customEmojiUrl,
			timestamp: Date.now(),
		};

		// Show locally
		if (this.handleEmotion(event)) {
			return event;
		}

		return null;
	}

	/**
	 * Add emotion to history
	 */
	private addToHistory(event: EmotionEvent): void {
		this.emotionHistory.push(event);

		// Trim history if needed
		if (this.emotionHistory.length > this.config.maxHistory) {
			this.emotionHistory = this.emotionHistory.slice(-this.config.maxHistory);
		}
	}

	/**
	 * Get emotion history
	 */
	public getHistory(): readonly EmotionEvent[] {
		return this.emotionHistory;
	}

	/**
	 * Get recent emotions for a specific player
	 */
	public getPlayerEmotions(playerId: string, limit: number = 10): EmotionEvent[] {
		return this.emotionHistory
			.filter(e => e.playerId === playerId)
			.slice(-limit);
	}

	/**
	 * Play emotion sound effect
	 */
	private playEmotionSound(emoji: string): void {
		// Determine sound based on emoji category
		const soundType = this.categorizeEmoji(emoji);

		// Play sound using Web Audio API
		try {
			const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
			const oscillator = audioCtx.createOscillator();
			const gainNode = audioCtx.createGain();

			oscillator.connect(gainNode);
			gainNode.connect(audioCtx.destination);

			// Different tones for different emotion types
			switch (soundType) {
				case 'happy':
					oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
					oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.1);
					break;
				case 'sad':
					oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
					oscillator.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.2);
					break;
				case 'angry':
					oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
					oscillator.type = 'sawtooth';
					break;
				case 'love':
					oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
					oscillator.type = 'sine';
					break;
				case 'surprise':
					oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
					oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.05);
					break;
				default:
					oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
					break;
			}

			// Short duration with fade out
			gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

			oscillator.start();
			oscillator.stop(audioCtx.currentTime + 0.15);
		} catch {
			// Ignore audio errors
		}
	}

	/**
	 * Categorize emoji for sound selection
	 */
	private categorizeEmoji(emoji: string): string {
		const happyEmojis = ['😊', '😄', '😃', '🥰', '😁', '🤗', '😸', '🎉', '✨', '🌟'];
		const sadEmojis = ['😢', '😭', '😿', '🥺', '😞', '😔', '💔'];
		const angryEmojis = ['😠', '😡', '🤬', '💢', '👿'];
		const loveEmojis = ['❤️', '💕', '💖', '💗', '💓', '💘', '😍', '🥰', '💑'];
		const surpriseEmojis = ['😮', '😲', '😱', '🤯', '😵', '⁉️', '❗'];

		if (happyEmojis.includes(emoji)) return 'happy';
		if (sadEmojis.includes(emoji)) return 'sad';
		if (angryEmojis.includes(emoji)) return 'angry';
		if (loveEmojis.includes(emoji)) return 'love';
		if (surpriseEmojis.includes(emoji)) return 'surprise';

		return 'neutral';
	}

	/**
	 * Register callback for emotion events
	 */
	public onEmotion(callback: EmotionCallback): () => void {
		this.callbacks.add(callback);
		return () => {
			this.callbacks.delete(callback);
		};
	}

	/**
	 * Update - call in render loop
	 */
	public update(): void {
		if (this.isDisposed) return;
		this.bubbleRenderer.update(this.playerPositions);
	}

	/**
	 * Set sound enabled/disabled
	 */
	public setSoundsEnabled(enabled: boolean): void {
		this.config.enableSounds = enabled;
	}

	/**
	 * Check if sounds are enabled
	 */
	public isSoundsEnabled(): boolean {
		return this.config.enableSounds;
	}

	/**
	 * Get current bubble count
	 */
	public getBubbleCount(): number {
		return this.bubbleRenderer.getBubbleCount();
	}

	/**
	 * Clear all emotions
	 */
	public clearAll(): void {
		this.bubbleRenderer.clearAllBubbles();
		this.emotionHistory = [];
		this.lastEmotionTime.clear();
	}

	/**
	 * Dispose all resources
	 */
	public dispose(): void {
		this.isDisposed = true;
		this.bubbleRenderer.dispose();
		this.playerPositions.clear();
		this.lastEmotionTime.clear();
		this.emotionHistory = [];
		this.callbacks.clear();
	}
}

/**
 * Parse emoji from text message
 */
export function parseEmojisFromText(text: string): Array<{ emoji: string; isCustom: boolean; url?: string }> {
	const results: Array<{ emoji: string; isCustom: boolean; url?: string }> = [];

	// Match Unicode emojis
	const unicodeEmojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
	const unicodeMatches = text.match(unicodeEmojiRegex);
	if (unicodeMatches) {
		for (const emoji of unicodeMatches) {
			results.push({ emoji, isCustom: false });
		}
	}

	// Match Misskey custom emojis :name:
	const customEmojiRegex = /:([a-zA-Z0-9_]+):/g;
	let match;
	while ((match = customEmojiRegex.exec(text)) !== null) {
		results.push({
			emoji: match[1],
			isCustom: true,
		});
	}

	return results;
}

/**
 * Get frequently used emojis
 */
export function getFrequentEmojis(history: readonly EmotionEvent[], limit: number = 12): string[] {
	const emojiCount = new Map<string, number>();

	for (const event of history) {
		const key = event.isCustomEmoji ? `:${event.emoji}:` : event.emoji;
		emojiCount.set(key, (emojiCount.get(key) ?? 0) + 1);
	}

	return Array.from(emojiCount.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([emoji]) => emoji);
}
