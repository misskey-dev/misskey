/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export interface SpeechBubbleData {
	playerId: string;
	emoji: string;
	isCustomEmoji: boolean;
	customEmojiUrl?: string;
	createdAt: number;
}

export interface SpeechBubbleConfig {
	/** Duration before bubble disappears (ms) */
	duration: number;
	/** Maximum number of bubbles per player */
	maxPerPlayer: number;
	/** Vertical offset from player */
	offsetY: number;
	/** Bubble size */
	size: number;
	/** Animation speed */
	animationSpeed: number;
	/** Fade duration at end (ms) */
	fadeDuration: number;
}

const DEFAULT_CONFIG: SpeechBubbleConfig = {
	duration: 4000,
	maxPerPlayer: 3,
	offsetY: 2.5,
	size: 1.5,
	animationSpeed: 0.003,
	fadeDuration: 500,
};

interface BubbleInstance {
	sprite: THREE.Sprite;
	data: SpeechBubbleData;
	offsetIndex: number;
	baseY: number;
	animationPhase: number;
	isCustomEmojiLoaded: boolean;
}

/**
 * Speech bubble renderer for displaying emoji emotions above players
 */
export class SpeechBubbleRenderer {
	private scene: THREE.Scene;
	private config: SpeechBubbleConfig;
	private bubbles: Map<string, BubbleInstance[]> = new Map();
	private textureCache: Map<string, THREE.Texture> = new Map();
	private customEmojiCache: Map<string, THREE.Texture> = new Map();
	private disposedTextures: Set<THREE.Texture> = new Set();

	constructor(scene: THREE.Scene, config: Partial<SpeechBubbleConfig> = {}) {
		this.scene = scene;
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Show an emoji bubble above a player
	 */
	public showBubble(
		playerId: string,
		playerPosition: THREE.Vector3,
		emoji: string,
		isCustomEmoji: boolean,
		customEmojiUrl?: string,
	): void {
		const playerBubbles = this.bubbles.get(playerId) ?? [];

		// Remove oldest bubble if max reached
		if (playerBubbles.length >= this.config.maxPerPlayer) {
			const oldest = playerBubbles.shift();
			if (oldest) {
				this.removeBubbleInstance(oldest);
			}
		}

		// Calculate offset index for stacking
		const offsetIndex = playerBubbles.length;
		const baseY = playerPosition.y + this.config.offsetY + (offsetIndex * 0.8);

		const bubbleData: SpeechBubbleData = {
			playerId,
			emoji,
			isCustomEmoji,
			customEmojiUrl,
			createdAt: Date.now(),
		};

		// Create sprite
		const sprite = this.createBubbleSprite(emoji, isCustomEmoji, customEmojiUrl);
		sprite.position.set(playerPosition.x, baseY, playerPosition.z);
		sprite.scale.set(this.config.size, this.config.size, 1);
		this.scene.add(sprite);

		const instance: BubbleInstance = {
			sprite,
			data: bubbleData,
			offsetIndex,
			baseY,
			animationPhase: Math.random() * Math.PI * 2,
			isCustomEmojiLoaded: !isCustomEmoji,
		};

		// Load custom emoji if needed
		if (isCustomEmoji && customEmojiUrl) {
			this.loadCustomEmoji(customEmojiUrl, instance);
		}

		playerBubbles.push(instance);
		this.bubbles.set(playerId, playerBubbles);
	}

	/**
	 * Create a sprite for the bubble
	 */
	private createBubbleSprite(
		emoji: string,
		isCustomEmoji: boolean,
		customEmojiUrl?: string,
	): THREE.Sprite {
		let texture: THREE.Texture;

		if (isCustomEmoji && customEmojiUrl) {
			// Use placeholder while loading
			texture = this.createPlaceholderTexture();
		} else {
			// Standard Unicode emoji
			const cacheKey = `emoji:${emoji}`;
			if (this.textureCache.has(cacheKey)) {
				texture = this.textureCache.get(cacheKey)!;
			} else {
				texture = this.createEmojiTexture(emoji);
				this.textureCache.set(cacheKey, texture);
			}
		}

		const material = new THREE.SpriteMaterial({
			map: texture,
			transparent: true,
			opacity: 1,
			depthWrite: false,
		});

		return new THREE.Sprite(material);
	}

	/**
	 * Create texture from Unicode emoji
	 */
	private createEmojiTexture(emoji: string): THREE.Texture {
		const canvas = window.document.createElement('canvas');
		const size = 128;
		canvas.width = size;
		canvas.height = size;

		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return new THREE.Texture();
		}

		// Draw bubble background
		ctx.beginPath();
		ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
		ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
		ctx.fill();
		ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
		ctx.lineWidth = 2;
		ctx.stroke();

		// Draw emoji
		ctx.font = `${size * 0.55}px serif`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#000000';
		ctx.fillText(emoji, size / 2, size / 2 + 2);

		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;
		return texture;
	}

