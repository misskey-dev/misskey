/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

// Cache for loaded textures
const textureCache = new Map<string, THREE.Texture>();
const failedUrls = new Set<string>();

// Fallback texture (X mark)
let fallbackTexture: THREE.Texture | null = null;

/**
 * Create fallback texture with X mark
 */
function createFallbackTexture(): THREE.Texture {
	if (fallbackTexture) {
		return fallbackTexture;
	}

	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d');

	if (ctx) {
		// Background
		ctx.fillStyle = '#2a2a2a';
		ctx.fillRect(0, 0, 64, 64);

		// Border
		ctx.strokeStyle = '#ff4444';
		ctx.lineWidth = 2;
		ctx.strokeRect(2, 2, 60, 60);

		// X mark
		ctx.strokeStyle = '#ff4444';
		ctx.lineWidth = 4;
		ctx.lineCap = 'round';

		ctx.beginPath();
		ctx.moveTo(16, 16);
		ctx.lineTo(48, 48);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(48, 16);
		ctx.lineTo(16, 48);
		ctx.stroke();
	}

	fallbackTexture = new THREE.CanvasTexture(canvas);
	fallbackTexture.colorSpace = THREE.SRGBColorSpace;

	return fallbackTexture;
}

/**
 * Load texture with fallback support
 */
export function loadTexture(
	url: string,
	onLoad?: (texture: THREE.Texture) => void,
	onError?: (error: Error) => void,
): THREE.Texture {
	// Check if already failed
	if (failedUrls.has(url)) {
		const fallback = createFallbackTexture();
		if (onLoad) onLoad(fallback);
		return fallback;
	}

	// Check cache
	const cached = textureCache.get(url);
	if (cached) {
		if (onLoad) onLoad(cached);
		return cached;
	}

	// Load new texture
	const loader = new THREE.TextureLoader();
	const texture = loader.load(
		url,
		(loadedTexture) => {
			loadedTexture.colorSpace = THREE.SRGBColorSpace;
			textureCache.set(url, loadedTexture);
			if (onLoad) onLoad(loadedTexture);
		},
		undefined, // Progress callback
		(error) => {
			console.warn(`Failed to load texture: ${url}`, error);
			failedUrls.add(url);
			if (onError) onError(new Error(`Failed to load texture: ${url}`));
		},
	);

	return texture;
}

/**
 * Load texture with promise
 */
export function loadTextureAsync(url: string): Promise<THREE.Texture> {
	return new Promise((resolve, reject) => {
		// Check if already failed
		if (failedUrls.has(url)) {
			resolve(createFallbackTexture());
			return;
		}

		// Check cache
		const cached = textureCache.get(url);
		if (cached) {
			resolve(cached);
			return;
		}

		const loader = new THREE.TextureLoader();
		loader.load(
			url,
			(texture) => {
				texture.colorSpace = THREE.SRGBColorSpace;
				textureCache.set(url, texture);
				resolve(texture);
			},
			undefined,
			(error) => {
				console.warn(`Failed to load texture: ${url}`, error);
				failedUrls.add(url);
				// Return fallback instead of rejecting
				resolve(createFallbackTexture());
			},
		);
	});
}

/**
 * Load image with fallback (for non-Three.js use)
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => resolve(img);
		img.onerror = () => {
			console.warn(`Failed to load image: ${url}`);
			failedUrls.add(url);

			// Create fallback image
			const fallbackCanvas = document.createElement('canvas');
			fallbackCanvas.width = 64;
			fallbackCanvas.height = 64;
			const ctx = fallbackCanvas.getContext('2d');

			if (ctx) {
				ctx.fillStyle = '#2a2a2a';
				ctx.fillRect(0, 0, 64, 64);
				ctx.strokeStyle = '#ff4444';
				ctx.lineWidth = 4;
				ctx.lineCap = 'round';
				ctx.beginPath();
				ctx.moveTo(16, 16);
				ctx.lineTo(48, 48);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(48, 16);
				ctx.lineTo(16, 48);
				ctx.stroke();
			}

			const fallbackImg = new Image();
			fallbackImg.src = fallbackCanvas.toDataURL();
			fallbackImg.onload = () => resolve(fallbackImg);
		};

		img.src = url;
	});
}

/**
 * Create placeholder texture for items without images
 */
export function createPlaceholderTexture(
	text: string,
	bgColor = '#3a3a5c',
	textColor = '#ffffff',
): THREE.Texture {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d');

	if (ctx) {
		// Background
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, 64, 64);

		// Border
		ctx.strokeStyle = textColor;
		ctx.lineWidth = 2;
		ctx.strokeRect(4, 4, 56, 56);

		// Text (first character)
		ctx.fillStyle = textColor;
		ctx.font = 'bold 32px sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(text.charAt(0).toUpperCase(), 32, 32);
	}

	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;

	return texture;
}

/**
 * Clear texture cache
 */
export function clearTextureCache(): void {
	textureCache.forEach((texture) => {
		texture.dispose();
	});
	textureCache.clear();
	failedUrls.clear();
}

/**
 * Get fallback texture directly
 */
export function getFallbackTexture(): THREE.Texture {
	return createFallbackTexture();
}

/**
 * Check if URL has failed to load before
 */
export function hasFailedToLoad(url: string): boolean {
	return failedUrls.has(url);
}

/**
 * Mark URL as failed (for manual failure tracking)
 */
export function markAsFailed(url: string): void {
	failedUrls.add(url);
}
