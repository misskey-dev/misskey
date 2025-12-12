/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export interface NoteBubbleEvent {
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
}

interface NoteBubbleData {
	playerId: string;
	noteId: string;
	text: string;
	displayName: string;
	avatarUrl: string | null;
	createdAt: number;
	sprite: THREE.Sprite;
	targetPosition: THREE.Vector3;
}

const MAX_TEXT_LENGTH = 50;
const BUBBLE_DURATION_MS = 8000; // 8 seconds display time
const BUBBLE_FADE_TIME_MS = 1000; // 1 second fade out
const BUBBLE_HEIGHT_OFFSET = 2.5; // Height above player
const BUBBLE_MAX_WIDTH = 256;
const BUBBLE_PADDING = 16;
const FONT_SIZE = 14;
const LINE_HEIGHT = 18;

/**
 * Manager for displaying Misskey note bubbles above players in Noctown.
 */
export class NoteBubbleManager {
	private scene: THREE.Scene;
	private bubbles: Map<string, NoteBubbleData> = new Map();
	private textureCache: Map<string, THREE.Texture> = new Map();

	constructor(scene: THREE.Scene) {
		this.scene = scene;
	}

	/**
	 * Handle incoming note bubble event from WebSocket.
	 */
	public handleNoteBubble(event: NoteBubbleEvent): void {
		// Remove existing bubble for this player if any
		this.removeBubble(event.playerId);

		// Create new bubble
		const position = new THREE.Vector3(
			event.positionX,
			event.positionY + BUBBLE_HEIGHT_OFFSET,
			event.positionZ,
		);

		const sprite = this.createBubbleSprite(event.text, event.displayName);
		sprite.position.copy(position);
		this.scene.add(sprite);

		const bubbleData: NoteBubbleData = {
			playerId: event.playerId,
			noteId: event.noteId,
			text: event.text,
			displayName: event.displayName,
			avatarUrl: event.avatarUrl,
			createdAt: Date.now(),
			sprite,
			targetPosition: position,
		};

		this.bubbles.set(event.playerId, bubbleData);
	}

	/**
	 * Create a sprite for the speech bubble.
	 */
	private createBubbleSprite(text: string, displayName: string): THREE.Sprite {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d')!;

		// Truncate text if needed
		const truncatedText = text.length > MAX_TEXT_LENGTH
			? text.substring(0, MAX_TEXT_LENGTH - 3) + '...'
			: text;

		// Measure text and calculate canvas size
		ctx.font = `${FONT_SIZE}px "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif`;

		// Word wrap the text
		const lines = this.wrapText(ctx, truncatedText, BUBBLE_MAX_WIDTH - BUBBLE_PADDING * 2);
		const textWidth = Math.min(
			BUBBLE_MAX_WIDTH - BUBBLE_PADDING * 2,
			Math.max(...lines.map(line => ctx.measureText(line).width)),
		);

		// Add display name line
		const nameText = displayName.length > 15 ? displayName.substring(0, 15) + '...' : displayName;
		const nameWidth = ctx.measureText(nameText).width;

		const bubbleWidth = Math.max(textWidth, nameWidth) + BUBBLE_PADDING * 2;
		const bubbleHeight = (lines.length + 1) * LINE_HEIGHT + BUBBLE_PADDING * 2 + 8; // +8 for name separator

		// Set canvas size (power of 2 for better GPU compatibility)
		canvas.width = Math.pow(2, Math.ceil(Math.log2(bubbleWidth)));
		canvas.height = Math.pow(2, Math.ceil(Math.log2(bubbleHeight)));

		// Clear and draw background
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw bubble background with rounded corners
		const x = (canvas.width - bubbleWidth) / 2;
		const y = (canvas.height - bubbleHeight) / 2;
		this.drawRoundedRect(ctx, x, y, bubbleWidth, bubbleHeight, 12);

		// Fill with semi-transparent white
		ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
		ctx.fill();

		// Draw border
		ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
		ctx.lineWidth = 2;
		ctx.stroke();

		// Draw tail (speech bubble pointer)
		const tailX = canvas.width / 2;
		const tailY = y + bubbleHeight;
		ctx.beginPath();
		ctx.moveTo(tailX - 8, tailY - 2);
		ctx.lineTo(tailX, tailY + 12);
		ctx.lineTo(tailX + 8, tailY - 2);
		ctx.closePath();
		ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
		ctx.fill();
		ctx.stroke();

		// Draw display name
		ctx.font = `bold ${FONT_SIZE - 2}px "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif`;
		ctx.fillStyle = '#666';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		ctx.fillText(nameText, x + BUBBLE_PADDING, y + BUBBLE_PADDING);

		// Draw separator line
		ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(x + BUBBLE_PADDING, y + BUBBLE_PADDING + LINE_HEIGHT + 2);
		ctx.lineTo(x + bubbleWidth - BUBBLE_PADDING, y + BUBBLE_PADDING + LINE_HEIGHT + 2);
		ctx.stroke();

		// Draw text lines
		ctx.font = `${FONT_SIZE}px "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif`;
		ctx.fillStyle = '#333';
		lines.forEach((line, index) => {
			ctx.fillText(line, x + BUBBLE_PADDING, y + BUBBLE_PADDING + (index + 1) * LINE_HEIGHT + 12);
		});

		// Create texture
		const texture = new THREE.CanvasTexture(canvas);
		texture.needsUpdate = true;

		// Create sprite material
		const material = new THREE.SpriteMaterial({
			map: texture,
			transparent: true,
			depthTest: false,
			depthWrite: false,
		});

		// Create sprite
		const sprite = new THREE.Sprite(material);

		// Scale sprite based on canvas aspect ratio
		const scale = 0.015; // Adjust for desired world size
		sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);

