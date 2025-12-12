/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export type ChestRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface TreasureChestData {
	id: string;
	localX: number;
	localZ: number;
	positionY: number;
	rarity: ChestRarity;
	interiorId: string | null;
}

interface ChestMesh extends THREE.Group {
	userData: {
		chestId: string;
		rarity: ChestRarity;
		isOpen: boolean;
		animationProgress: number;
	};
}

// Colors for different rarities
const RARITY_COLORS: Record<ChestRarity, { primary: number; accent: number; glow: number }> = {
	common: {
		primary: 0x8b4513, // Brown
		accent: 0xb8860b, // Dark golden rod
		glow: 0xffd700,
	},
	uncommon: {
		primary: 0x228b22, // Forest green
		accent: 0x32cd32, // Lime green
		glow: 0x00ff00,
	},
	rare: {
		primary: 0x4169e1, // Royal blue
		accent: 0x1e90ff, // Dodger blue
		glow: 0x00bfff,
	},
	epic: {
		primary: 0x8b008b, // Dark magenta
		accent: 0xda70d6, // Orchid
		glow: 0xff00ff,
	},
	legendary: {
		primary: 0xffa500, // Orange
		accent: 0xffd700, // Gold
		glow: 0xffff00,
	},
};

// Particle effect for legendary chests
interface ParticleSystem {
	particles: THREE.Points;
	velocities: Float32Array;
}

export class TreasureChestRenderer {
	private scene: THREE.Scene;
	private chests: Map<string, ChestMesh> = new Map();
	private particleSystems: Map<string, ParticleSystem> = new Map();
	private glowMaterials: Map<string, THREE.MeshBasicMaterial> = new Map();

	constructor(scene: THREE.Scene) {
		this.scene = scene;
	}

	/**
	 * Create a treasure chest mesh at the specified position.
	 */
	public createChest(data: TreasureChestData, chunkX: number, chunkZ: number): THREE.Group {
		const chunkSize = 64;
		const worldX = chunkX * chunkSize + data.localX;
		const worldZ = chunkZ * chunkSize + data.localZ;

		const chestGroup = new THREE.Group() as ChestMesh;
		chestGroup.userData = {
			chestId: data.id,
			rarity: data.rarity,
			isOpen: false,
			animationProgress: 0,
		};

		const colors = RARITY_COLORS[data.rarity];

		// Chest body (box)
		const bodyGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.6);
		const bodyMaterial = new THREE.MeshStandardMaterial({
			color: colors.primary,
			roughness: 0.6,
			metalness: 0.2,
		});
		const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.y = 0.25;
		body.castShadow = true;
		body.receiveShadow = true;
		chestGroup.add(body);

		// Chest lid (rotatable)
		const lidGroup = new THREE.Group();
		lidGroup.position.set(0, 0.5, -0.3);
		lidGroup.name = 'lid';

		const lidGeometry = new THREE.BoxGeometry(0.8, 0.15, 0.6);
		const lidMaterial = new THREE.MeshStandardMaterial({
			color: colors.primary,
			roughness: 0.6,
			metalness: 0.2,
		});
		const lid = new THREE.Mesh(lidGeometry, lidMaterial);
		lid.position.set(0, 0.075, 0.3);
		lid.castShadow = true;
		lidGroup.add(lid);