	/**
	 * Create placeholder texture while loading custom emoji
	 */
	private createPlaceholderTexture(): THREE.Texture {
		const canvas = window.document.createElement('canvas');
		const size = 128;
		canvas.width = size;
		canvas.height = size;

		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return new THREE.Texture();
		}

		// Draw loading circle
		ctx.beginPath();
		ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
		ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
		ctx.fill();

		// Draw loading dots
		ctx.fillStyle = '#888888';
		for (let i = 0; i < 3; i++) {
			const x = size / 4 + (i * size / 4);
			ctx.beginPath();
			ctx.arc(x, size / 2, 6, 0, Math.PI * 2);
			ctx.fill();
		}

		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;
		return texture;
	}

	/**
	 * Load custom emoji image
	 */
	private loadCustomEmoji(url: string, instance: BubbleInstance): void {
		// Check cache first
		if (this.customEmojiCache.has(url)) {
			const cachedTexture = this.customEmojiCache.get(url)!;
			this.applyTextureToSprite(instance.sprite, cachedTexture);
			instance.isCustomEmojiLoaded = true;
			return;
		}

		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			const texture = this.createCustomEmojiTexture(img);
			this.customEmojiCache.set(url, texture);

			// Check if sprite still exists
			if (instance.sprite.parent) {
				this.applyTextureToSprite(instance.sprite, texture);
				instance.isCustomEmojiLoaded = true;
			}
		};
		img.onerror = () => {
			// On error, show question mark
			const fallbackTexture = this.createEmojiTexture('?');
			this.applyTextureToSprite(instance.sprite, fallbackTexture);
			instance.isCustomEmojiLoaded = true;
		};
		img.src = url;
	}

	/**
	 * Create texture from custom emoji image
	 */
	private createCustomEmojiTexture(img: HTMLImageElement): THREE.Texture {
		const canvas = window.document.createElement('canvas');
		const size = 128;
		canvas.width = size;
		canvas.height = size;

		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return new THREE.Texture();
		}

		// Draw bubble background
		ctx.beginPath();
		ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
		ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
		ctx.fill();
		ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
		ctx.lineWidth = 2;
		ctx.stroke();

		// Clip to circle for emoji
		ctx.save();
		ctx.beginPath();
		ctx.arc(size / 2, size / 2, size * 0.35, 0, Math.PI * 2);
		ctx.clip();

		// Draw emoji image
		const imgSize = size * 0.7;
		ctx.drawImage(
			img,
			(size - imgSize) / 2,
			(size - imgSize) / 2,
			imgSize,
			imgSize,
		);
		ctx.restore();

		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;
		return texture;
	}

	/**
	 * Apply texture to sprite material
	 */
	private applyTextureToSprite(sprite: THREE.Sprite, texture: THREE.Texture): void {
		const material = sprite.material as THREE.SpriteMaterial;
		const oldTexture = material.map;

		material.map = texture;
		material.needsUpdate = true;

		// Dispose old placeholder texture if not cached
		if (oldTexture && !this.disposedTextures.has(oldTexture)) {
			const isCached =
				Array.from(this.textureCache.values()).includes(oldTexture) ||
				Array.from(this.customEmojiCache.values()).includes(oldTexture);

			if (!isCached) {
				oldTexture.dispose();
				this.disposedTextures.add(oldTexture);
			}
		}
	}

	/**
	 * Update bubbles - call in render loop
	 */
	public update(playerPositions: Map<string, THREE.Vector3>): void {
		const now = Date.now();

		for (const [playerId, instances] of this.bubbles) {
			const playerPos = playerPositions.get(playerId);
			const toRemove: number[] = [];

			for (let i = 0; i < instances.length; i++) {
				const instance = instances[i];
				const age = now - instance.data.createdAt;

				// Check if bubble should be removed
				if (age >= this.config.duration) {
					toRemove.push(i);
					continue;
				}

				// Update position to follow player
				if (playerPos) {
					instance.sprite.position.x = playerPos.x;
					instance.sprite.position.z = playerPos.z;
					instance.baseY = playerPos.y + this.config.offsetY + (instance.offsetIndex * 0.8);
				}

				// Animate floating effect
				instance.animationPhase += this.config.animationSpeed * 16; // Assuming 60fps
				const floatOffset = Math.sin(instance.animationPhase) * 0.1;
				instance.sprite.position.y = instance.baseY + floatOffset;

				// Fade out near end
				const fadeStart = this.config.duration - this.config.fadeDuration;
				if (age > fadeStart) {
					const fadeProgress = (age - fadeStart) / this.config.fadeDuration;
					const material = instance.sprite.material as THREE.SpriteMaterial;
					material.opacity = 1 - fadeProgress;
				}

				// Scale pop-in animation at start
				if (age < 200) {
					const popProgress = age / 200;
					const scale = this.config.size * this.easeOutBack(popProgress);
					instance.sprite.scale.set(scale, scale, 1);
				}
			}

			// Remove expired bubbles (reverse order to maintain indices)
			for (let i = toRemove.length - 1; i >= 0; i--) {
				const index = toRemove[i];
				const instance = instances[index];
				this.removeBubbleInstance(instance);
				instances.splice(index, 1);
			}

			// Update offset indices after removal
			for (let i = 0; i < instances.length; i++) {
				instances[i].offsetIndex = i;
			}

			// Clean up empty player entries
			if (instances.length === 0) {
				this.bubbles.delete(playerId);
			}
		}
	}

	/**
	 * Easing function for pop animation
	 */
	private easeOutBack(x: number): number {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
	}

	/**
	 * Remove a single bubble instance
	 */
	private removeBubbleInstance(instance: BubbleInstance): void {
		this.scene.remove(instance.sprite);

		const material = instance.sprite.material as THREE.SpriteMaterial;

		// Only dispose texture if not cached
		if (material.map) {
			const isCached =
				Array.from(this.textureCache.values()).includes(material.map) ||
				Array.from(this.customEmojiCache.values()).includes(material.map);

			if (!isCached && !this.disposedTextures.has(material.map)) {
				material.map.dispose();
				this.disposedTextures.add(material.map);
			}
		}

		material.dispose();
	}

	/**
	 * Remove all bubbles for a player
	 */
	public clearPlayerBubbles(playerId: string): void {
		const instances = this.bubbles.get(playerId);
		if (instances) {
			for (const instance of instances) {
				this.removeBubbleInstance(instance);
			}
			this.bubbles.delete(playerId);
		}
	}

	/**
	 * Remove all bubbles
	 */
	public clearAllBubbles(): void {
		for (const [playerId] of this.bubbles) {
			this.clearPlayerBubbles(playerId);
		}
	}

	/**
	 * Get current bubble count
	 */
	public getBubbleCount(): number {
		let count = 0;
		for (const instances of this.bubbles.values()) {
			count += instances.length;
		}
		return count;
	}

	/**
	 * Dispose all resources
	 */
	public dispose(): void {
		this.clearAllBubbles();

		// Dispose cached textures
		for (const texture of this.textureCache.values()) {
			if (!this.disposedTextures.has(texture)) {
				texture.dispose();
				this.disposedTextures.add(texture);
			}
		}
		this.textureCache.clear();

		for (const texture of this.customEmojiCache.values()) {
			if (!this.disposedTextures.has(texture)) {
				texture.dispose();
				this.disposedTextures.add(texture);
			}
		}
		this.customEmojiCache.clear();

		this.disposedTextures.clear();
	}
}
