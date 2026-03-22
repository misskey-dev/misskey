/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export interface ChickenOptions {
	position: THREE.Vector3;
	color?: ChickenColor;
	isRooster?: boolean;
	size?: number;
}

export type ChickenColor = 'white' | 'brown' | 'black' | 'golden' | 'spotted';

// Chicken color configurations
const CHICKEN_COLORS: Record<ChickenColor, { body: number; accent: number; beak: number; comb: number }> = {
	white: { body: 0xffffff, accent: 0xf5f5f5, beak: 0xffa500, comb: 0xff0000 },
	brown: { body: 0x8b4513, accent: 0xa0522d, beak: 0xffa500, comb: 0xdc143c },
	black: { body: 0x2f2f2f, accent: 0x1a1a1a, beak: 0xff8c00, comb: 0xb22222 },
	golden: { body: 0xdaa520, accent: 0xb8860b, beak: 0xff8c00, comb: 0xff4500 },
	spotted: { body: 0xf5f5dc, accent: 0x8b4513, beak: 0xffa500, comb: 0xff0000 },
};

/**
 * Chicken renderer for Noctown.
 * Creates 3D chicken models with animations.
 */
export class ChickenRenderer {
	private scene: THREE.Scene;
	private chickens: Map<string, ChickenGroup> = new Map();
	private clock: THREE.Clock;

	constructor(scene: THREE.Scene) {
		this.scene = scene;
		this.clock = new THREE.Clock();
	}

	/**
	 * Create a chicken at the specified position.
	 */
	public createChicken(id: string, options: ChickenOptions): THREE.Group {
		const color = options.color ?? 'white';
		const isRooster = options.isRooster ?? false;
		const size = options.size ?? 1;
		const colors = CHICKEN_COLORS[color];

		const group = new THREE.Group();
		group.position.copy(options.position);
		group.scale.setScalar(size);

		// Body
		const bodyGeometry = new THREE.SphereGeometry(0.3, 16, 12);
		bodyGeometry.scale(1, 0.8, 1.2);
		const bodyMaterial = new THREE.MeshStandardMaterial({
			color: colors.body,
			roughness: 0.8,
			metalness: 0.0,
		});
		const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.y = 0.3;
		body.castShadow = true;
		body.receiveShadow = true;
		group.add(body);

		// Head
		const headGeometry = new THREE.SphereGeometry(0.15, 12, 10);
		const headMaterial = new THREE.MeshStandardMaterial({
			color: colors.body,
			roughness: 0.8,
			metalness: 0.0,
		});
		const head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.set(0, 0.55, 0.2);
		head.castShadow = true;
		group.add(head);

		// Beak
		const beakGeometry = new THREE.ConeGeometry(0.04, 0.1, 8);
		const beakMaterial = new THREE.MeshStandardMaterial({
			color: colors.beak,
			roughness: 0.6,
			metalness: 0.1,
		});
		const beak = new THREE.Mesh(beakGeometry, beakMaterial);
		beak.rotation.x = Math.PI / 2;
		beak.position.set(0, 0.52, 0.35);
		group.add(beak);

		// Eyes
		const eyeGeometry = new THREE.SphereGeometry(0.025, 8, 8);
		const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
		const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
		leftEye.position.set(-0.07, 0.58, 0.3);
		group.add(leftEye);

		const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
		rightEye.position.set(0.07, 0.58, 0.3);
		group.add(rightEye);

		// Comb (larger for roosters)
		const combSize = isRooster ? 1.5 : 1;
		const combGeometry = new THREE.BoxGeometry(0.03 * combSize, 0.12 * combSize, 0.1 * combSize);
		const combMaterial = new THREE.MeshStandardMaterial({
			color: colors.comb,
			roughness: 0.7,
			metalness: 0.0,
		});
		const comb = new THREE.Mesh(combGeometry, combMaterial);
		comb.position.set(0, 0.72, 0.18);
		group.add(comb);

		// Wattle
		const wattleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
		const wattleMaterial = new THREE.MeshStandardMaterial({
			color: colors.comb,
			roughness: 0.7,
			metalness: 0.0,
		});
		const wattle = new THREE.Mesh(wattleGeometry, wattleMaterial);
		wattle.position.set(0, 0.45, 0.3);
		wattle.scale.y = 1.5;
		group.add(wattle);

		// Wings
		const wingGeometry = new THREE.SphereGeometry(0.15, 8, 6);
		wingGeometry.scale(0.5, 0.8, 1);
		const wingMaterial = new THREE.MeshStandardMaterial({
			color: colors.accent,
			roughness: 0.8,
			metalness: 0.0,
		});

		const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
		leftWing.position.set(-0.25, 0.35, 0);
		leftWing.rotation.z = 0.3;
		leftWing.castShadow = true;
		group.add(leftWing);

		const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
		rightWing.position.set(0.25, 0.35, 0);
		rightWing.rotation.z = -0.3;
		rightWing.castShadow = true;
		group.add(rightWing);

		// Tail feathers (larger for roosters)
		const tailSize = isRooster ? 1.5 : 1;
		const tailGroup = new THREE.Group();
		tailGroup.position.set(0, 0.4, -0.3);
		tailGroup.rotation.x = -0.5;

		for (let i = 0; i < (isRooster ? 5 : 3); i++) {
			const featherGeometry = new THREE.ConeGeometry(0.03, 0.2 * tailSize, 8);
			const featherMaterial = new THREE.MeshStandardMaterial({
				color: isRooster && i % 2 === 0 ? 0x006400 : colors.accent,
				roughness: 0.7,
				metalness: 0.1,
			});
			const feather = new THREE.Mesh(featherGeometry, featherMaterial);
			feather.position.x = (i - (isRooster ? 2 : 1)) * 0.05;
			feather.rotation.x = -0.3 + Math.random() * 0.2;
			feather.rotation.z = (i - (isRooster ? 2 : 1)) * 0.1;
			tailGroup.add(feather);
		}
		group.add(tailGroup);

		// Legs
		const legGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 6);
		const legMaterial = new THREE.MeshStandardMaterial({
			color: colors.beak,
			roughness: 0.6,
			metalness: 0.1,
		});

