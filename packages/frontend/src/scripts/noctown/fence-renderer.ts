/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export interface FenceOptions {
	position: THREE.Vector3;
	direction: 'north' | 'east' | 'south' | 'west';
	type?: FenceType;
	hasGate?: boolean;
	isGateOpen?: boolean;
}

export type FenceType = 'wooden' | 'stone' | 'metal' | 'bamboo' | 'picket';

// Fence type configurations
const FENCE_CONFIG: Record<FenceType, { postColor: number; railColor: number; postWidth: number; railCount: number }> = {
	wooden: { postColor: 0x8b4513, railColor: 0xa0522d, postWidth: 0.08, railCount: 2 },
	stone: { postColor: 0x808080, railColor: 0x696969, postWidth: 0.12, railCount: 0 },
	metal: { postColor: 0x4a4a4a, railColor: 0x5c5c5c, postWidth: 0.05, railCount: 3 },
	bamboo: { postColor: 0x9acd32, railColor: 0x6b8e23, postWidth: 0.04, railCount: 4 },
	picket: { postColor: 0xffffff, railColor: 0xf5f5f5, postWidth: 0.06, railCount: 1 },
};

const FENCE_LENGTH = 2; // Length of one fence segment
const FENCE_HEIGHT = 1;

/**
 * Fence renderer for Noctown.
 * Creates 3D fence segments with optional gates.
 */
export class FenceRenderer {
	private scene: THREE.Scene;
	private fences: Map<string, FenceGroup> = new Map();
	private clock: THREE.Clock;

	constructor(scene: THREE.Scene) {
		this.scene = scene;
		this.clock = new THREE.Clock();
	}

	/**
	 * Create a fence segment at the specified position.
	 */
	public createFence(id: string, options: FenceOptions): THREE.Group {
		const type = options.type ?? 'wooden';
		const config = FENCE_CONFIG[type];
		const hasGate = options.hasGate ?? false;
		const isGateOpen = options.isGateOpen ?? false;

		const group = new THREE.Group();
		group.position.copy(options.position);

		// Rotate based on direction
		switch (options.direction) {
			case 'north':
				group.rotation.y = 0;
				break;
			case 'east':
				group.rotation.y = Math.PI / 2;
				break;
			case 'south':
				group.rotation.y = Math.PI;
				break;
			case 'west':
				group.rotation.y = -Math.PI / 2;
				break;
		}

		const postMaterial = new THREE.MeshStandardMaterial({
			color: config.postColor,
			roughness: 0.8,
			metalness: type === 'metal' ? 0.5 : 0.1,
		});

		const railMaterial = new THREE.MeshStandardMaterial({
			color: config.railColor,
			roughness: 0.7,
			metalness: type === 'metal' ? 0.5 : 0.1,
		});

		// Left post
		const leftPostGeometry = new THREE.BoxGeometry(config.postWidth, FENCE_HEIGHT, config.postWidth);
		const leftPost = new THREE.Mesh(leftPostGeometry, postMaterial);
		leftPost.position.set(-FENCE_LENGTH / 2, FENCE_HEIGHT / 2, 0);
		leftPost.castShadow = true;
		leftPost.receiveShadow = true;
		group.add(leftPost);

		// Right post
		const rightPostGeometry = new THREE.BoxGeometry(config.postWidth, FENCE_HEIGHT, config.postWidth);
		const rightPost = new THREE.Mesh(rightPostGeometry, postMaterial);
		rightPost.position.set(FENCE_LENGTH / 2, FENCE_HEIGHT / 2, 0);
		rightPost.castShadow = true;
		rightPost.receiveShadow = true;
		group.add(rightPost);

		// Gate or rails
		let gateGroup: THREE.Group | null = null;

		if (hasGate) {
			gateGroup = this.createGate(type, config, isGateOpen);
			group.add(gateGroup);
		} else {
			// Regular fence rails
			this.addRails(group, type, config, railMaterial);
		}

		// Post caps (decorative tops)
		const capGeometry = new THREE.BoxGeometry(config.postWidth + 0.02, 0.05, config.postWidth + 0.02);
		const leftCap = new THREE.Mesh(capGeometry, postMaterial);
		leftCap.position.set(-FENCE_LENGTH / 2, FENCE_HEIGHT + 0.025, 0);
		group.add(leftCap);

		const rightCap = new THREE.Mesh(capGeometry, postMaterial);
		rightCap.position.set(FENCE_LENGTH / 2, FENCE_HEIGHT + 0.025, 0);
		group.add(rightCap);

		// Store fence for updates
		const fenceGroup: FenceGroup = {
			group,
			gateGroup,
			type,
			direction: options.direction,
			hasGate,
			isGateOpen,
			animationTime: 0,
		};
		this.fences.set(id, fenceGroup);
		this.scene.add(group);

		return group;
	}

