/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

// Environment object types (matching backend chunk-generator.ts)
export type EnvironmentType = 'tree' | 'rock' | 'flower' | 'grass_tuft' | 'cactus' | 'bush' | 'mushroom' | 'ice_crystal';

export interface EnvironmentObjectData {
	type: EnvironmentType;
	localX: number;
	localZ: number;
	variant: number;
	scale: number;
}

// Color palettes for different variants
const TREE_COLORS = [0x228b22, 0x2e8b57, 0x3cb371, 0x006400];
const FLOWER_COLORS = [0xff69b4, 0xffff00, 0xff6347, 0x9932cc];
const ROCK_COLORS = [0x808080, 0xa9a9a9, 0x696969, 0x778899];
const MUSHROOM_COLORS = [0xff4500, 0xffd700, 0x8b4513, 0xf0e68c];

export class EnvironmentObjectFactory {
	private static geometryCache: Map<string, THREE.BufferGeometry> = new Map();
	private static materialCache: Map<string, THREE.Material> = new Map();

	/**
	 * Create a 3D object for the given environment data
	 */
	public static createObject(data: EnvironmentObjectData, worldX: number, worldZ: number, height: number): THREE.Object3D {
		switch (data.type) {
			case 'tree':
				return this.createTree(data, worldX, worldZ, height);
			case 'rock':
				return this.createRock(data, worldX, worldZ, height);
			case 'flower':
				return this.createFlower(data, worldX, worldZ, height);
			case 'grass_tuft':
				return this.createGrassTuft(data, worldX, worldZ, height);
			case 'cactus':
				return this.createCactus(data, worldX, worldZ, height);
			case 'bush':
				return this.createBush(data, worldX, worldZ, height);
			case 'mushroom':
				return this.createMushroom(data, worldX, worldZ, height);
			case 'ice_crystal':
				return this.createIceCrystal(data, worldX, worldZ, height);
			default:
				return this.createFlower(data, worldX, worldZ, height);
		}
	}

