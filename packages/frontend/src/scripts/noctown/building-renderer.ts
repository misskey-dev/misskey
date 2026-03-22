/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export type BuildingType = 'shop' | 'inn' | 'house' | 'guild' | 'barn' | 'well' | 'tower';

export interface BuildingRenderData {
	type: BuildingType;
	worldX: number;
	worldZ: number;
	rotation: number;
	width: number;
	depth: number;
	interiorId: string;
}

interface BuildingMaterials {
	wall: THREE.Material;
	roof: THREE.Material;
	door: THREE.Material;
	window: THREE.Material;
	wood: THREE.Material;
	stone: THREE.Material;
}

interface BuildingConfig {
	wallColor: number;
	roofColor: number;
	height: number;
	roofHeight: number;
	hasWindows: boolean;
	hasChimney: boolean;
	roofStyle: 'gable' | 'flat' | 'cone' | 'dome';
}

const BUILDING_CONFIGS: Record<BuildingType, BuildingConfig> = {
	shop: {
		wallColor: 0xf5deb3, // Wheat
		roofColor: 0x8b4513, // SaddleBrown
		height: 3,
		roofHeight: 1.5,
		hasWindows: true,
		hasChimney: false,
		roofStyle: 'gable',
	},
	inn: {
		wallColor: 0xdeb887, // BurlyWood
		roofColor: 0x8b0000, // DarkRed
		height: 5,
		roofHeight: 2,
		hasWindows: true,
		hasChimney: true,
		roofStyle: 'gable',
	},
	house: {
		wallColor: 0xfaf0e6, // Linen
		roofColor: 0x654321, // Dark Brown
		height: 2.5,
		roofHeight: 1.2,
		hasWindows: true,
		hasChimney: true,
		roofStyle: 'gable',
	},
	guild: {
		wallColor: 0x696969, // DimGray
		roofColor: 0x2f4f4f, // DarkSlateGray
		height: 6,
		roofHeight: 2,
		hasWindows: true,
		hasChimney: false,
		roofStyle: 'gable',
	},
	barn: {
		wallColor: 0x8b0000, // DarkRed
		roofColor: 0x654321, // Dark Brown
		height: 4,
		roofHeight: 2,
		hasWindows: false,
		hasChimney: false,
		roofStyle: 'gable',
	},
	well: {
		wallColor: 0x808080, // Gray
		roofColor: 0x8b4513, // SaddleBrown
		height: 1,
		roofHeight: 0.8,
		hasWindows: false,
		hasChimney: false,
		roofStyle: 'cone',
	},
	tower: {
		wallColor: 0xa9a9a9, // DarkGray
		roofColor: 0x4169e1, // RoyalBlue
		height: 8,
		roofHeight: 2,
		hasWindows: true,
		hasChimney: false,
		roofStyle: 'cone',
	},
};

/**
 * Building renderer factory for Noctown
 */
export class BuildingRenderer {
	private scene: THREE.Scene;
	private materials: BuildingMaterials;
	private buildings: Map<string, THREE.Group> = new Map();
	private geometryCache: Map<string, THREE.BufferGeometry> = new Map();

	constructor(scene: THREE.Scene) {
		this.scene = scene;
		this.materials = this.createMaterials();
	}

