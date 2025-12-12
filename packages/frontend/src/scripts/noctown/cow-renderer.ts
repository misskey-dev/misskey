/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export interface CowOptions {
	position: THREE.Vector3;
	color?: CowColor;
	size?: number;
}

export type CowColor = 'holsteinBW' | 'holsteinRW' | 'jersey' | 'angus' | 'highland';

// Cow color configurations
const COW_COLORS: Record<CowColor, { body: number; spots?: number; horns: number; nose: number }> = {
	holsteinBW: { body: 0xffffff, spots: 0x1a1a1a, horns: 0xf5f5dc, nose: 0xffb6c1 },
	holsteinRW: { body: 0xffffff, spots: 0x8b4513, horns: 0xf5f5dc, nose: 0xffb6c1 },
	jersey: { body: 0xd2691e, horns: 0xf5f5dc, nose: 0x1a1a1a },
	angus: { body: 0x1a1a1a, horns: 0x2f2f2f, nose: 0x2f2f2f },
	highland: { body: 0x8b4513, horns: 0xdeb887, nose: 0x1a1a1a },
};

/**
 * Cow renderer for Noctown.
 * Creates 3D cow models with animations.
 */
export class CowRenderer {
	private scene: THREE.Scene;
	private cows: Map<string, CowGroup> = new Map();
	private clock: THREE.Clock;

	constructor(scene: THREE.Scene) {
		this.scene = scene;
		this.clock = new THREE.Clock();
	}

	/**
	 * Create a cow at the specified position.
	 */
	public createCow(id: string, options: CowOptions): THREE.Group {
		const color = options.color ?? 'holsteinBW';
		const size = options.size ?? 1;
		const colors = COW_COLORS[color];

		const group = new THREE.Group();
		group.position.copy(options.position);
		group.scale.setScalar(size);

		// Body
		const bodyGeometry = new THREE.BoxGeometry(0.9, 0.6, 0.5);
		const bodyMaterial = new THREE.MeshStandardMaterial({
			color: colors.body,
			roughness: 0.8,
			metalness: 0.0,
		});
		const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.y = 0.6;
		body.castShadow = true;
		body.receiveShadow = true;
		group.add(body);

		// Spots (for Holstein cows)
		const spotsGroup = new THREE.Group();
		if (colors.spots) {
			const spotMaterial = new THREE.MeshStandardMaterial({
				color: colors.spots,
				roughness: 0.8,
				metalness: 0.0,
			});

			// Random spots on body
			for (let i = 0; i < 6; i++) {
				const spotGeometry = new THREE.SphereGeometry(0.08 + Math.random() * 0.1, 8, 8);
				spotGeometry.scale(1 + Math.random() * 0.5, 0.3, 1 + Math.random() * 0.5);
				const spot = new THREE.Mesh(spotGeometry, spotMaterial);
				spot.position.set(
					(Math.random() - 0.5) * 0.7,
					0.6 + (Math.random() - 0.5) * 0.2,
					(Math.random() - 0.5) * 0.3,
				);
				spot.position.y += body.position.y - 0.6;
				spotsGroup.add(spot);
			}
		}
		group.add(spotsGroup);

		// Head
		const headGeometry = new THREE.BoxGeometry(0.35, 0.3, 0.3);
		const headMaterial = new THREE.MeshStandardMaterial({
			color: colors.body,
			roughness: 0.8,
			metalness: 0.0,
		});
		const head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.set(0.55, 0.75, 0);
		head.castShadow = true;
		group.add(head);

		// Snout/Muzzle
		const snoutGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.2);
		const snoutMaterial = new THREE.MeshStandardMaterial({
			color: colors.nose,
			roughness: 0.9,
			metalness: 0.0,
		});
		const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
		snout.position.set(0.75, 0.68, 0);
		group.add(snout);