	/**
	 * Create a tree (trunk + foliage)
	 */
	private static createTree(data: EnvironmentObjectData, worldX: number, worldZ: number, height: number): THREE.Group {
		const group = new THREE.Group();
		const scale = data.scale;

		// Trunk
		const trunkGeometry = this.getGeometry('tree_trunk', () =>
			new THREE.CylinderGeometry(0.2, 0.3, 2, 8),
		);
		const trunkMaterial = this.getMaterial('tree_trunk', () =>
			new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 }),
		);
		const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
		trunk.position.y = 1 * scale;
		trunk.scale.setScalar(scale);
		trunk.castShadow = true;
		group.add(trunk);

		// Foliage (varies by variant)
		const foliageColor = TREE_COLORS[data.variant % TREE_COLORS.length];
		const foliageMaterial = this.getMaterial(`tree_foliage_${data.variant}`, () =>
			new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.8 }),
		);

		if (data.variant % 2 === 0) {
			// Cone-shaped tree
			const foliageGeometry = this.getGeometry('tree_foliage_cone', () =>
				new THREE.ConeGeometry(1, 2.5, 8),
			);
			const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
			foliage.position.y = 2.5 * scale;
			foliage.scale.setScalar(scale);
			foliage.castShadow = true;
			group.add(foliage);
		} else {
			// Spherical tree
			const foliageGeometry = this.getGeometry('tree_foliage_sphere', () =>
				new THREE.SphereGeometry(1.2, 8, 8),
			);
			const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
			foliage.position.y = 2.8 * scale;
			foliage.scale.setScalar(scale);
			foliage.castShadow = true;
			group.add(foliage);
		}

		group.position.set(worldX, height * 0.2, worldZ);
		return group;
	}

	/**
	 * Create a rock
	 */
	private static createRock(data: EnvironmentObjectData, worldX: number, worldZ: number, height: number): THREE.Mesh {
		const rockGeometry = this.getGeometry(`rock_${data.variant}`, () => {
			const geo = new THREE.DodecahedronGeometry(0.4 + data.variant * 0.1, 0);
			// Slightly deform for natural look
			const positions = geo.attributes.position;
			for (let i = 0; i < positions.count; i++) {
				const x = positions.getX(i);
				const y = positions.getY(i);
				const z = positions.getZ(i);
				positions.setXYZ(
					i,
					x * (0.9 + Math.random() * 0.2),
					y * (0.8 + Math.random() * 0.4),
					z * (0.9 + Math.random() * 0.2),
				);
			}
			geo.computeVertexNormals();
			return geo;
		});

		const color = ROCK_COLORS[data.variant % ROCK_COLORS.length];
		const rockMaterial = this.getMaterial(`rock_${data.variant}`, () =>
			new THREE.MeshStandardMaterial({ color, roughness: 0.95, flatShading: true }),
		);

		const rock = new THREE.Mesh(rockGeometry, rockMaterial);
		rock.position.set(worldX, height * 0.2 + 0.2 * data.scale, worldZ);
		rock.scale.setScalar(data.scale);
		rock.rotation.y = data.variant * Math.PI / 2;
		rock.castShadow = true;
		rock.receiveShadow = true;
		return rock;
	}

	/**
	 * Create a flower
	 */
	private static createFlower(data: EnvironmentObjectData, worldX: number, worldZ: number, height: number): THREE.Group {
		const group = new THREE.Group();
		const scale = data.scale * 0.5;

		// Stem
		const stemGeometry = this.getGeometry('flower_stem', () =>
			new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6),
		);
		const stemMaterial = this.getMaterial('flower_stem', () =>
			new THREE.MeshStandardMaterial({ color: 0x228b22 }),
		);
		const stem = new THREE.Mesh(stemGeometry, stemMaterial);
		stem.position.y = 0.15;
		stem.scale.setScalar(scale);
		group.add(stem);

		// Petals
		const color = FLOWER_COLORS[data.variant % FLOWER_COLORS.length];
		const petalGeometry = this.getGeometry('flower_petal', () =>
			new THREE.SphereGeometry(0.08, 8, 8),
		);
		const petalMaterial = this.getMaterial(`flower_petal_${data.variant}`, () =>
			new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2 }),
		);

		const petalCount = 5 + data.variant;
		for (let i = 0; i < petalCount; i++) {
			const petal = new THREE.Mesh(petalGeometry, petalMaterial);
			const angle = (i / petalCount) * Math.PI * 2;
			petal.position.set(
				Math.cos(angle) * 0.08,
				0.35,
				Math.sin(angle) * 0.08,
			);
			petal.scale.setScalar(scale);
			group.add(petal);
		}

		// Center
		const centerGeometry = this.getGeometry('flower_center', () =>
			new THREE.SphereGeometry(0.05, 8, 8),
		);
		const centerMaterial = this.getMaterial('flower_center', () =>
			new THREE.MeshStandardMaterial({ color: 0xffff00 }),
		);
		const center = new THREE.Mesh(centerGeometry, centerMaterial);
		center.position.y = 0.35;
		center.scale.setScalar(scale);
		group.add(center);

		group.position.set(worldX, height * 0.2, worldZ);
		return group;
	}

	/**
	 * Create a grass tuft
	 */
	private static createGrassTuft(data: EnvironmentObjectData, worldX: number, worldZ: number, height: number): THREE.Group {
		const group = new THREE.Group();
		const scale = data.scale * 0.7;

		const bladeGeometry = this.getGeometry('grass_blade', () =>
			new THREE.ConeGeometry(0.02, 0.3, 4),
		);
		const bladeMaterial = this.getMaterial('grass_blade', () =>
			new THREE.MeshStandardMaterial({ color: 0x7cfc00, side: THREE.DoubleSide }),
		);

		const bladeCount = 5 + data.variant * 2;
		for (let i = 0; i < bladeCount; i++) {
			const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
			const angle = (i / bladeCount) * Math.PI * 2 + data.variant;
			const radius = 0.05 + Math.random() * 0.05;
			blade.position.set(
				Math.cos(angle) * radius,
				0.15 * scale,
				Math.sin(angle) * radius,
			);
			blade.rotation.x = (Math.random() - 0.5) * 0.3;
			blade.rotation.z = (Math.random() - 0.5) * 0.3;
			blade.scale.setScalar(scale);
			group.add(blade);
		}

		group.position.set(worldX, height * 0.2, worldZ);
		return group;
	}

	/**
	 * Create a cactus
	 */
	private static createCactus(data: EnvironmentObjectData, worldX: number, worldZ: number, height: number): THREE.Group {
		const group = new THREE.Group();
		const scale = data.scale;

		const cactusMaterial = this.getMaterial('cactus', () =>
			new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.7 }),
		);

		// Main body
		const bodyGeometry = this.getGeometry('cactus_body', () =>
			new THREE.CylinderGeometry(0.2, 0.25, 1.5, 8),
		);
		const body = new THREE.Mesh(bodyGeometry, cactusMaterial);
		body.position.y = 0.75 * scale;
		body.scale.setScalar(scale);
		body.castShadow = true;
		group.add(body);

		// Arms based on variant
		if (data.variant > 1) {
			const armGeometry = this.getGeometry('cactus_arm', () =>
				new THREE.CylinderGeometry(0.1, 0.12, 0.6, 8),
			);

			// Left arm
			const leftArm = new THREE.Mesh(armGeometry, cactusMaterial);
			leftArm.position.set(-0.25, 0.8, 0);
			leftArm.rotation.z = Math.PI / 3;
			leftArm.scale.setScalar(scale);
			leftArm.castShadow = true;
			group.add(leftArm);

			if (data.variant > 2) {
				// Right arm
				const rightArm = new THREE.Mesh(armGeometry, cactusMaterial);
				rightArm.position.set(0.25, 0.6, 0);
				rightArm.rotation.z = -Math.PI / 3;
				rightArm.scale.setScalar(scale);
				rightArm.castShadow = true;
				group.add(rightArm);
			}
		}

		group.position.set(worldX, height * 0.2, worldZ);
		return group;
	}

	/**
	 * Create a bush
	 */
	private static createBush(data: EnvironmentObjectData, worldX: number, worldZ: number, height: number): THREE.Mesh {
		const bushGeometry = this.getGeometry('bush', () =>
			new THREE.SphereGeometry(0.5, 8, 6),
		);

		const color = TREE_COLORS[data.variant % TREE_COLORS.length];
		const bushMaterial = this.getMaterial(`bush_${data.variant}`, () =>
			new THREE.MeshStandardMaterial({ color, roughness: 0.85 }),
		);

		const bush = new THREE.Mesh(bushGeometry, bushMaterial);
		bush.position.set(worldX, height * 0.2 + 0.25 * data.scale, worldZ);
		bush.scale.set(data.scale, data.scale * 0.8, data.scale);
		bush.castShadow = true;
		return bush;
	}

	/**
	 * Create a mushroom
	 */
	private static createMushroom(data: EnvironmentObjectData, worldX: number, worldZ: number, height: number): THREE.Group {
		const group = new THREE.Group();
		const scale = data.scale * 0.6;

		// Stem
		const stemGeometry = this.getGeometry('mushroom_stem', () =>
			new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8),
		);
		const stemMaterial = this.getMaterial('mushroom_stem', () =>
			new THREE.MeshStandardMaterial({ color: 0xfffaf0 }),
		);
		const stem = new THREE.Mesh(stemGeometry, stemMaterial);
		stem.position.y = 0.15;
		stem.scale.setScalar(scale);
		group.add(stem);

		// Cap
		const capGeometry = this.getGeometry('mushroom_cap', () =>
			new THREE.SphereGeometry(0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
		);
		const color = MUSHROOM_COLORS[data.variant % MUSHROOM_COLORS.length];
		const capMaterial = this.getMaterial(`mushroom_cap_${data.variant}`, () =>
			new THREE.MeshStandardMaterial({ color, roughness: 0.6 }),
		);
		const cap = new THREE.Mesh(capGeometry, capMaterial);
		cap.position.y = 0.3;
		cap.scale.setScalar(scale);
		cap.castShadow = true;
		group.add(cap);

		group.position.set(worldX, height * 0.2, worldZ);
		return group;
	}

	/**
	 * Create an ice crystal
	 */
	private static createIceCrystal(data: EnvironmentObjectData, worldX: number, worldZ: number, height: number): THREE.Group {
		const group = new THREE.Group();
		const scale = data.scale;

		const crystalMaterial = this.getMaterial('ice_crystal', () =>
			new THREE.MeshStandardMaterial({
				color: 0x87ceeb,
				transparent: true,
				opacity: 0.8,
				roughness: 0.1,
				metalness: 0.3,
			}),
		);

		// Main crystal
		const mainGeometry = this.getGeometry('ice_main', () =>
			new THREE.OctahedronGeometry(0.3, 0),
		);
		const main = new THREE.Mesh(mainGeometry, crystalMaterial);
		main.position.y = 0.4;
		main.scale.set(scale, scale * 1.5, scale);
		main.castShadow = true;
		group.add(main);

		// Smaller crystals based on variant
		if (data.variant > 1) {
			const smallGeometry = this.getGeometry('ice_small', () =>
				new THREE.OctahedronGeometry(0.15, 0),
			);

			for (let i = 0; i < data.variant; i++) {
				const small = new THREE.Mesh(smallGeometry, crystalMaterial);
				const angle = (i / data.variant) * Math.PI * 2;
				small.position.set(
					Math.cos(angle) * 0.25,
					0.2,
					Math.sin(angle) * 0.25,
				);
				small.scale.set(scale * 0.7, scale, scale * 0.7);
				small.rotation.y = angle;
				small.castShadow = true;
				group.add(small);
			}
		}

		group.position.set(worldX, height * 0.2, worldZ);
		return group;
	}

	/**
	 * Get or create cached geometry
	 */
	private static getGeometry(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
		let geometry = this.geometryCache.get(key);
		if (!geometry) {
			geometry = factory();
			this.geometryCache.set(key, geometry);
		}
		return geometry;
	}

	/**
	 * Get or create cached material
	 */
	private static getMaterial(key: string, factory: () => THREE.Material): THREE.Material {
		let material = this.materialCache.get(key);
		if (!material) {
			material = factory();
			this.materialCache.set(key, material);
		}
		return material;
	}

	/**
	 * Dispose all cached resources
	 */
	public static dispose(): void {
		for (const geometry of this.geometryCache.values()) {
			geometry.dispose();
		}
		this.geometryCache.clear();

		for (const material of this.materialCache.values()) {
			material.dispose();
		}
		this.materialCache.clear();
	}
}