	private createMaterials(): BuildingMaterials {
		return {
			wall: new THREE.MeshStandardMaterial({ roughness: 0.9 }),
			roof: new THREE.MeshStandardMaterial({ roughness: 0.7 }),
			door: new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 }),
			window: new THREE.MeshStandardMaterial({
				color: 0x87ceeb,
				transparent: true,
				opacity: 0.7,
				emissive: 0x87ceeb,
				emissiveIntensity: 0.3,
			}),
			wood: new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 }),
			stone: new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.9 }),
		};
	}

	/**
	 * Render a building
	 */
	public renderBuilding(data: BuildingRenderData, groundHeight: number): THREE.Group {
		const key = `${data.worldX},${data.worldZ}`;

		// Remove existing building if any
		if (this.buildings.has(key)) {
			const existing = this.buildings.get(key)!;
			this.scene.remove(existing);
			this.buildings.delete(key);
		}

		const config = BUILDING_CONFIGS[data.type];
		const group = new THREE.Group();

		// Create building based on type
		if (data.type === 'well') {
			this.createWell(group, config);
		} else if (data.type === 'tower') {
			this.createTower(group, data, config);
		} else {
			this.createStandardBuilding(group, data, config);
		}

		// Position the building
		group.position.set(data.worldX, groundHeight, data.worldZ);
		group.rotation.y = (data.rotation * Math.PI) / 180;

		// Store metadata
		group.userData = {
			type: 'building',
			buildingType: data.type,
			interiorId: data.interiorId,
		};

		this.scene.add(group);
		this.buildings.set(key, group);

		return group;
	}

	/**
	 * Create a standard building (shop, inn, house, guild, barn)
	 */
	private createStandardBuilding(
		group: THREE.Group,
		data: BuildingRenderData,
		config: BuildingConfig,
	): void {
		const { width, depth } = data;
		const { height, roofHeight, wallColor, roofColor, hasWindows, hasChimney } = config;

		// Walls
		const wallMaterial = (this.materials.wall as THREE.MeshStandardMaterial).clone();
		wallMaterial.color.setHex(wallColor);

		const wallGeometry = new THREE.BoxGeometry(width, height, depth);
		const walls = new THREE.Mesh(wallGeometry, wallMaterial);
		walls.position.y = height / 2;
		walls.castShadow = true;
		walls.receiveShadow = true;
		group.add(walls);

		// Roof (gable style)
		const roofMaterial = (this.materials.roof as THREE.MeshStandardMaterial).clone();
		roofMaterial.color.setHex(roofColor);

		const roofShape = new THREE.Shape();
		roofShape.moveTo(-width / 2 - 0.3, 0);
		roofShape.lineTo(0, roofHeight);
		roofShape.lineTo(width / 2 + 0.3, 0);
		roofShape.lineTo(-width / 2 - 0.3, 0);

		const extrudeSettings = {
			steps: 1,
			depth: depth + 0.6,
			bevelEnabled: false,
		};

		const roofGeometry = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
		const roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.rotation.x = Math.PI / 2;
		roof.position.set(0, height, -depth / 2 - 0.3);
		roof.castShadow = true;
		group.add(roof);

		// Door
		const doorGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.1);
		const door = new THREE.Mesh(doorGeometry, this.materials.door);
		door.position.set(0, 0.9, depth / 2 + 0.05);
		door.castShadow = true;
		group.add(door);

		// Door frame
		const frameGeometry = new THREE.BoxGeometry(1, 2, 0.15);
		const frameMaterial = this.materials.wood;
		const doorFrame = new THREE.Mesh(frameGeometry, frameMaterial);
		doorFrame.position.set(0, 1, depth / 2 + 0.02);
		group.add(doorFrame);

		// Windows
		if (hasWindows) {
			this.addWindows(group, width, depth, height);
		}

		// Chimney
		if (hasChimney) {
			const chimneyGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.6);
			const chimney = new THREE.Mesh(chimneyGeometry, this.materials.stone);
			chimney.position.set(width / 4, height + roofHeight / 2 + 0.5, 0);
			chimney.castShadow = true;
			group.add(chimney);
		}

		// Sign for shops/inns
		if (data.type === 'shop' || data.type === 'inn') {
			this.addSign(group, data.type, depth);
		}
	}

	/**
	 * Add windows to a building
	 */
	private addWindows(
		group: THREE.Group,
		width: number,
		depth: number,
		height: number,
	): void {
		const windowGeometry = new THREE.PlaneGeometry(0.6, 0.8);
		const windowPositions = [
			{ x: -width / 3, z: depth / 2 + 0.01, rotY: 0 },
			{ x: width / 3, z: depth / 2 + 0.01, rotY: 0 },
			{ x: -width / 2 - 0.01, z: 0, rotY: Math.PI / 2 },
			{ x: width / 2 + 0.01, z: 0, rotY: -Math.PI / 2 },
		];

		for (const pos of windowPositions) {
			const windowMesh = new THREE.Mesh(windowGeometry, this.materials.window);
			windowMesh.position.set(pos.x, height * 0.6, pos.z);
			windowMesh.rotation.y = pos.rotY;
			group.add(windowMesh);
		}
	}

	/**
	 * Add a sign to shops/inns
	 */
	private addSign(group: THREE.Group, type: BuildingType, depth: number): void {
		// Sign board
		const signGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.1);
		const signMaterial = new THREE.MeshStandardMaterial({
			color: type === 'shop' ? 0xffd700 : 0x8b4513,
			roughness: 0.6,
		});
		const sign = new THREE.Mesh(signGeometry, signMaterial);
		sign.position.set(0, 2.5, depth / 2 + 0.3);
		sign.castShadow = true;
		group.add(sign);

		// Sign pole
		const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5);
		const pole = new THREE.Mesh(poleGeometry, this.materials.wood);
		pole.position.set(0, 2.7, depth / 2 + 0.25);
		pole.rotation.x = Math.PI / 2;
		group.add(pole);
	}

	/**
	 * Create a well structure
	 */
	private createWell(group: THREE.Group, config: BuildingConfig): void {
		// Stone base (cylinder with hole)
		const outerGeometry = new THREE.CylinderGeometry(0.8, 0.9, 0.8, 16);
		const baseMaterial = this.materials.stone;
		const base = new THREE.Mesh(outerGeometry, baseMaterial);
		base.position.y = 0.4;
		base.castShadow = true;
		base.receiveShadow = true;
		group.add(base);

		// Water surface
		const waterGeometry = new THREE.CircleGeometry(0.6, 16);
		const waterMaterial = new THREE.MeshStandardMaterial({
			color: 0x1e90ff,
			transparent: true,
			opacity: 0.7,
		});
		const water = new THREE.Mesh(waterGeometry, waterMaterial);
		water.rotation.x = -Math.PI / 2;
		water.position.y = 0.5;
		group.add(water);

		// Roof supports
		const supportGeometry = new THREE.BoxGeometry(0.1, 1.2, 0.1);
		for (let i = 0; i < 4; i++) {
			const angle = (i / 4) * Math.PI * 2;
			const support = new THREE.Mesh(supportGeometry, this.materials.wood);
			support.position.set(Math.cos(angle) * 0.7, 1.4, Math.sin(angle) * 0.7);
			group.add(support);
		}

		// Cone roof
		const roofGeometry = new THREE.ConeGeometry(1, config.roofHeight, 8);
		const roofMaterial = (this.materials.roof as THREE.MeshStandardMaterial).clone();
		roofMaterial.color.setHex(config.roofColor);
		const roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.position.y = 2 + config.roofHeight / 2;
		roof.castShadow = true;
		group.add(roof);

		// Bucket
		const bucketGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.25, 8);
		const bucket = new THREE.Mesh(bucketGeometry, this.materials.wood);
		bucket.position.set(0.3, 1.5, 0);
		group.add(bucket);
	}

	/**
	 * Create a tower structure
	 */
	private createTower(
		group: THREE.Group,
		data: BuildingRenderData,
		config: BuildingConfig,
	): void {
		const { width } = data;
		const { height, roofHeight, wallColor, roofColor } = config;

		// Cylindrical tower body
		const wallMaterial = (this.materials.wall as THREE.MeshStandardMaterial).clone();
		wallMaterial.color.setHex(wallColor);

		const bodyGeometry = new THREE.CylinderGeometry(width / 2, width / 2 + 0.3, height, 12);
		const body = new THREE.Mesh(bodyGeometry, wallMaterial);
		body.position.y = height / 2;
		body.castShadow = true;
		body.receiveShadow = true;
		group.add(body);

		// Cone roof
		const roofMaterial = (this.materials.roof as THREE.MeshStandardMaterial).clone();
		roofMaterial.color.setHex(roofColor);

		const roofGeometry = new THREE.ConeGeometry(width / 2 + 0.5, roofHeight, 12);
		const roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.position.y = height + roofHeight / 2;
		roof.castShadow = true;
		group.add(roof);

		// Door
		const doorGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.1);
		const door = new THREE.Mesh(doorGeometry, this.materials.door);
		door.position.set(0, 0.75, width / 2 + 0.05);
		group.add(door);

		// Windows (spiral up the tower)
		for (let i = 0; i < 4; i++) {
			const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
			const y = 1.5 + i * 1.5;

			const windowGeometry = new THREE.PlaneGeometry(0.4, 0.6);
			const windowMesh = new THREE.Mesh(windowGeometry, this.materials.window);
			windowMesh.position.set(
				Math.cos(angle) * (width / 2 + 0.01),
				y,
				Math.sin(angle) * (width / 2 + 0.01),
			);
			windowMesh.rotation.y = -angle + Math.PI / 2;
			group.add(windowMesh);
		}
	}

	/**
	 * Remove a building
	 */
	public removeBuilding(worldX: number, worldZ: number): void {
		const key = `${worldX},${worldZ}`;
		const building = this.buildings.get(key);
		if (building) {
			this.scene.remove(building);
			this.buildings.delete(key);
		}
	}

	/**
	 * Clear all buildings
	 */
	public clearAllBuildings(): void {
		for (const building of this.buildings.values()) {
			this.scene.remove(building);
		}
		this.buildings.clear();
	}

	/**
	 * Get building at position
	 */
	public getBuildingAt(worldX: number, worldZ: number, radius: number = 2): THREE.Group | null {
		for (const [, building] of this.buildings) {
			const dx = building.position.x - worldX;
			const dz = building.position.z - worldZ;
			const distance = Math.sqrt(dx * dx + dz * dz);
			if (distance < radius) {
				return building;
			}
		}
		return null;
	}

	/**
	 * Get building count
	 */
	public getBuildingCount(): number {
		return this.buildings.size;
	}

	/**
	 * Dispose all resources
	 */
	public dispose(): void {
		this.clearAllBuildings();

		// Dispose materials
		Object.values(this.materials).forEach(material => {
			material.dispose();
		});

		// Dispose cached geometries
		this.geometryCache.forEach(geometry => {
			geometry.dispose();
		});
		this.geometryCache.clear();
	}
}

/**
 * Create a building renderer instance
 */
export function createBuildingRenderer(scene: THREE.Scene): BuildingRenderer {
	return new BuildingRenderer(scene);
}