	/**
	 * Create gate structure.
	 */
	private createGate(type: FenceType, config: typeof FENCE_CONFIG[FenceType], isOpen: boolean): THREE.Group {
		const gateGroup = new THREE.Group();

		const gateMaterial = new THREE.MeshStandardMaterial({
			color: config.railColor,
			roughness: 0.7,
			metalness: type === 'metal' ? 0.5 : 0.1,
		});

		// Gate frame
		const gateWidth = FENCE_LENGTH - config.postWidth * 2 - 0.1;
		const gateHeight = FENCE_HEIGHT * 0.8;

		// Vertical beams
		const verticalGeometry = new THREE.BoxGeometry(0.04, gateHeight, 0.04);
		const leftVertical = new THREE.Mesh(verticalGeometry, gateMaterial);
		leftVertical.position.set(-gateWidth / 2, gateHeight / 2 + 0.1, 0);
		gateGroup.add(leftVertical);

		const rightVertical = new THREE.Mesh(verticalGeometry, gateMaterial);
		rightVertical.position.set(gateWidth / 2, gateHeight / 2 + 0.1, 0);
		gateGroup.add(rightVertical);

		// Horizontal beams
		const horizontalGeometry = new THREE.BoxGeometry(gateWidth, 0.04, 0.04);
		const topHorizontal = new THREE.Mesh(horizontalGeometry, gateMaterial);
		topHorizontal.position.y = gateHeight + 0.08;
		gateGroup.add(topHorizontal);

		const bottomHorizontal = new THREE.Mesh(horizontalGeometry, gateMaterial);
		bottomHorizontal.position.y = 0.12;
		gateGroup.add(bottomHorizontal);

		// Cross brace
		const braceLength = Math.sqrt(gateWidth * gateWidth + gateHeight * gateHeight);
		const braceGeometry = new THREE.BoxGeometry(braceLength, 0.03, 0.03);
		const brace = new THREE.Mesh(braceGeometry, gateMaterial);
		brace.position.y = gateHeight / 2 + 0.1;
		brace.rotation.z = Math.atan2(gateHeight, gateWidth);
		gateGroup.add(brace);

		// Handle
		const handleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
		const handleMaterial = new THREE.MeshStandardMaterial({
			color: type === 'metal' ? 0x2f2f2f : 0x4a3728,
			roughness: 0.5,
			metalness: 0.3,
		});
		const handle = new THREE.Mesh(handleGeometry, handleMaterial);
		handle.position.set(gateWidth / 2 - 0.08, gateHeight / 2 + 0.1, 0.03);
		gateGroup.add(handle);

		// Set initial rotation for open/closed state
		gateGroup.position.x = -gateWidth / 2 - config.postWidth / 2 - 0.05;
		if (isOpen) {
			gateGroup.rotation.y = -Math.PI / 2;
			gateGroup.position.z = -gateWidth / 2;
		}

		return gateGroup;
	}