/**
 * Batch renderer for environment objects within a chunk
 */
export class ChunkEnvironmentRenderer {
	private objects: THREE.Object3D[] = [];
	private group: THREE.Group;

	constructor() {
		this.group = new THREE.Group();
	}

	/**
	 * Add environment objects from chunk data
	 */
	public addObjects(
		environmentObjects: EnvironmentObjectData[],
		chunkX: number,
		chunkZ: number,
		heightMap: number[][],
	): void {
		const chunkSize = 16;

		for (const objData of environmentObjects) {
			const worldX = chunkX * chunkSize + objData.localX;
			const worldZ = chunkZ * chunkSize + objData.localZ;
			const height = heightMap[objData.localX]?.[objData.localZ] ?? 8;

			const obj = EnvironmentObjectFactory.createObject(objData, worldX, worldZ, height);
			this.objects.push(obj);
			this.group.add(obj);
		}
	}

	/**
	 * Get the THREE.js group containing all objects
	 */
	public getGroup(): THREE.Group {
		return this.group;
	}

	/**
	 * Clear all objects
	 */
	public clear(): void {
		for (const obj of this.objects) {
			this.group.remove(obj);
		}
		this.objects = [];
	}

	/**
	 * Get object count
	 */
	public getObjectCount(): number {
		return this.objects.length;
	}
}