		// Nostrils
		const nostrilGeometry = new THREE.SphereGeometry(0.02, 8, 8);
		const nostrilMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });

		const leftNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
		leftNostril.position.set(0.83, 0.68, -0.04);
		group.add(leftNostril);

		const rightNostril = new THREE.Mesh(nostrilGeometry, nostrilMaterial);
		rightNostril.position.set(0.83, 0.68, 0.04);
		group.add(rightNostril);

		// Eyes
		const eyeGeometry = new THREE.SphereGeometry(0.04, 8, 8);
		const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x2f2f2f });

		const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
		leftEye.position.set(0.65, 0.82, -0.12);
		group.add(leftEye);

		const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
		rightEye.position.set(0.65, 0.82, 0.12);
		group.add(rightEye);

		// Ears
		const earGeometry = new THREE.ConeGeometry(0.06, 0.12, 8);
		earGeometry.rotateZ(Math.PI / 2);
		const earMaterial = new THREE.MeshStandardMaterial({
			color: colors.body,
			roughness: 0.8,
			metalness: 0.0,
		});

		const leftEar = new THREE.Mesh(earGeometry, earMaterial);
		leftEar.position.set(0.45, 0.88, -0.12);
		leftEar.rotation.y = -0.3;
		group.add(leftEar);

		const rightEar = new THREE.Mesh(earGeometry, earMaterial);
		rightEar.position.set(0.45, 0.88, 0.12);
		rightEar.rotation.y = 0.3;
		group.add(rightEar);

		// Horns
		const hornGeometry = new THREE.ConeGeometry(0.03, 0.15, 8);
		const hornMaterial = new THREE.MeshStandardMaterial({
			color: colors.horns,
			roughness: 0.5,
			metalness: 0.1,
		});

		const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
		leftHorn.position.set(0.48, 0.92, -0.08);
		leftHorn.rotation.z = 0.3;
		leftHorn.rotation.x = -0.2;
		group.add(leftHorn);

		const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
		rightHorn.position.set(0.48, 0.92, 0.08);
		rightHorn.rotation.z = 0.3;
		rightHorn.rotation.x = 0.2;
		group.add(rightHorn);

		// Legs
		const legGeometry = new THREE.CylinderGeometry(0.05, 0.06, 0.35, 8);
		const legMaterial = new THREE.MeshStandardMaterial({
			color: colors.body,
			roughness: 0.8,
			metalness: 0.0,
		});

		const legPositions = [
			{ x: 0.3, z: -0.15 },
			{ x: 0.3, z: 0.15 },
			{ x: -0.3, z: -0.15 },
			{ x: -0.3, z: 0.15 },
		];

		const legs: THREE.Mesh[] = [];
		for (const pos of legPositions) {
			const leg = new THREE.Mesh(legGeometry, legMaterial);
			leg.position.set(pos.x, 0.175, pos.z);
			leg.castShadow = true;
			group.add(leg);
			legs.push(leg);
		}

		// Hooves
		const hoofGeometry = new THREE.CylinderGeometry(0.06, 0.07, 0.05, 8);
		const hoofMaterial = new THREE.MeshStandardMaterial({
			color: 0x2f2f2f,
			roughness: 0.6,
			metalness: 0.1,
		});

		for (const pos of legPositions) {
			const hoof = new THREE.Mesh(hoofGeometry, hoofMaterial);
			hoof.position.set(pos.x, 0.025, pos.z);
			group.add(hoof);
		}

		// Tail
		const tailGroup = new THREE.Group();
		tailGroup.position.set(-0.45, 0.55, 0);

		const tailGeometry = new THREE.CylinderGeometry(0.02, 0.01, 0.3, 8);
		const tail = new THREE.Mesh(tailGeometry, legMaterial);
		tail.rotation.x = -0.3;
		tail.position.y = -0.15;
		tailGroup.add(tail);

		// Tail tuft
		const tuftGeometry = new THREE.SphereGeometry(0.04, 8, 8);
		const tuft = new THREE.Mesh(tuftGeometry, new THREE.MeshStandardMaterial({
			color: colors.spots ?? colors.body,
			roughness: 0.9,
		}));
		tuft.position.set(0, -0.3, 0);
		tailGroup.add(tuft);

		group.add(tailGroup);

		// Udder (for female cows - default)
		const udderGeometry = new THREE.SphereGeometry(0.1, 12, 12);
		const udderMaterial = new THREE.MeshStandardMaterial({
			color: 0xffb6c1,
			roughness: 0.8,
			metalness: 0.0,
		});
		const udder = new THREE.Mesh(udderGeometry, udderMaterial);
		udder.position.set(-0.1, 0.35, 0);
		udder.scale.set(1.2, 0.8, 0.8);
		group.add(udder);

		// Store cow for animation
		const cowGroup: CowGroup = {
			group,
			head,
			legs,
			tailGroup,
			spotsGroup,
			state: 'idle',
			stateTime: 0,
			targetPosition: options.position.clone(),
			walkSpeed: 0.3 + Math.random() * 0.2,
			animationPhase: Math.random() * Math.PI * 2,
		};
		this.cows.set(id, cowGroup);
		this.scene.add(group);

		return group;
	}

	/**
	 * Remove a cow.
	 */
	public removeCow(id: string): void {
		const cow = this.cows.get(id);
		if (cow) {
			this.scene.remove(cow.group);
			cow.group.traverse((object) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					if (Array.isArray(object.material)) {
						object.material.forEach(m => m.dispose());
					} else {
						object.material.dispose();
					}
				}
			});
			this.cows.delete(id);
		}
	}

	/**
	 * Set cow wandering behavior.
	 */
	public setWandering(id: string, centerX: number, centerZ: number, radius: number): void {
		const cow = this.cows.get(id);
		if (!cow) return;

		const angle = Math.random() * Math.PI * 2;
		const distance = Math.random() * radius;
		cow.targetPosition.set(
			centerX + Math.cos(angle) * distance,
			cow.group.position.y,
			centerZ + Math.sin(angle) * distance,
		);
		cow.state = 'walking';
	}

	/**
	 * Play grazing animation.
	 */
	public playGrazingAnimation(id: string): void {
		const cow = this.cows.get(id);
		if (cow) {
			cow.state = 'grazing';
			cow.stateTime = 0;
		}
	}

	/**
	 * Play moo animation (head raise).
	 */
	public playMooAnimation(id: string): void {
		const cow = this.cows.get(id);
		if (cow) {
			cow.state = 'mooing';
			cow.stateTime = 0;
		}
	}

	/**
	 * Update animations for all cows.
	 */
	public update(): void {
		const delta = this.clock.getDelta();
		const elapsed = this.clock.getElapsedTime();

		for (const cow of this.cows.values()) {
			cow.stateTime += delta;
			const phase = cow.animationPhase;

			// Tail swinging (always)
			cow.tailGroup.rotation.z = Math.sin(elapsed * 2 + phase) * 0.3;
			cow.tailGroup.rotation.x = -0.2 + Math.sin(elapsed * 1.5 + phase) * 0.1;

			switch (cow.state) {
				case 'idle':
					// Subtle breathing
					cow.group.scale.y = 1 + Math.sin(elapsed * 0.8 + phase) * 0.02;

					// Head movement
					cow.head.rotation.y = Math.sin(elapsed * 0.5 + phase) * 0.1;
					cow.head.position.y = 0.75 + Math.sin(elapsed * 0.6 + phase) * 0.02;

					// Random state change
					if (Math.random() < 0.003) {
						const rand = Math.random();
						if (rand < 0.4) {
							cow.state = 'grazing';
						} else if (rand < 0.5) {
							cow.state = 'mooing';
						}
						cow.stateTime = 0;
					}
					break;

				case 'walking':
					// Walking animation
					const walkCycle = elapsed * 4;

					// Leg animation
					cow.legs[0].rotation.x = Math.sin(walkCycle) * 0.3;
					cow.legs[1].rotation.x = Math.sin(walkCycle + Math.PI) * 0.3;
					cow.legs[2].rotation.x = Math.sin(walkCycle + Math.PI) * 0.3;
					cow.legs[3].rotation.x = Math.sin(walkCycle) * 0.3;

					// Body bobbing
					cow.group.position.y = Math.abs(Math.sin(walkCycle * 2)) * 0.02;

					// Head bobbing
					cow.head.position.y = 0.75 + Math.abs(Math.sin(walkCycle * 2)) * 0.03;

					// Move towards target
					const direction = new THREE.Vector3()
						.subVectors(cow.targetPosition, cow.group.position)
						.normalize();
					const distanceToTarget = cow.group.position.distanceTo(cow.targetPosition);

					if (distanceToTarget > 0.2) {
						cow.group.position.x += direction.x * cow.walkSpeed * delta;
						cow.group.position.z += direction.z * cow.walkSpeed * delta;

						// Face walking direction
						cow.group.rotation.y = Math.atan2(direction.x, direction.z);
					} else {
						cow.state = 'idle';
						cow.legs.forEach(leg => { leg.rotation.x = 0; });
					}
					break;

				case 'grazing':
					// Head down, eating grass
					if (cow.stateTime < 3) {
						const grazeProgress = Math.min(1, cow.stateTime * 2);
						cow.head.rotation.x = grazeProgress * 0.5;
						cow.head.position.y = 0.75 - grazeProgress * 0.15;
						cow.head.position.x = 0.55 + grazeProgress * 0.1;

						// Chewing motion
						if (cow.stateTime > 0.5) {
							cow.head.rotation.y = Math.sin(cow.stateTime * 6) * 0.05;
						}
					} else {
						cow.state = 'idle';
						cow.head.rotation.x = 0;
						cow.head.position.y = 0.75;
						cow.head.position.x = 0.55;
					}
					break;

				case 'mooing':
					// Head up, mooing
					if (cow.stateTime < 1.5) {
						if (cow.stateTime < 0.3) {
							cow.head.rotation.x = -cow.stateTime * 0.8;
							cow.head.position.y = 0.75 + cow.stateTime * 0.2;
						} else if (cow.stateTime < 1.2) {
							// Sustained moo
							cow.head.rotation.x = -0.25 + Math.sin(cow.stateTime * 10) * 0.05;
						} else {
							// Return to normal
							const returnProgress = (cow.stateTime - 1.2) / 0.3;
							cow.head.rotation.x = -0.25 * (1 - returnProgress);
							cow.head.position.y = 0.75 + 0.06 * (1 - returnProgress);
						}
					} else {
						cow.state = 'idle';
						cow.head.rotation.x = 0;
						cow.head.position.y = 0.75;
					}
					break;
			}
		}
	}

	/**
	 * Clean up all cows.
	 */
	public dispose(): void {
		for (const id of this.cows.keys()) {
			this.removeCow(id);
		}
		this.cows.clear();
	}

	/**
	 * Get a cow by ID.
	 */
	public getCow(id: string): THREE.Group | undefined {
		return this.cows.get(id)?.group;
	}

	/**
	 * Get all cow IDs.
	 */
	public getAllCowIds(): string[] {
		return Array.from(this.cows.keys());
	}
}

interface CowGroup {
	group: THREE.Group;
	head: THREE.Mesh;
	legs: THREE.Mesh[];
	tailGroup: THREE.Group;
	spotsGroup: THREE.Group;
	state: 'idle' | 'walking' | 'grazing' | 'mooing';
	stateTime: number;
	targetPosition: THREE.Vector3;
	walkSpeed: number;
	animationPhase: number;
}
