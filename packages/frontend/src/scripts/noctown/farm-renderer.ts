/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export interface FarmPlotOptions {
	position: THREE.Vector3;
	size?: number;
	cropType?: CropType;
	growthStage?: number; // 0-4 (seed, sprout, young, mature, harvest)
	isWatered?: boolean;
}

export type CropType =
	| 'wheat'
	| 'carrot'
	| 'potato'
	| 'tomato'
	| 'corn'
	| 'pumpkin'
	| 'sunflower'
	| 'strawberry';

// Crop-specific colors and heights
const CROP_CONFIG: Record<CropType, { color: number; maxHeight: number; harvestColor: number }> = {
	wheat: { color: 0x9acd32, maxHeight: 1.2, harvestColor: 0xdaa520 },
	carrot: { color: 0x228b22, maxHeight: 0.4, harvestColor: 0xff8c00 },
	potato: { color: 0x2e8b57, maxHeight: 0.3, harvestColor: 0xd2b48c },
	tomato: { color: 0x228b22, maxHeight: 0.8, harvestColor: 0xff6347 },
	corn: { color: 0x32cd32, maxHeight: 1.5, harvestColor: 0xffd700 },
	pumpkin: { color: 0x228b22, maxHeight: 0.5, harvestColor: 0xff8c00 },
	sunflower: { color: 0x32cd32, maxHeight: 1.3, harvestColor: 0xffd700 },
	strawberry: { color: 0x228b22, maxHeight: 0.25, harvestColor: 0xdc143c },
};

/**
 * Farm renderer for Noctown.
 * Creates 3D farm plots with growing crops.
 */
export class FarmRenderer {
	private scene: THREE.Scene;
	private farms: Map<string, FarmPlotGroup> = new Map();
	private clock: THREE.Clock;

	constructor(scene: THREE.Scene) {
		this.scene = scene;
		this.clock = new THREE.Clock();
	}

	/**
	 * Create a farm plot at the specified position.
	 */
	public createFarmPlot(id: string, options: FarmPlotOptions): THREE.Group {
		const size = options.size ?? 2;
		const cropType = options.cropType ?? 'wheat';
		const growthStage = options.growthStage ?? 0;
		const isWatered = options.isWatered ?? false;

		const group = new THREE.Group();
		group.position.copy(options.position);

		// Soil base
		const soilGeometry = new THREE.BoxGeometry(size, 0.2, size);
		const soilMaterial = new THREE.MeshStandardMaterial({
			color: isWatered ? 0x4a3728 : 0x6b4423,
			roughness: 0.9,
			metalness: 0.0,
		});
		const soil = new THREE.Mesh(soilGeometry, soilMaterial);
		soil.position.y = -0.1;
		soil.castShadow = true;
		soil.receiveShadow = true;
		group.add(soil);

		// Soil rows (furrows)
		const rowCount = Math.floor(size / 0.4);
		for (let i = 0; i < rowCount; i++) {
			const rowGeometry = new THREE.BoxGeometry(size * 0.9, 0.1, 0.15);
			const rowMaterial = new THREE.MeshStandardMaterial({
				color: isWatered ? 0x3a2a1a : 0x5a4020,
				roughness: 0.95,
				metalness: 0.0,
			});
			const row = new THREE.Mesh(rowGeometry, rowMaterial);
			row.position.y = 0.05;
			row.position.z = (i - rowCount / 2 + 0.5) * 0.4;
			row.receiveShadow = true;
			group.add(row);
		}

		// Border/fence posts (corners)
		const postPositions = [
			[-size / 2, size / 2],
			[size / 2, size / 2],
			[-size / 2, -size / 2],
			[size / 2, -size / 2],
		];
		const postGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.3, 8);
		const postMaterial = new THREE.MeshStandardMaterial({
			color: 0x8b4513,
			roughness: 0.8,
			metalness: 0.1,
		});
		for (const [x, z] of postPositions) {
			const post = new THREE.Mesh(postGeometry, postMaterial);
			post.position.set(x, 0.15, z);
			post.castShadow = true;
			group.add(post);
		}

		// Crops (if growth stage > 0)
		const cropGroup = new THREE.Group();
		if (growthStage > 0) {
			this.addCropsToPlot(cropGroup, size, cropType, growthStage);
		}
		group.add(cropGroup);

		// Water droplets animation target
		const waterGroup = new THREE.Group();
		group.add(waterGroup);

		// Store farm for updates
		const farmGroup: FarmPlotGroup = {
			group,
			soil,
			cropGroup,
			waterGroup,
			cropType,
			growthStage,
			isWatered,
			size,
			animationTime: 0,
		};
		this.farms.set(id, farmGroup);
		this.scene.add(group);