	/**
	 * Add rails to fence.
	 */
	private addRails(group: THREE.Group, type: FenceType, config: typeof FENCE_CONFIG[FenceType], material: THREE.Material): void {
		if (type === 'stone') {
			// Stone fence is solid
			const wallGeometry = new THREE.BoxGeometry(FENCE_LENGTH - config.postWidth, FENCE_HEIGHT * 0.85, config.postWidth);
			const wall = new THREE.Mesh(wallGeometry, material);
			wall.position.y = FENCE_HEIGHT * 0.85 / 2;
			wall.castShadow = true;
			wall.receiveShadow = true;
			group.add(wall);
			return;
		}

		if (type === 'picket') {
			// Picket fence has vertical slats
			const slatCount = Math.floor((FENCE_LENGTH - config.postWidth * 2) / 0.12);
			const spacing = (FENCE_LENGTH - config.postWidth * 2) / slatCount;

			for (let i = 0; i < slatCount; i++) {
				const slatGeometry = new THREE.BoxGeometry(0.06, FENCE_HEIGHT * 0.85, 0.02);
				const slat = new THREE.Mesh(slatGeometry, material);
				const x = -FENCE_LENGTH / 2 + config.postWidth + spacing / 2 + i * spacing;
				slat.position.set(x, FENCE_HEIGHT * 0.85 / 2, 0);
				slat.castShadow = true;
				group.add(slat);

				// Pointed top
				const topGeometry = new THREE.ConeGeometry(0.04, 0.08, 4);
				const top = new THREE.Mesh(topGeometry, material);
				top.position.set(x, FENCE_HEIGHT * 0.85 + 0.04, 0);
				top.rotation.y = Math.PI / 4;
				group.add(top);
			}

			// Horizontal rail
			const railGeometry = new THREE.BoxGeometry(FENCE_LENGTH - config.postWidth * 2, 0.04, 0.04);
			const rail = new THREE.Mesh(railGeometry, material);
			rail.position.y = FENCE_HEIGHT * 0.4;
			group.add(rail);
			return;
		}

		// Standard horizontal rails
		const railWidth = FENCE_LENGTH - config.postWidth * 2;
		const railSpacing = FENCE_HEIGHT / (config.railCount + 1);

		for (let i = 1; i <= config.railCount; i++) {
			const railGeometry = new THREE.BoxGeometry(railWidth, 0.05, 0.03);
			const rail = new THREE.Mesh(railGeometry, material);
			rail.position.y = railSpacing * i;
			rail.castShadow = true;
			group.add(rail);
		}
	}

	/**
	 * Toggle gate open/closed state.
	 */
	public toggleGate(id: string): void {
		const fence = this.fences.get(id);
		if (!fence || !fence.hasGate || !fence.gateGroup) return;

		fence.isGateOpen = !fence.isGateOpen;
		fence.animationTime = 0;
	}

	/**
	 * Set gate state.
	 */
	public setGateState(id: string, isOpen: boolean): void {
		const fence = this.fences.get(id);
		if (!fence || !fence.hasGate || !fence.gateGroup) return;

		if (fence.isGateOpen !== isOpen) {
			fence.isGateOpen = isOpen;
			fence.animationTime = 0;
		}
	}

