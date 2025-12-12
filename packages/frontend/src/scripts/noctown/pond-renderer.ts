/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

// Pond data from chunk generator
export interface PondData {
	localX: number;
	localZ: number;
	width: number;
	depth: number;
	fishingSpots: Array<{ x: number; z: number }>;
}

// Pond mesh with metadata
export interface PondMesh {
	mesh: THREE.Group;
	pondData: PondData;
	chunkX: number;
	chunkZ: number;
	fishingSpotIndicators: THREE.Mesh[];
}

const CHUNK_SIZE = 16;

// Water material configuration
const WATER_COLOR = 0x2e8bc0;
const WATER_OPACITY = 0.7;
const WATER_DEPTH_OFFSET = 0.3; // Water surface slightly below ground level

// Fishing spot indicator configuration
const FISHING_SPOT_COLOR = 0x4caf50;
const FISHING_SPOT_HOVER_COLOR = 0x8bc34a;
const FISHING_SPOT_SIZE = 0.3;

export class PondRenderer {
	private scene: THREE.Scene;
	private ponds: Map<string, PondMesh> = new Map();
	private waterMaterial: THREE.MeshStandardMaterial;
	private fishingSpotMaterial: THREE.MeshStandardMaterial;
	private fishingSpotGeometry: THREE.SphereGeometry;

	constructor(scene: THREE.Scene) {
		this.scene = scene;

		// Create water material
		this.waterMaterial = new THREE.MeshStandardMaterial({
			color: WATER_COLOR,
			transparent: true,
			opacity: WATER_OPACITY,
			roughness: 0.2,
			metalness: 0.1,
			side: THREE.DoubleSide,
		});

		// Create fishing spot material
		this.fishingSpotMaterial = new THREE.MeshStandardMaterial({
			color: FISHING_SPOT_COLOR,
			transparent: true,
			opacity: 0.6,
			emissive: FISHING_SPOT_COLOR,
			emissiveIntensity: 0.3,
		});

		// Create fishing spot geometry
		this.fishingSpotGeometry = new THREE.SphereGeometry(FISHING_SPOT_SIZE, 16, 16);
	}

	/**
	 * Create pond meshes for a chunk
	 */
	public createPondsForChunk(
		chunkX: number,
		chunkZ: number,
		ponds: PondData[],
		heightMap: number[][],
	): void {
		const chunkKey = `${chunkX},${chunkZ}`;

		// Remove existing ponds for this chunk if any
		this.removePondsForChunk(chunkX, chunkZ);

		for (let i = 0; i < ponds.length; i++) {
			const pondData = ponds[i];
			const pondKey = `${chunkKey}_${i}`;

			// Create pond group
			const pondGroup = new THREE.Group();
			const fishingSpotIndicators: THREE.Mesh[] = [];

			// Calculate world position
			const worldX = chunkX * CHUNK_SIZE + pondData.localX;
			const worldZ = chunkZ * CHUNK_SIZE + pondData.localZ;

			// Get average height for pond area
			let avgHeight = 0;
			let count = 0;
			const halfWidth = Math.floor(pondData.width / 2);
			const halfDepth = Math.floor(pondData.depth / 2);

			for (let dx = -halfWidth; dx <= halfWidth; dx++) {
				for (let dz = -halfDepth; dz <= halfDepth; dz++) {
					const localX = pondData.localX + dx;
					const localZ = pondData.localZ + dz;
					if (localX >= 0 && localX < CHUNK_SIZE && localZ >= 0 && localZ < CHUNK_SIZE) {
						avgHeight += heightMap[localX]?.[localZ] ?? 5;
						count++;
					}
				}
			}
			avgHeight = count > 0 ? avgHeight / count : 5;

			// Create water surface
			const waterGeometry = this.createPondGeometry(pondData.width, pondData.depth);
			const waterMesh = new THREE.Mesh(waterGeometry, this.waterMaterial);
			waterMesh.position.set(0, avgHeight * 0.5 - WATER_DEPTH_OFFSET, 0);
			waterMesh.rotation.x = -Math.PI / 2;
			waterMesh.receiveShadow = true;
			pondGroup.add(waterMesh);

			// Create pond bottom (darker)
			const bottomMaterial = new THREE.MeshStandardMaterial({
				color: 0x1a5276,
				roughness: 0.9,
			});
			const bottomGeometry = this.createPondGeometry(pondData.width - 0.2, pondData.depth - 0.2);
			const bottomMesh = new THREE.Mesh(bottomGeometry, bottomMaterial);
			bottomMesh.position.set(0, avgHeight * 0.5 - 0.5, 0);
			bottomMesh.rotation.x = -Math.PI / 2;
			bottomMesh.receiveShadow = true;
			pondGroup.add(bottomMesh);

			// Create fishing spot indicators
			for (const spot of pondData.fishingSpots) {
				const spotWorldX = chunkX * CHUNK_SIZE + spot.x;
				const spotWorldZ = chunkZ * CHUNK_SIZE + spot.z;
				const spotLocalX = spot.x - pondData.localX;
				const spotLocalZ = spot.z - pondData.localZ;

				// Get height at spot
				const spotHeight = heightMap[spot.x]?.[spot.z] ?? avgHeight;

				const spotMesh = new THREE.Mesh(this.fishingSpotGeometry, this.fishingSpotMaterial.clone());
				spotMesh.position.set(spotLocalX, spotHeight * 0.5 + 0.5, spotLocalZ);

				// Store spot data for interaction
				(spotMesh as any).userData = {
					type: 'fishingSpot',
					pondX: pondData.localX,
					pondZ: pondData.localZ,
					spotX: spot.x,
					spotZ: spot.z,
					worldX: spotWorldX,
					worldZ: spotWorldZ,
				};

				pondGroup.add(spotMesh);
				fishingSpotIndicators.push(spotMesh);
			}

			// Position the group
			pondGroup.position.set(worldX, 0, worldZ);

			// Store pond mesh data
			this.ponds.set(pondKey, {
				mesh: pondGroup,
				pondData,
				chunkX,
				chunkZ,
				fishingSpotIndicators,
			});

			// Add to scene
			this.scene.add(pondGroup);
		}
	}