		const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
		leftLeg.position.set(-0.08, 0.075, 0);
		group.add(leftLeg);

		const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
		rightLeg.position.set(0.08, 0.075, 0);
		group.add(rightLeg);

		// Feet
		const footGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.1);
		const footMaterial = new THREE.MeshStandardMaterial({
			color: colors.beak,
			roughness: 0.6,
			metalness: 0.1,
		});

		const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
		leftFoot.position.set(-0.08, 0.01, 0.02);
		group.add(leftFoot);

		const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
		rightFoot.position.set(0.08, 0.01, 0.02);
		group.add(rightFoot);

		// Store chicken for animation
		const chickenGroup: ChickenGroup = {
			group,
			head,
			leftWing,
			rightWing,
			tailGroup,
			leftLeg,
			rightLeg,
			isRooster,
			state: 'idle',
			stateTime: 0,
			targetPosition: options.position.clone(),
			walkSpeed: 0.5 + Math.random() * 0.3,
			animationPhase: Math.random() * Math.PI * 2,
		};
		this.chickens.set(id, chickenGroup);
		this.scene.add(group);

		return group;
	}

	/**
	 * Remove a chicken.
	 */
	public removeChicken(id: string): void {
		const chicken = this.chickens.get(id);
		if (chicken) {
			this.scene.remove(chicken.group);
			chicken.group.traverse((object) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					if (Array.isArray(object.material)) {
						object.material.forEach(m => m.dispose());
					} else {
						object.material.dispose();
					}
				}
			});
			this.chickens.delete(id);
		}
	}

	/**
	 * Set chicken wandering behavior.
	 */
	public setWandering(id: string, centerX: number, centerZ: number, radius: number): void {
		const chicken = this.chickens.get(id);
		if (!chicken) return;

		// Set random target within radius
		const angle = Math.random() * Math.PI * 2;
		const distance = Math.random() * radius;
		chicken.targetPosition.set(
			centerX + Math.cos(angle) * distance,
			chicken.group.position.y,
			centerZ + Math.sin(angle) * distance,
		);
		chicken.state = 'walking';
	}

	/**
	 * Play pecking animation.
	 */
	public playPeckAnimation(id: string): void {
		const chicken = this.chickens.get(id);
		if (chicken) {
			chicken.state = 'pecking';
			chicken.stateTime = 0;
		}
	}

	/**
	 * Play flapping animation.
	 */
	public playFlapAnimation(id: string): void {
		const chicken = this.chickens.get(id);
		if (chicken) {
			chicken.state = 'flapping';
			chicken.stateTime = 0;
		}
	}

	/**
	 * Update animations for all chickens.
	 */
	public update(): void {
		const delta = this.clock.getDelta();
		const elapsed = this.clock.getElapsedTime();

		for (const chicken of this.chickens.values()) {
			chicken.stateTime += delta;
			const phase = chicken.animationPhase;

			switch (chicken.state) {
				case 'idle':
					// Gentle head bobbing
					chicken.head.rotation.x = Math.sin(elapsed * 2 + phase) * 0.1;
					chicken.head.rotation.y = Math.sin(elapsed * 1.5 + phase) * 0.1;

					// Occasional wing adjustment
					chicken.leftWing.rotation.z = 0.3 + Math.sin(elapsed * 0.5 + phase) * 0.05;
					chicken.rightWing.rotation.z = -0.3 - Math.sin(elapsed * 0.5 + phase) * 0.05;

					// Random state change
					if (Math.random() < 0.005) {
						chicken.state = Math.random() < 0.7 ? 'pecking' : 'flapping';
						chicken.stateTime = 0;
					}
					break;

				case 'walking':
					// Walking animation
					const walkCycle = elapsed * 8;
					chicken.leftLeg.rotation.x = Math.sin(walkCycle) * 0.3;
					chicken.rightLeg.rotation.x = Math.sin(walkCycle + Math.PI) * 0.3;
					chicken.head.position.y = 0.55 + Math.abs(Math.sin(walkCycle * 2)) * 0.02;
					chicken.head.rotation.x = -0.1 + Math.sin(walkCycle * 2) * 0.05;

					// Body bobbing
					chicken.group.position.y = Math.abs(Math.sin(walkCycle * 2)) * 0.02;

					// Move towards target
					const direction = new THREE.Vector3()
						.subVectors(chicken.targetPosition, chicken.group.position)
						.normalize();
					const distanceToTarget = chicken.group.position.distanceTo(chicken.targetPosition);

					if (distanceToTarget > 0.1) {
						chicken.group.position.x += direction.x * chicken.walkSpeed * delta;
						chicken.group.position.z += direction.z * chicken.walkSpeed * delta;

						// Face walking direction
						chicken.group.rotation.y = Math.atan2(direction.x, direction.z);
					} else {
						chicken.state = 'idle';
						chicken.leftLeg.rotation.x = 0;
						chicken.rightLeg.rotation.x = 0;
					}
					break;

				case 'pecking':
					// Pecking animation
					if (chicken.stateTime < 0.3) {
						chicken.head.rotation.x = -Math.sin(chicken.stateTime * Math.PI / 0.3) * 0.8;
						chicken.head.position.y = 0.55 - Math.sin(chicken.stateTime * Math.PI / 0.3) * 0.1;
					} else if (chicken.stateTime < 0.6) {
						chicken.head.rotation.x = -Math.sin((0.6 - chicken.stateTime) * Math.PI / 0.3) * 0.8;
						chicken.head.position.y = 0.55 - Math.sin((0.6 - chicken.stateTime) * Math.PI / 0.3) * 0.1;
					} else {
						chicken.state = 'idle';
						chicken.head.rotation.x = 0;
						chicken.head.position.y = 0.55;
					}
					break;

				case 'flapping':
					// Wing flapping animation
					if (chicken.stateTime < 1) {
						const flapSpeed = 15;
						chicken.leftWing.rotation.z = 0.3 + Math.sin(chicken.stateTime * flapSpeed) * 0.8;
						chicken.rightWing.rotation.z = -0.3 - Math.sin(chicken.stateTime * flapSpeed) * 0.8;
						chicken.group.position.y = Math.sin(chicken.stateTime * flapSpeed * 0.5) * 0.05;
					} else {
						chicken.state = 'idle';
						chicken.leftWing.rotation.z = 0.3;
						chicken.rightWing.rotation.z = -0.3;
						chicken.group.position.y = 0;
					}
					break;
			}

			// Tail animation
			chicken.tailGroup.rotation.y = Math.sin(elapsed * 1.2 + phase) * 0.1;
		}
	}

	/**
	 * Clean up all chickens.
	 */
	public dispose(): void {
		for (const id of this.chickens.keys()) {
			this.removeChicken(id);
		}
		this.chickens.clear();
	}

	/**
	 * Get a chicken by ID.
	 */
	public getChicken(id: string): THREE.Group | undefined {
		return this.chickens.get(id)?.group;
	}

	/**
	 * Get all chicken IDs.
	 */
	public getAllChickenIds(): string[] {
		return Array.from(this.chickens.keys());
	}
}

interface ChickenGroup {
	group: THREE.Group;
	head: THREE.Mesh;
	leftWing: THREE.Mesh;
	rightWing: THREE.Mesh;
	tailGroup: THREE.Group;
	leftLeg: THREE.Mesh;
	rightLeg: THREE.Mesh;
	isRooster: boolean;
	state: 'idle' | 'walking' | 'pecking' | 'flapping';
	stateTime: number;
	targetPosition: THREE.Vector3;
	walkSpeed: number;
	animationPhase: number;
}
