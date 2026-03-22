/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

// House data from API
export interface HouseData {
	id: string;
	ownerId: string;
	name: string | null;
	positionX: number;
	positionY: number;
	positionZ: number;
	rotation: number;
	houseType: number;
}

// House mesh with metadata
export interface HouseMesh {
	mesh: THREE.Group;
	houseData: HouseData;
	interactionBox: THREE.Mesh;
	nameLabel?: THREE.Sprite;
}

// House type configurations
const HOUSE_CONFIGS: Record<number, {
	width: number;
	depth: number;
	height: number;
	roofHeight: number;
	color: number;
	roofColor: number;
}> = {
	1: { width: 4, depth: 4, height: 2.5, roofHeight: 1.5, color: 0xdeb887, roofColor: 0x8b4513 }, // Basic house
	2: { width: 5, depth: 5, height: 3, roofHeight: 2, color: 0xf5deb3, roofColor: 0xa0522d }, // Medium house
	3: { width: 6, depth: 6, height: 3.5, roofHeight: 2.5, color: 0xfaebd7, roofColor: 0x8b0000 }, // Large house
};

const DOOR_COLOR = 0x654321;
const WINDOW_COLOR = 0x87ceeb;

export class HouseRenderer {
	private scene: THREE.Scene;
	private houses: Map<string, HouseMesh> = new Map();
	private wallMaterial: THREE.MeshStandardMaterial;
	private roofMaterial: THREE.MeshStandardMaterial;
	private doorMaterial: THREE.MeshStandardMaterial;
	private windowMaterial: THREE.MeshStandardMaterial;

	constructor(scene: THREE.Scene) {
		this.scene = scene;

		// Create shared materials
		this.wallMaterial = new THREE.MeshStandardMaterial({
			roughness: 0.8,
			metalness: 0.1,
		});

		this.roofMaterial = new THREE.MeshStandardMaterial({
			roughness: 0.7,
			metalness: 0.2,
		});

		this.doorMaterial = new THREE.MeshStandardMaterial({
			color: DOOR_COLOR,
			roughness: 0.9,
		});

		this.windowMaterial = new THREE.MeshStandardMaterial({
			color: WINDOW_COLOR,
			transparent: true,
			opacity: 0.6,
			roughness: 0.1,
		});
	}

	/**
	 * Create house mesh for a single house
	 */
	public createHouse(houseData: HouseData): HouseMesh {
		const config = HOUSE_CONFIGS[houseData.houseType] ?? HOUSE_CONFIGS[1];
		const houseGroup = new THREE.Group();

		// Create wall material with house-specific color
		const houseMaterial = this.wallMaterial.clone();
		houseMaterial.color.setHex(config.color);

		const houseRoofMaterial = this.roofMaterial.clone();
		houseRoofMaterial.color.setHex(config.roofColor);

		// Main building
		const buildingGeometry = new THREE.BoxGeometry(config.width, config.height, config.depth);
		const building = new THREE.Mesh(buildingGeometry, houseMaterial);
		building.position.y = config.height / 2;
		building.castShadow = true;
		building.receiveShadow = true;
		houseGroup.add(building);

		// Roof (pyramidal)
		const roofGeometry = new THREE.ConeGeometry(
			Math.max(config.width, config.depth) * 0.75,
			config.roofHeight,
			4,
		);
		const roof = new THREE.Mesh(roofGeometry, houseRoofMaterial);
		roof.position.y = config.height + config.roofHeight / 2;
		roof.rotation.y = Math.PI / 4; // Rotate 45 degrees for square alignment
		roof.castShadow = true;
		houseGroup.add(roof);

		// Door (front)
		const doorGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.1);
		const door = new THREE.Mesh(doorGeometry, this.doorMaterial);
		door.position.set(0, 0.9, config.depth / 2 + 0.05);
		houseGroup.add(door);

		// Door frame
		const frameGeometry = new THREE.BoxGeometry(1, 2, 0.15);
		const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
		const doorFrame = new THREE.Mesh(frameGeometry, frameMaterial);
		doorFrame.position.set(0, 1, config.depth / 2 + 0.02);
		houseGroup.add(doorFrame);

		// Windows (sides)
		const windowGeometry = new THREE.PlaneGeometry(0.6, 0.8);
		const windowHeight = config.height * 0.6;

		// Left window
		const leftWindow = new THREE.Mesh(windowGeometry, this.windowMaterial);
		leftWindow.position.set(-config.width / 2 - 0.01, windowHeight, 0);
		leftWindow.rotation.y = -Math.PI / 2;
		houseGroup.add(leftWindow);

		// Right window
		const rightWindow = new THREE.Mesh(windowGeometry, this.windowMaterial);
		rightWindow.position.set(config.width / 2 + 0.01, windowHeight, 0);
		rightWindow.rotation.y = Math.PI / 2;
		houseGroup.add(rightWindow);

		// Front windows (beside door)
		const frontWindowLeft = new THREE.Mesh(windowGeometry, this.windowMaterial);
		frontWindowLeft.position.set(-config.width / 3, windowHeight, config.depth / 2 + 0.01);
		houseGroup.add(frontWindowLeft);

		const frontWindowRight = new THREE.Mesh(windowGeometry, this.windowMaterial);
		frontWindowRight.position.set(config.width / 3, windowHeight, config.depth / 2 + 0.01);
		houseGroup.add(frontWindowRight);