	/**
	 * Remove a fence segment.
	 */
	public removeFence(id: string): void {
		const fence = this.fences.get(id);
		if (fence) {
			this.scene.remove(fence.group);
			fence.group.traverse((object) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					if (Array.isArray(object.material)) {
						object.material.forEach(m => m.dispose());
					} else {
						object.material.dispose();
					}
				}
			});
			this.fences.delete(id);
		}
	}

	/**
	 * Update animations for all fences.
	 */
	public update(): void {
		const delta = this.clock.getDelta();

		for (const fence of this.fences.values()) {
			if (!fence.gateGroup) continue;

			// Gate animation
			const config = FENCE_CONFIG[fence.type];
			const gateWidth = FENCE_LENGTH - config.postWidth * 2 - 0.1;
			const targetRotation = fence.isGateOpen ? -Math.PI / 2 : 0;
			const targetZ = fence.isGateOpen ? -gateWidth / 2 : 0;

			fence.animationTime += delta;
			const animProgress = Math.min(1, fence.animationTime * 2);
			const easeProgress = 1 - Math.pow(1 - animProgress, 3); // Ease out cubic

			// Interpolate rotation and position
			const currentRotation = fence.gateGroup.rotation.y;
			const rotationDiff = targetRotation - currentRotation;
			if (Math.abs(rotationDiff) > 0.01) {
				fence.gateGroup.rotation.y += rotationDiff * easeProgress * 0.1;
			}

			const currentZ = fence.gateGroup.position.z;
			const zDiff = targetZ - currentZ;
			if (Math.abs(zDiff) > 0.01) {
				fence.gateGroup.position.z += zDiff * easeProgress * 0.1;
			}
		}
	}

	/**
	 * Clean up all fences.
	 */
	public dispose(): void {
		for (const id of this.fences.keys()) {
			this.removeFence(id);
		}
		this.fences.clear();
	}

	/**
	 * Get a fence by ID.
	 */
	public getFence(id: string): THREE.Group | undefined {
		return this.fences.get(id)?.group;
	}

	/**
	 * Check if gate is open.
	 */
	public isGateOpen(id: string): boolean {
		const fence = this.fences.get(id);
		return fence?.isGateOpen ?? false;
	}

	/**
	 * Create a connected fence loop/area.
	 */
	public createFenceArea(
		baseId: string,
		centerPosition: THREE.Vector3,
		width: number,
		depth: number,
		type: FenceType = 'wooden',
		gateDirection?: 'north' | 'east' | 'south' | 'west',
	): string[] {
		const fenceIds: string[] = [];
		const segmentsX = Math.ceil(width / FENCE_LENGTH);
		const segmentsZ = Math.ceil(depth / FENCE_LENGTH);

		// North side
		for (let i = 0; i < segmentsX; i++) {
			const id = `${baseId}_n_${i}`;
			const hasGate = gateDirection === 'north' && i === Math.floor(segmentsX / 2);
			this.createFence(id, {
				position: new THREE.Vector3(
					centerPosition.x - width / 2 + FENCE_LENGTH / 2 + i * FENCE_LENGTH,
					centerPosition.y,
					centerPosition.z - depth / 2,
				),
				direction: 'east',
				type,
				hasGate,
			});
			fenceIds.push(id);
		}

		// South side
		for (let i = 0; i < segmentsX; i++) {
			const id = `${baseId}_s_${i}`;
			const hasGate = gateDirection === 'south' && i === Math.floor(segmentsX / 2);
			this.createFence(id, {
				position: new THREE.Vector3(
					centerPosition.x - width / 2 + FENCE_LENGTH / 2 + i * FENCE_LENGTH,
					centerPosition.y,
					centerPosition.z + depth / 2,
				),
				direction: 'west',
				type,
				hasGate,
			});
			fenceIds.push(id);
		}

		// East side
		for (let i = 0; i < segmentsZ; i++) {
			const id = `${baseId}_e_${i}`;
			const hasGate = gateDirection === 'east' && i === Math.floor(segmentsZ / 2);
			this.createFence(id, {
				position: new THREE.Vector3(
					centerPosition.x + width / 2,
					centerPosition.y,
					centerPosition.z - depth / 2 + FENCE_LENGTH / 2 + i * FENCE_LENGTH,
				),
				direction: 'south',
				type,
				hasGate,
			});
			fenceIds.push(id);
		}

		// West side
		for (let i = 0; i < segmentsZ; i++) {
			const id = `${baseId}_w_${i}`;
			const hasGate = gateDirection === 'west' && i === Math.floor(segmentsZ / 2);
			this.createFence(id, {
				position: new THREE.Vector3(
					centerPosition.x - width / 2,
					centerPosition.y,
					centerPosition.z - depth / 2 + FENCE_LENGTH / 2 + i * FENCE_LENGTH,
				),
				direction: 'north',
				type,
				hasGate,
			});
			fenceIds.push(id);
		}

		return fenceIds;
	}
}

interface FenceGroup {
	group: THREE.Group;
	gateGroup: THREE.Group | null;
	type: FenceType;
	direction: 'north' | 'east' | 'south' | 'west';
	hasGate: boolean;
	isGateOpen: boolean;
	animationTime: number;
}
