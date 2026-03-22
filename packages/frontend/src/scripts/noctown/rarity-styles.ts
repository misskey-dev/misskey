/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Rarity styling utilities for Noctown items
 */

export type RarityLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface RarityStyle {
	name: string;
	nameJa: string;
	color: string;
	backgroundColor: string;
	borderColor: string;
	glowColor: string;
	particleColor: string;
}

// Rarity definitions
export const rarityStyles: Record<RarityLevel, RarityStyle> = {
	0: {
		name: 'Normal',
		nameJa: 'ノーマル',
		color: '#8b8b8b',
		backgroundColor: 'rgba(139, 139, 139, 0.15)',
		borderColor: 'rgba(139, 139, 139, 0.4)',
		glowColor: 'rgba(139, 139, 139, 0.3)',
		particleColor: '#8b8b8b',
	},
	1: {
		name: 'Rare',
		nameJa: 'レア',
		color: '#2ecc71',
		backgroundColor: 'rgba(46, 204, 113, 0.15)',
		borderColor: 'rgba(46, 204, 113, 0.4)',
		glowColor: 'rgba(46, 204, 113, 0.4)',
		particleColor: '#2ecc71',
	},
	2: {
		name: 'Super Rare',
		nameJa: 'スーパーレア',
		color: '#3498db',
		backgroundColor: 'rgba(52, 152, 219, 0.15)',
		borderColor: 'rgba(52, 152, 219, 0.4)',
		glowColor: 'rgba(52, 152, 219, 0.5)',
		particleColor: '#3498db',
	},
	3: {
		name: 'Super Super Rare',
		nameJa: 'SSレア',
		color: '#9b59b6',
		backgroundColor: 'rgba(155, 89, 182, 0.15)',
		borderColor: 'rgba(155, 89, 182, 0.4)',
		glowColor: 'rgba(155, 89, 182, 0.5)',
		particleColor: '#9b59b6',
	},
	4: {
		name: 'Ultra Rare',
		nameJa: 'ウルトラレア',
		color: '#f39c12',
		backgroundColor: 'rgba(243, 156, 18, 0.15)',
		borderColor: 'rgba(243, 156, 18, 0.5)',
		glowColor: 'rgba(243, 156, 18, 0.6)',
		particleColor: '#f39c12',
	},
	5: {
		name: 'Legendary Rare',
		nameJa: 'レジェンダリー',
		color: '#e74c3c',
		backgroundColor: 'rgba(231, 76, 60, 0.15)',
		borderColor: 'rgba(231, 76, 60, 0.5)',
		glowColor: 'rgba(231, 76, 60, 0.7)',
		particleColor: '#e74c3c',
	},
};

/**
 * Get rarity style by level
 */
export function getRarityStyle(rarity: number): RarityStyle {
	const level = Math.max(0, Math.min(5, rarity)) as RarityLevel;
	return rarityStyles[level];
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity: number): string {
	return getRarityStyle(rarity).color;
}

/**
 * Get rarity name in Japanese
 */
export function getRarityNameJa(rarity: number): string {
	return getRarityStyle(rarity).nameJa;
}

/**
 * Get rarity name in English
 */
export function getRarityName(rarity: number): string {
	return getRarityStyle(rarity).name;
}

/**
 * Get CSS gradient for rarity background
 */
export function getRarityGradient(rarity: number): string {
	const style = getRarityStyle(rarity);
	return `linear-gradient(135deg, ${style.backgroundColor}, ${style.borderColor})`;
}

/**
 * Get box shadow for rarity glow effect
 */
export function getRarityGlow(rarity: number, intensity: number = 1): string {
	const style = getRarityStyle(rarity);
	const size = 8 * intensity;
	const spread = 4 * intensity;
	return `0 0 ${size}px ${spread}px ${style.glowColor}`;
}

/**
 * Get border style for rarity
 */
export function getRarityBorder(rarity: number, width: number = 2): string {
	const style = getRarityStyle(rarity);
	return `${width}px solid ${style.borderColor}`;
}

/**
 * Apply rarity styles to an element
 */
export function applyRarityStyle(element: HTMLElement, rarity: number): void {
	const style = getRarityStyle(rarity);

	element.style.backgroundColor = style.backgroundColor;
	element.style.borderColor = style.borderColor;
	element.style.color = style.color;
}

/**
 * Create CSS class string for rarity
 */
export function getRarityClass(rarity: number): string {
	return `rarity-${rarity}`;
}

/**
 * Check if rarity is considered "high" (3+)
 */
export function isHighRarity(rarity: number): boolean {
	return rarity >= 3;
}

/**
 * Check if rarity is legendary (5)
 */
export function isLegendary(rarity: number): boolean {
	return rarity === 5;
}

/**
 * Get animation class for rarity (for special effects)
 */
export function getRarityAnimation(rarity: number): string | null {
	if (rarity >= 4) return 'rarity-shimmer';
	if (rarity >= 3) return 'rarity-pulse';
	return null;
}

/**
 * Generate rarity stars (visual representation)
 */
export function getRarityStars(rarity: number): string {
	const filledStar = '★';
	const emptyStar = '☆';
	const total = 5;
	const filled = Math.min(rarity, total);
	return filledStar.repeat(filled) + emptyStar.repeat(total - filled);
}

/**
 * Get Three.js compatible color (hex number)
 */
export function getRarityColorHex(rarity: number): number {
	const style = getRarityStyle(rarity);
	return parseInt(style.color.replace('#', ''), 16);
}

/**
 * Item type styling
 */
export const itemTypeStyles: Record<string, { icon: string; color: string; nameJa: string }> = {
	normal: { icon: 'ti-package', color: '#8b8b8b', nameJa: '通常' },
	tool: { icon: 'ti-tool', color: '#3498db', nameJa: 'ツール' },
	skin: { icon: 'ti-shirt', color: '#9b59b6', nameJa: 'スキン' },
	placeable: { icon: 'ti-cube', color: '#2ecc71', nameJa: '設置可能' },
	agent: { icon: 'ti-robot', color: '#f39c12', nameJa: 'エージェント' },
	seed: { icon: 'ti-plant', color: '#27ae60', nameJa: '種' },
	feed: { icon: 'ti-bowl', color: '#e67e22', nameJa: 'エサ' },
};

/**
 * Get item type style
 */
export function getItemTypeStyle(type: string): { icon: string; color: string; nameJa: string } {
	return itemTypeStyles[type] ?? itemTypeStyles.normal;
}