		// Foundation
		const foundationGeometry = new THREE.BoxGeometry(config.width + 0.2, 0.2, config.depth + 0.2);
		const foundationMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
		const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
		foundation.position.y = 0.1;
		foundation.receiveShadow = true;
		houseGroup.add(foundation);

		// Interaction box (invisible, for click detection)
		const interactionGeometry = new THREE.BoxGeometry(config.width + 2, config.height + config.roofHeight, config.depth + 2);
		const interactionMaterial = new THREE.MeshBasicMaterial({
			visible: false,
		});
		const interactionBox = new THREE.Mesh(interactionGeometry, interactionMaterial);
		interactionBox.position.y = (config.height + config.roofHeight) / 2;
		(interactionBox as any).userData = {
			type: 'house',
			houseId: houseData.id,
			ownerId: houseData.ownerId,
		};
		houseGroup.add(interactionBox);

		// Position and rotate the house
		houseGroup.position.set(houseData.positionX, houseData.positionY, houseData.positionZ);
		houseGroup.rotation.y = (houseData.rotation * Math.PI) / 180;

		// Create name label sprite
		let nameLabel: THREE.Sprite | undefined;
		if (houseData.name) {
			nameLabel = this.createNameLabel(houseData.name);
			nameLabel.position.y = config.height + config.roofHeight + 1;
			houseGroup.add(nameLabel);
		}

		// Store house mesh data
		const houseMesh: HouseMesh = {
			mesh: houseGroup,
			houseData,
			interactionBox,
			nameLabel,
		};

		this.houses.set(houseData.id, houseMesh);
		this.scene.add(houseGroup);

		return houseMesh;
	}

	/**
	 * Create a text label sprite
	 */
	private createNameLabel(text: string): THREE.Sprite {
		const canvas = window.document.createElement('canvas');
		const context = canvas.getContext('2d')!;
		canvas.width = 256;
		canvas.height = 64;

		// Background
		context.fillStyle = 'rgba(0, 0, 0, 0.5)';
		context.roundRect(0, 0, canvas.width, canvas.height, 8);
		context.fill();

		// Text
		context.font = 'bold 24px sans-serif';
		context.fillStyle = 'white';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText(text, canvas.width / 2, canvas.height / 2);

		const texture = new THREE.CanvasTexture(canvas);
		const spriteMaterial = new THREE.SpriteMaterial({
			map: texture,
			transparent: true,
		});

		const sprite = new THREE.Sprite(spriteMaterial);
		sprite.scale.set(4, 1, 1);

		return sprite;
	}

	/**
	 * Update houses from API data
	 */
	public updateHouses(housesData: HouseData[]): void {
		// Track which houses should exist
		const existingIds = new Set(housesData.map(h => h.id));

		// Remove houses that no longer exist
		for (const [id, houseMesh] of this.houses) {
			if (!existingIds.has(id)) {
				this.removeHouse(id);
			}
		}

		// Add or update houses
		for (const houseData of housesData) {
			const existing = this.houses.get(houseData.id);
			if (!existing) {
				this.createHouse(houseData);
			} else {
				// Update position if changed
				existing.mesh.position.set(houseData.positionX, houseData.positionY, houseData.positionZ);
				existing.mesh.rotation.y = (houseData.rotation * Math.PI) / 180;
				existing.houseData = houseData;
			}
		}
	}

	/**
	 * Remove a house
	 */
	public removeHouse(houseId: string): void {
		const houseMesh = this.houses.get(houseId);
		if (houseMesh) {
			this.scene.remove(houseMesh.mesh);

			// Dispose geometries and materials
			houseMesh.mesh.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose();
					if (child.material instanceof THREE.Material) {
						child.material.dispose();
					}
				}
			});

			this.houses.delete(houseId);
		}
	}

	/**
	 * Get house at world position
	 */
	public getHouseAt(worldX: number, worldZ: number, maxDistance: number = 5): HouseData | null {
		for (const houseMesh of this.houses.values()) {
			const distance = Math.sqrt(
				Math.pow(houseMesh.houseData.positionX - worldX, 2) +
				Math.pow(houseMesh.houseData.positionZ - worldZ, 2),
			);

			if (distance <= maxDistance) {
				return houseMesh.houseData;
			}
		}
		return null;
	}

	/**
	 * Highlight house on hover
	 */
	public highlightHouse(houseId: string | null): void {
		for (const [id, houseMesh] of this.houses) {
			const building = houseMesh.mesh.children[0] as THREE.Mesh;
			if (building && building.material instanceof THREE.MeshStandardMaterial) {
				if (id === houseId) {
					building.material.emissive.setHex(0x333333);
				} else {
					building.material.emissive.setHex(0x000000);
				}
			}
		}
	}

	/**
	 * Get all houses
	 */
	public getAllHouses(): Map<string, HouseMesh> {
		return this.houses;
	}

	/**
	 * Clean up all resources
	 */
	public dispose(): void {
		for (const houseMesh of this.houses.values()) {
			this.scene.remove(houseMesh.mesh);

			houseMesh.mesh.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.geometry.dispose();
					if (child.material instanceof THREE.Material) {
						child.material.dispose();
					}
				}
			});
		}

		this.houses.clear();
		this.wallMaterial.dispose();
		this.roofMaterial.dispose();
		this.doorMaterial.dispose();
		this.windowMaterial.dispose();
	}
}