		// Lid top curve (half cylinder to make it look like a traditional chest)
		const lidTopGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8, 1, false, 0, Math.PI);
		const lidTop = new THREE.Mesh(lidTopGeometry, lidMaterial);
		lidTop.rotation.z = Math.PI / 2;
		lidTop.rotation.y = Math.PI / 2;
		lidTop.position.set(0, 0.15, 0.3);
		lidTop.castShadow = true;
		lidGroup.add(lidTop);

		chestGroup.add(lidGroup);

		// Metal bands
		const bandMaterial = new THREE.MeshStandardMaterial({
			color: colors.accent,
			roughness: 0.3,
			metalness: 0.8,
		});

		// Horizontal bands on body
		for (const z of [-0.2, 0.2]) {
			const bandGeometry = new THREE.BoxGeometry(0.85, 0.08, 0.05);
			const band = new THREE.Mesh(bandGeometry, bandMaterial);
			band.position.set(0, 0.25, z);
			chestGroup.add(band);
		}

		// Lock mechanism
		const lockGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.05);
		const lock = new THREE.Mesh(lockGeometry, bandMaterial);
		lock.position.set(0, 0.4, 0.33);
		chestGroup.add(lock);

		// Glow effect for rare+ chests
		if (data.rarity !== 'common') {
			const glowGeometry = new THREE.SphereGeometry(0.6, 16, 16);
			const glowMaterial = new THREE.MeshBasicMaterial({
				color: colors.glow,
				transparent: true,
				opacity: 0.15,
				side: THREE.BackSide,
			});
			const glow = new THREE.Mesh(glowGeometry, glowMaterial);
			glow.position.y = 0.3;
			glow.name = 'glow';
			chestGroup.add(glow);

			this.glowMaterials.set(data.id, glowMaterial);
		}

		// Add particle effects for legendary chests
		if (data.rarity === 'legendary') {
			const particleSystem = this.createParticleSystem(colors.glow);
			particleSystem.particles.position.set(0, 0.3, 0);
			chestGroup.add(particleSystem.particles);
			this.particleSystems.set(data.id, particleSystem);
		}

		chestGroup.position.set(worldX, data.positionY, worldZ);
		this.scene.add(chestGroup);
		this.chests.set(data.id, chestGroup);

		return chestGroup;
	}

	/**
	 * Create particle system for legendary chests.
	 */
	private createParticleSystem(color: number): ParticleSystem {
		const particleCount = 20;
		const positions = new Float32Array(particleCount * 3);
		const velocities = new Float32Array(particleCount * 3);

		for (let i = 0; i < particleCount; i++) {
			const i3 = i * 3;
			// Random position in a sphere around the chest
			const theta = Math.random() * Math.PI * 2;
			const phi = Math.random() * Math.PI;
			const r = 0.3 + Math.random() * 0.3;

			positions[i3] = r * Math.sin(phi) * Math.cos(theta);
			positions[i3 + 1] = r * Math.cos(phi);
			positions[i3 + 2] = r * Math.sin(phi) * Math.sin(theta);

			// Random upward velocities
			velocities[i3] = (Math.random() - 0.5) * 0.02;
			velocities[i3 + 1] = 0.01 + Math.random() * 0.02;
			velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

		const material = new THREE.PointsMaterial({
			color,
			size: 0.05,
			transparent: true,
			opacity: 0.8,
			blending: THREE.AdditiveBlending,
		});

		const particles = new THREE.Points(geometry, material);

		return { particles, velocities };
	}

	/**
	 * Remove a chest from the scene.
	 */
	public removeChest(chestId: string): void {
		const chest = this.chests.get(chestId);
		if (chest) {
			this.scene.remove(chest);
			this.chests.delete(chestId);
		}

		this.particleSystems.delete(chestId);
		this.glowMaterials.delete(chestId);
	}

	/**
	 * Remove all chests from the scene.
	 */
	public removeAllChests(): void {
		for (const chest of this.chests.values()) {
			this.scene.remove(chest);
		}
		this.chests.clear();
		this.particleSystems.clear();
		this.glowMaterials.clear();
	}

	/**
	 * Play chest opening animation.
	 */
	public openChest(chestId: string): void {
		const chest = this.chests.get(chestId);
		if (chest && !chest.userData.isOpen) {
			chest.userData.isOpen = true;
			chest.userData.animationProgress = 0;
		}
	}

	/**
	 * Reset chest to closed state.
	 */
	public closeChest(chestId: string): void {
		const chest = this.chests.get(chestId);
		if (chest) {
			chest.userData.isOpen = false;
			chest.userData.animationProgress = 0;

			// Reset lid rotation
			const lid = chest.getObjectByName('lid');
			if (lid) {
				lid.rotation.x = 0;
			}
		}
	}

	/**
	 * Check if a position is near any chest.
	 * Returns the chest ID if within range, null otherwise.
	 */
	public getNearbyChest(position: THREE.Vector3, range: number = 3.0): string | null {
		for (const [chestId, chest] of this.chests) {
			const distance = position.distanceTo(chest.position);
			if (distance <= range) {
				return chestId;
			}
		}
		return null;
	}

	/**
	 * Get chest mesh by ID.
	 */
	public getChest(chestId: string): THREE.Group | undefined {
		return this.chests.get(chestId);
	}

	/**
	 * Update animations and effects.
	 * Should be called in the render loop.
	 */
	public update(deltaTime: number): void {
		const time = Date.now() * 0.001;

		// Update chest opening animations
		for (const chest of this.chests.values()) {
			if (chest.userData.isOpen && chest.userData.animationProgress < 1) {
				chest.userData.animationProgress = Math.min(1, chest.userData.animationProgress + deltaTime * 2);

				const lid = chest.getObjectByName('lid');
				if (lid) {
					// Easing function for smooth animation
					const progress = this.easeOutBack(chest.userData.animationProgress);
					lid.rotation.x = -progress * Math.PI * 0.7; // Open to about 126 degrees
				}
			}
		}

		// Update glow effects
		for (const [chestId, material] of this.glowMaterials) {
			const chest = this.chests.get(chestId);
			if (chest && !chest.userData.isOpen) {
				// Pulsing glow effect
				const pulse = Math.sin(time * 2) * 0.05 + 0.15;
				material.opacity = pulse;
			} else if (chest && chest.userData.isOpen) {
				// Brighter glow when open
				material.opacity = 0.3;
			}
		}

		// Update particle systems
		for (const [chestId, system] of this.particleSystems) {
			const chest = this.chests.get(chestId);
			if (!chest) continue;

			const positions = system.particles.geometry.attributes.position.array as Float32Array;

			for (let i = 0; i < positions.length / 3; i++) {
				const i3 = i * 3;

				// Move particles upward
				positions[i3] += system.velocities[i3];
				positions[i3 + 1] += system.velocities[i3 + 1];
				positions[i3 + 2] += system.velocities[i3 + 2];

				// Reset particles that go too high
				if (positions[i3 + 1] > 1.0) {
					const theta = Math.random() * Math.PI * 2;
					const r = 0.2 + Math.random() * 0.2;
					positions[i3] = r * Math.cos(theta);
					positions[i3 + 1] = 0;
					positions[i3 + 2] = r * Math.sin(theta);
				}
			}

			system.particles.geometry.attributes.position.needsUpdate = true;
		}
	}

	/**
	 * Easing function for smooth animations.
	 */
	private easeOutBack(x: number): number {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
	}

	/**
	 * Get all chest IDs currently in the scene.
	 */
	public getAllChestIds(): string[] {
		return Array.from(this.chests.keys());
	}

	/**
	 * Check if a chest exists.
	 */
	public hasChest(chestId: string): boolean {
		return this.chests.has(chestId);
	}
}