		return group;
	}

	/**
	 * Add crops to a farm plot based on growth stage.
	 */
	private addCropsToPlot(
		cropGroup: THREE.Group,
		size: number,
		cropType: CropType,
		growthStage: number,
	): void {
		const config = CROP_CONFIG[cropType];
		const heightFactor = growthStage / 4;
		const currentHeight = config.maxHeight * heightFactor;

		// Calculate color based on growth
		const baseColor = new THREE.Color(config.color);
		const harvestColor = new THREE.Color(config.harvestColor);
		const currentColor = growthStage >= 4
			? config.harvestColor
			: baseColor.lerp(harvestColor, heightFactor * 0.3).getHex();

		// Create crop instances
		const cropCount = Math.floor(size * size * 3);
		const cropGeometry = this.getCropGeometry(cropType, growthStage);
		const cropMaterial = new THREE.MeshStandardMaterial({
			color: currentColor,
			roughness: 0.7,
			metalness: 0.0,
		});

		for (let i = 0; i < cropCount; i++) {
			const crop = new THREE.Mesh(cropGeometry, cropMaterial.clone());
			const x = (Math.random() - 0.5) * size * 0.85;
			const z = (Math.random() - 0.5) * size * 0.85;
			crop.position.set(x, currentHeight / 2, z);
			crop.scale.setY(heightFactor + 0.2);
			crop.rotation.y = Math.random() * Math.PI * 2;
			crop.castShadow = true;
			cropGroup.add(crop);
		}

		// Add fruit/vegetable if mature
		if (growthStage >= 4) {
			this.addHarvestableItems(cropGroup, size, cropType);
		}
	}

	/**
	 * Get geometry for a specific crop type.
	 */
	private getCropGeometry(cropType: CropType, growthStage: number): THREE.BufferGeometry {
		switch (cropType) {
			case 'wheat':
			case 'corn':
				// Tall stalks
				return new THREE.CylinderGeometry(0.02, 0.03, 0.5, 6);

			case 'carrot':
			case 'potato':
				// Low leaves
				return new THREE.ConeGeometry(0.08, 0.2, 6);

			case 'tomato':
			case 'strawberry':
				// Bush shape
				return new THREE.SphereGeometry(0.1, 8, 8);

			case 'pumpkin':
				// Low spreading
				return new THREE.BoxGeometry(0.15, 0.1, 0.15);

			case 'sunflower':
				// Tall stem with head (simplified)
				return new THREE.CylinderGeometry(0.02, 0.03, 0.4, 6);

			default:
				return new THREE.CylinderGeometry(0.02, 0.03, 0.3, 6);
		}
	}

	/**
	 * Add harvestable items when crop is mature.
	 */
	private addHarvestableItems(
		cropGroup: THREE.Group,
		size: number,
		cropType: CropType,
	): void {
		const config = CROP_CONFIG[cropType];
		const fruitCount = Math.floor(size * size * 1.5);

		let fruitGeometry: THREE.BufferGeometry;
		switch (cropType) {
			case 'tomato':
			case 'strawberry':
				fruitGeometry = new THREE.SphereGeometry(0.06, 8, 8);
				break;
			case 'pumpkin':
				fruitGeometry = new THREE.SphereGeometry(0.15, 8, 6);
				break;
			case 'wheat':
				fruitGeometry = new THREE.CylinderGeometry(0.03, 0.02, 0.12, 8);
				break;
			case 'corn':
				fruitGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8);
				break;
			case 'sunflower':
				fruitGeometry = new THREE.CircleGeometry(0.12, 12);
				break;
			default:
				fruitGeometry = new THREE.SphereGeometry(0.05, 8, 8);
		}

		const fruitMaterial = new THREE.MeshStandardMaterial({
			color: config.harvestColor,
			roughness: 0.6,
			metalness: 0.1,
		});

		for (let i = 0; i < fruitCount; i++) {
			const fruit = new THREE.Mesh(fruitGeometry, fruitMaterial);
			const x = (Math.random() - 0.5) * size * 0.8;
			const z = (Math.random() - 0.5) * size * 0.8;
			let y: number;

			switch (cropType) {
				case 'carrot':
				case 'potato':
					y = 0.05; // Underground, slightly visible
					break;
				case 'pumpkin':
					y = 0.08;
					break;
				case 'sunflower':
					fruit.rotation.x = -Math.PI / 2;
					fruit.rotation.z = Math.random() * 0.3;
					y = config.maxHeight * 0.9;
					break;
				case 'corn':
					y = config.maxHeight * 0.6;
					break;
				default:
					y = config.maxHeight * 0.4 + Math.random() * 0.2;
			}

			fruit.position.set(x, y, z);
			fruit.castShadow = true;
			cropGroup.add(fruit);
		}
	}

	/**
	 * Update farm plot growth stage.
	 */
	public updateGrowthStage(id: string, newStage: number): void {
		const farm = this.farms.get(id);
		if (!farm) return;

		farm.growthStage = Math.max(0, Math.min(4, newStage));

		// Clear existing crops
		while (farm.cropGroup.children.length > 0) {
			const child = farm.cropGroup.children[0];
			if (child instanceof THREE.Mesh) {
				child.geometry.dispose();
				if (Array.isArray(child.material)) {
					child.material.forEach(m => m.dispose());
				} else {
					child.material.dispose();
				}
			}
			farm.cropGroup.remove(child);
		}

		// Add new crops based on growth stage
		if (farm.growthStage > 0) {
			this.addCropsToPlot(farm.cropGroup, farm.size, farm.cropType, farm.growthStage);
		}
	}

	/**
	 * Set watered state for a farm.
	 */
	public setWatered(id: string, isWatered: boolean): void {
		const farm = this.farms.get(id);
		if (!farm) return;

		farm.isWatered = isWatered;

		// Update soil color
		if (farm.soil.material instanceof THREE.MeshStandardMaterial) {
			farm.soil.material.color.setHex(isWatered ? 0x4a3728 : 0x6b4423);
		}
	}

	/**
	 * Play watering animation.
	 */
	public playWateringAnimation(id: string): void {
		const farm = this.farms.get(id);
		if (!farm) return;

		// Create water droplets
		const dropletGeometry = new THREE.SphereGeometry(0.03, 8, 8);
		const dropletMaterial = new THREE.MeshBasicMaterial({
			color: 0x4fc3f7,
			transparent: true,
			opacity: 0.8,
		});

		const droplets: THREE.Mesh[] = [];
		for (let i = 0; i < 20; i++) {
			const droplet = new THREE.Mesh(dropletGeometry, dropletMaterial.clone());
			droplet.position.set(
				(Math.random() - 0.5) * farm.size,
				1.5 + Math.random() * 0.5,
				(Math.random() - 0.5) * farm.size,
			);
			(droplet as unknown as { velocity: number }).velocity = 0.02 + Math.random() * 0.01;
			farm.waterGroup.add(droplet);
			droplets.push(droplet);
		}

		// Animate droplets falling
		const animate = () => {
			let allLanded = true;
			for (const droplet of droplets) {
				if (droplet.position.y > 0) {
					const d = droplet as THREE.Mesh & { velocity: number };
					droplet.position.y -= d.velocity;
					d.velocity += 0.002; // Gravity
					allLanded = false;
				}
			}

			if (!allLanded) {
				requestAnimationFrame(animate);
			} else {
				// Clean up droplets
				for (const droplet of droplets) {
					droplet.geometry.dispose();
					(droplet.material as THREE.Material).dispose();
					farm.waterGroup.remove(droplet);
				}
				// Set watered state
				this.setWatered(id, true);
			}
		};

		animate();
	}

	/**
	 * Remove a farm plot.
	 */
	public removeFarm(id: string): void {
		const farm = this.farms.get(id);
		if (farm) {
			this.scene.remove(farm.group);
			farm.group.traverse((object) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					if (Array.isArray(object.material)) {
						object.material.forEach(m => m.dispose());
					} else {
						object.material.dispose();
					}
				}
			});
			this.farms.delete(id);
		}
	}

	/**
	 * T045-T046: Update animations for all farms.
	 * - 全作物: 軽い揺れアニメーション
	 * - 収穫可能な作物(growthStage=4): 上下に揺れる動き（ユーザーに収穫可能を知らせる）
	 */
	public update(): void {
		const delta = this.clock.getDelta();
		const elapsed = this.clock.getElapsedTime();

		for (const farm of this.farms.values()) {
			// Gentle swaying animation for crops
			farm.cropGroup.children.forEach((crop, i) => {
				if (crop instanceof THREE.Mesh) {
					const offset = i * 0.1;
					crop.rotation.x = Math.sin(elapsed * 1.5 + offset) * 0.05;
					crop.rotation.z = Math.cos(elapsed * 1.2 + offset) * 0.03;

					// T046: 収穫可能な作物は上下に揺れる動きを追加
					if (farm.growthStage >= 4) {
						const baseY = crop.userData.baseY ?? crop.position.y;
						crop.userData.baseY = baseY;
						crop.position.y = baseY + Math.sin(elapsed * 3 + offset) * 0.05;
					}
				}
			});
		}
	}

	/**
	 * Clean up all farms.
	 */
	public dispose(): void {
		for (const id of this.farms.keys()) {
			this.removeFarm(id);
		}
		this.farms.clear();
	}

	/**
	 * Get a farm by ID.
	 */
	public getFarm(id: string): THREE.Group | undefined {
		return this.farms.get(id)?.group;
	}

	/**
	 * Check if a farm is ready for harvest.
	 */
	public isReadyForHarvest(id: string): boolean {
		const farm = this.farms.get(id);
		return farm?.growthStage === 4;
	}
}

interface FarmPlotGroup {
	group: THREE.Group;
	soil: THREE.Mesh;
	cropGroup: THREE.Group;
	waterGroup: THREE.Group;
	cropType: CropType;
	growthStage: number;
	isWatered: boolean;
	size: number;
	animationTime: number;
}