	/**
	 * Create elliptical pond geometry
	 */
	private createPondGeometry(width: number, depth: number): THREE.BufferGeometry {
		// Create ellipse shape
		const shape = new THREE.Shape();
		const radiusX = width / 2;
		const radiusZ = depth / 2;

		// Draw ellipse
		shape.ellipse(0, 0, radiusX, radiusZ, 0, Math.PI * 2, false, 0);

		// Create geometry from shape
		return new THREE.ShapeGeometry(shape, 32);
	}

	/**
	 * Remove ponds for a chunk
	 */
	public removePondsForChunk(chunkX: number, chunkZ: number): void {
		const chunkKey = `${chunkX},${chunkZ}`;

		// Find and remove all ponds for this chunk
		const keysToRemove: string[] = [];
		for (const [key, pondMesh] of this.ponds) {
			if (key.startsWith(chunkKey + '_')) {
				this.scene.remove(pondMesh.mesh);

				// Dispose geometries and materials
				pondMesh.mesh.traverse((child) => {
					if (child instanceof THREE.Mesh) {
						child.geometry.dispose();
						if (child.material instanceof THREE.Material) {
							child.material.dispose();
						}
					}
				});

				keysToRemove.push(key);
			}
		}

		for (const key of keysToRemove) {
			this.ponds.delete(key);
		}
	}

	/**
	 * Get fishing spot at world position
	 */
	public getFishingSpotAt(worldX: number, worldZ: number, maxDistance: number = 1.5): {
		pondX: number;
		pondZ: number;
		spotX: number;
		spotZ: number;
	} | null {
		for (const pondMesh of this.ponds.values()) {
			for (const indicator of pondMesh.fishingSpotIndicators) {
				const userData = (indicator as any).userData;
				if (userData && userData.type === 'fishingSpot') {
					const distance = Math.sqrt(
						Math.pow(userData.worldX - worldX, 2) +
						Math.pow(userData.worldZ - worldZ, 2),
					);

					if (distance <= maxDistance) {
						return {
							pondX: userData.pondX,
							pondZ: userData.pondZ,
							spotX: userData.spotX,
							spotZ: userData.spotZ,
						};
					}
				}
			}
		}

		return null;
	}

	/**
	 * Highlight fishing spot on hover
	 */
	public highlightFishingSpot(worldX: number, worldZ: number): void {
		for (const pondMesh of this.ponds.values()) {
			for (const indicator of pondMesh.fishingSpotIndicators) {
				const userData = (indicator as any).userData;
				if (userData && userData.type === 'fishingSpot') {
					const distance = Math.sqrt(
						Math.pow(userData.worldX - worldX, 2) +
						Math.pow(userData.worldZ - worldZ, 2),
					);

					const material = indicator.material as THREE.MeshStandardMaterial;
					if (distance <= 2) {
						// Highlight
						material.color.setHex(FISHING_SPOT_HOVER_COLOR);
						material.emissiveIntensity = 0.5;
						indicator.scale.setScalar(1.2);
					} else {
						// Normal
						material.color.setHex(FISHING_SPOT_COLOR);
						material.emissiveIntensity = 0.3;
						indicator.scale.setScalar(1.0);
					}
				}
			}
		}
	}

	/**
	 * Animate water ripples
	 */
	public update(deltaTime: number): void {
		const time = Date.now() * 0.001;

		for (const pondMesh of this.ponds.values()) {
			// Animate water surface
			const waterMesh = pondMesh.mesh.children.find(
				(child) => child instanceof THREE.Mesh && (child as THREE.Mesh).material === this.waterMaterial,
			);

			if (waterMesh) {
				// Subtle wave animation
				(waterMesh as THREE.Mesh).position.y += Math.sin(time * 2) * 0.01;
			}

			// Animate fishing spot indicators
			for (const indicator of pondMesh.fishingSpotIndicators) {
				// Floating animation
				const baseY = indicator.position.y;
				indicator.position.y = baseY + Math.sin(time * 3 + indicator.position.x) * 0.05;
			}
		}
	}

	/**
	 * Clean up all resources
	 */
	public dispose(): void {
		for (const pondMesh of this.ponds.values()) {
			this.scene.remove(pondMesh.mesh);

			pondMesh.mesh.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose();
					if (child.material instanceof THREE.Material) {
						child.material.dispose();
					}
				}
			});
		}

		this.ponds.clear();
		this.waterMaterial.dispose();
		this.fishingSpotMaterial.dispose();
		this.fishingSpotGeometry.dispose();
	}

	/**
	 * Get all ponds
	 */
	public getAllPonds(): Map<string, PondMesh> {
		return this.ponds;
	}
}