		return sprite;
	}

	/**
	 * Draw a rounded rectangle path.
	 */
	private drawRoundedRect(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		radius: number,
	): void {
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		ctx.lineTo(x + radius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
	}

	/**
	 * Wrap text to fit within maxWidth.
	 */
	private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
		const lines: string[] = [];
		const chars = Array.from(text);
		let currentLine = '';

		for (const char of chars) {
			const testLine = currentLine + char;
			const metrics = ctx.measureText(testLine);

			if (metrics.width > maxWidth && currentLine.length > 0) {
				lines.push(currentLine);
				currentLine = char;
			} else {
				currentLine = testLine;
			}
		}

		if (currentLine.length > 0) {
			lines.push(currentLine);
		}

		return lines.length > 0 ? lines : [''];
	}

	/**
	 * Update bubble positions to follow players.
	 */
	public updateBubblePosition(playerId: string, x: number, y: number, z: number): void {
		const bubble = this.bubbles.get(playerId);
		if (bubble) {
			bubble.targetPosition.set(x, y + BUBBLE_HEIGHT_OFFSET, z);
		}
	}

	/**
	 * Remove a bubble for a specific player.
	 */
	public removeBubble(playerId: string): void {
		const bubble = this.bubbles.get(playerId);
		if (bubble) {
			this.scene.remove(bubble.sprite);
			if (bubble.sprite.material instanceof THREE.SpriteMaterial) {
				bubble.sprite.material.map?.dispose();
				bubble.sprite.material.dispose();
			}
			this.bubbles.delete(playerId);
		}
	}

	/**
	 * Remove all bubbles.
	 */
	public removeAllBubbles(): void {
		for (const playerId of this.bubbles.keys()) {
			this.removeBubble(playerId);
		}
	}

	/**
	 * Update bubbles - handle fade out and position interpolation.
	 * Should be called in the render loop.
	 */
	public update(deltaTime: number): void {
		const now = Date.now();

		for (const [playerId, bubble] of this.bubbles) {
			const age = now - bubble.createdAt;

			// Remove expired bubbles
			if (age > BUBBLE_DURATION_MS + BUBBLE_FADE_TIME_MS) {
				this.removeBubble(playerId);
				continue;
			}

			// Handle fade out
			if (age > BUBBLE_DURATION_MS) {
				const fadeProgress = (age - BUBBLE_DURATION_MS) / BUBBLE_FADE_TIME_MS;
				if (bubble.sprite.material instanceof THREE.SpriteMaterial) {
					bubble.sprite.material.opacity = 1 - fadeProgress;
				}
			}

			// Smoothly interpolate position
			bubble.sprite.position.lerp(bubble.targetPosition, Math.min(1, deltaTime * 10));

			// Make bubble always face camera (billboarding is automatic for sprites)
		}
	}

	/**
	 * Get bubble for a player.
	 */
	public getBubble(playerId: string): NoteBubbleData | undefined {
		return this.bubbles.get(playerId);
	}

	/**
	 * Check if player has an active bubble.
	 */
	public hasBubble(playerId: string): boolean {
		return this.bubbles.has(playerId);
	}

	/**
	 * Clean up resources.
	 */
	public dispose(): void {
		this.removeAllBubbles();
		this.textureCache.forEach(texture => texture.dispose());
		this.textureCache.clear();
	}
}
