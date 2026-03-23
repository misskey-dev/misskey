/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export interface RankingBoardOptions {
	position: THREE.Vector3;
	rotation?: number;
	category?: RankingCategory;
}

export type RankingCategory = 'total' | 'balance' | 'item' | 'quest' | 'speed';

export interface RankingEntry {
	rank: number;
	playerName: string;
	score: number;
	isCurrentPlayer?: boolean;
}

// Category colors
const CATEGORY_COLORS: Record<RankingCategory, { primary: number; accent: number }> = {
	total: { primary: 0x4a90d9, accent: 0x357abd },
	balance: { primary: 0xffd700, accent: 0xb8860b },
	item: { primary: 0x9c27b0, accent: 0x7b1fa2 },
	quest: { primary: 0x4caf50, accent: 0x388e3c },
	speed: { primary: 0xff5722, accent: 0xe64a19 },
};

// Category names
const CATEGORY_NAMES: Record<RankingCategory, string> = {
	total: '総合ランキング',
	balance: '資産ランキング',
	item: 'アイテム収集',
	quest: 'クエストランキング',
	speed: '効率ランキング',
};

/**
 * Ranking board renderer for Noctown.
 * Creates 3D ranking display boards in the game world.
 */
export class RankingBoardRenderer {
	private scene: THREE.Scene;
	private boards: Map<string, RankingBoardGroup> = new Map();
	private clock: THREE.Clock;
	private textureLoader: THREE.TextureLoader;

	constructor(scene: THREE.Scene) {
		this.scene = scene;
		this.clock = new THREE.Clock();
		this.textureLoader = new THREE.TextureLoader();
	}

	/**
	 * Create a ranking board at the specified position.
	 */
	public createBoard(id: string, options: RankingBoardOptions): THREE.Group {
		const category = options.category ?? 'total';
		const colors = CATEGORY_COLORS[category];

		const group = new THREE.Group();
		group.position.copy(options.position);
		if (options.rotation !== undefined) {
			group.rotation.y = options.rotation;
		}

		// Main board frame
		const frameGeometry = new THREE.BoxGeometry(2.5, 3.5, 0.15);
		const frameMaterial = new THREE.MeshStandardMaterial({
			color: 0x3a3a3a,
			roughness: 0.4,
			metalness: 0.6,
		});
		const frame = new THREE.Mesh(frameGeometry, frameMaterial);
		frame.position.y = 2;
		frame.castShadow = true;
		frame.receiveShadow = true;
		group.add(frame);

		// Display surface
		const displayGeometry = new THREE.PlaneGeometry(2.2, 3.2);
		const displayMaterial = new THREE.MeshBasicMaterial({
			color: 0x1a1a2e,
		});
		const display = new THREE.Mesh(displayGeometry, displayMaterial);
		display.position.set(0, 2, 0.08);
		group.add(display);

		// Header bar
		const headerGeometry = new THREE.BoxGeometry(2.2, 0.35, 0.02);
		const headerMaterial = new THREE.MeshBasicMaterial({
			color: colors.primary,
		});
		const header = new THREE.Mesh(headerGeometry, headerMaterial);
		header.position.set(0, 3.42, 0.09);
		group.add(header);

		// Category title (using sprite)
		const titleSprite = this.createTextSprite(CATEGORY_NAMES[category], {
			fontSize: 28,
			fontWeight: 'bold',
			color: '#ffffff',
			backgroundColor: 'transparent',
		});
		titleSprite.position.set(0, 3.42, 0.1);
		titleSprite.scale.set(1.5, 0.4, 1);
		group.add(titleSprite);

		// Decorative elements
		const crownGeometry = new THREE.ConeGeometry(0.12, 0.2, 5);
		const crownMaterial = new THREE.MeshStandardMaterial({
			color: 0xffd700,
			roughness: 0.3,
			metalness: 0.8,
		});
		const crown = new THREE.Mesh(crownGeometry, crownMaterial);
		crown.position.set(0, 3.75, 0.1);
		crown.rotation.z = Math.PI;
		group.add(crown);

		// Support post
		const postGeometry = new THREE.CylinderGeometry(0.08, 0.1, 2, 8);
		const postMaterial = new THREE.MeshStandardMaterial({
			color: 0x5c5c5c,
			roughness: 0.5,
			metalness: 0.5,
		});
		const post = new THREE.Mesh(postGeometry, postMaterial);
		post.position.y = 0.25;
		post.castShadow = true;
		group.add(post);

		// Base
		const baseGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.1, 16);
		const baseMaterial = new THREE.MeshStandardMaterial({
			color: colors.accent,
			roughness: 0.6,
			metalness: 0.4,
		});
		const base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.y = 0.05;
		base.castShadow = true;
		base.receiveShadow = true;
		group.add(base);

		// Ranking entries container
		const entriesGroup = new THREE.Group();
		entriesGroup.position.set(0, 2, 0.1);
		group.add(entriesGroup);

		// Store board for updates
		const boardGroup: RankingBoardGroup = {
			group,
			display,
			entriesGroup,
			category,
			entries: [],
			animationTime: 0,
		};
		this.boards.set(id, boardGroup);
		this.scene.add(group);

		return group;
	}

	/**
	 * Create a text sprite for 3D labels.
	 */
	private createTextSprite(text: string, options: {
		fontSize?: number;
		fontWeight?: string;
		color?: string;
		backgroundColor?: string;
	} = {}): THREE.Sprite {
		const canvas = window.document.createElement('canvas');
		const context = canvas.getContext('2d')!;

		canvas.width = 512;
		canvas.height = 64;

		// Background
		if (options.backgroundColor && options.backgroundColor !== 'transparent') {
			context.fillStyle = options.backgroundColor;
			context.fillRect(0, 0, canvas.width, canvas.height);
		}

		// Text
		const fontSize = options.fontSize ?? 24;
		const fontWeight = options.fontWeight ?? 'normal';
		context.font = `${fontWeight} ${fontSize}px "Hiragino Sans", "Meiryo", sans-serif`;
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillStyle = options.color ?? '#ffffff';
		context.fillText(text, canvas.width / 2, canvas.height / 2);

		const texture = new THREE.CanvasTexture(canvas);
		const spriteMaterial = new THREE.SpriteMaterial({
			map: texture,
			transparent: true,
		});
		const sprite = new THREE.Sprite(spriteMaterial);

		return sprite;
	}

	/**
	 * Update ranking entries on a board.
	 */
	public updateRankings(id: string, entries: RankingEntry[]): void {
		const board = this.boards.get(id);
		if (!board) return;

		// Clear existing entries
		while (board.entriesGroup.children.length > 0) {
			const child = board.entriesGroup.children[0];
			if (child instanceof THREE.Sprite) {
				(child.material as THREE.SpriteMaterial).map?.dispose();
				(child.material as THREE.SpriteMaterial).dispose();
			}
			board.entriesGroup.remove(child);
		}

		// Add new entries (show top 10)
		const displayEntries = entries.slice(0, 10);
		const startY = 1.2;
		const entryHeight = 0.28;

		for (let i = 0; i < displayEntries.length; i++) {
			const entry = displayEntries[i];
			const y = startY - i * entryHeight;

			// Rank medal/number
			const rankText = entry.rank <= 3
				? ['🥇', '🥈', '🥉'][entry.rank - 1]
				: `${entry.rank}.`;

			const rankSprite = this.createTextSprite(rankText, {
				fontSize: 20,
				fontWeight: 'bold',
				color: entry.rank <= 3 ? '#ffd700' : '#aaaaaa',
			});
			rankSprite.position.set(-0.85, y, 0);
			rankSprite.scale.set(0.4, 0.25, 1);
			board.entriesGroup.add(rankSprite);

			// Player name
			const nameColor = entry.isCurrentPlayer ? '#4fc3f7' : '#ffffff';
			const nameSprite = this.createTextSprite(
				this.truncateName(entry.playerName, 10),
				{
					fontSize: 18,
					color: nameColor,
				},
			);
			nameSprite.position.set(-0.2, y, 0);
			nameSprite.scale.set(0.8, 0.22, 1);
			board.entriesGroup.add(nameSprite);

			// Score
			const scoreSprite = this.createTextSprite(
				this.formatScore(entry.score),
				{
					fontSize: 16,
					color: '#aaddff',
				},
			);
			scoreSprite.position.set(0.7, y, 0);
			scoreSprite.scale.set(0.6, 0.2, 1);
			board.entriesGroup.add(scoreSprite);

			// Highlight current player
			if (entry.isCurrentPlayer) {
				const highlightGeometry = new THREE.PlaneGeometry(2.1, entryHeight - 0.02);
				const highlightMaterial = new THREE.MeshBasicMaterial({
					color: 0x4fc3f7,
					transparent: true,
					opacity: 0.2,
				});
				const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
				highlight.position.set(0, y, -0.01);
				board.entriesGroup.add(highlight);
			}
		}

		board.entries = entries;
	}

	/**
	 * Truncate player name to max length.
	 */
	private truncateName(name: string, maxLength: number): string {
		if (name.length <= maxLength) return name;
		return name.substring(0, maxLength - 1) + '…';
	}

	/**
	 * Format score with K/M suffixes.
	 */
	private formatScore(score: number): string {
		if (score >= 1000000) {
			return (score / 1000000).toFixed(1) + 'M';
		}
		if (score >= 1000) {
			return (score / 1000).toFixed(1) + 'K';
		}
		return score.toString();
	}

	/**
	 * Remove a ranking board.
	 */
	public removeBoard(id: string): void {
		const board = this.boards.get(id);
		if (board) {
			this.scene.remove(board.group);
			board.group.traverse((object) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					if (Array.isArray(object.material)) {
						object.material.forEach(m => m.dispose());
					} else {
						object.material.dispose();
					}
				} else if (object instanceof THREE.Sprite) {
					(object.material as THREE.SpriteMaterial).map?.dispose();
					(object.material as THREE.SpriteMaterial).dispose();
				}
			});
			this.boards.delete(id);
		}
	}

	/**
	 * Update animations for all boards.
	 */
	public update(): void {
		const delta = this.clock.getDelta();
		const elapsed = this.clock.getElapsedTime();

		for (const board of this.boards.values()) {
			// Subtle floating animation
			board.group.position.y = board.group.position.y + Math.sin(elapsed * 0.5) * 0.001;

			// Gentle rotation for visibility
			// board.group.rotation.y = Math.sin(elapsed * 0.2) * 0.05;
		}
	}

	/**
	 * Clean up all boards.
	 */
	public dispose(): void {
		for (const id of this.boards.keys()) {
			this.removeBoard(id);
		}
		this.boards.clear();
	}

	/**
	 * Get a board by ID.
	 */
	public getBoard(id: string): THREE.Group | undefined {
		return this.boards.get(id)?.group;
	}
}

interface RankingBoardGroup {
	group: THREE.Group;
	display: THREE.Mesh;
	entriesGroup: THREE.Group;
	category: RankingCategory;
	entries: RankingEntry[];
	animationTime: number;
}
