/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export interface GachaMachineOptions {
	position: THREE.Vector3;
	type?: 'standard' | 'premium' | 'limited' | 'event';
	isActive?: boolean;
}

// Color schemes for different gacha types
const GACHA_COLORS = {
	standard: {
		body: 0x4a90d9,
		accent: 0x357abd,
		glass: 0x8ec8f8,
	},
	premium: {
		body: 0x9c27b0,
		accent: 0x7b1fa2,
		glass: 0xce93d8,
	},
	limited: {
		body: 0xff9800,
		accent: 0xf57c00,
		glass: 0xffcc80,
	},
	event: {
		body: 0xf44336,
		accent: 0xd32f2f,
		glass: 0xef9a9a,
	},
};

/**
 * Gacha machine renderer for Noctown.
 * Creates 3D gacha machine objects with animation.
 */
export class GachaRenderer {
	private scene: THREE.Scene;
	private machines: Map<string, GachaMachineGroup> = new Map();
	private clock: THREE.Clock;

	constructor(scene: THREE.Scene) {
		this.scene = scene;
		this.clock = new THREE.Clock();
	}

	/**
	 * Create a gacha machine at the specified position.
	 */
	public createMachine(id: string, options: GachaMachineOptions): THREE.Group {
		const type = options.type ?? 'standard';
		const colors = GACHA_COLORS[type];

		const group = new THREE.Group();
		group.position.copy(options.position);

		// Machine body
		const bodyGeometry = new THREE.BoxGeometry(1.2, 2, 1.2);
		const bodyMaterial = new THREE.MeshStandardMaterial({
			color: colors.body,
			roughness: 0.3,
			metalness: 0.6,
		});
		const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.y = 1;
		body.castShadow = true;
		body.receiveShadow = true;
		group.add(body);

		// Glass dome (capsule container)
		const domeGeometry = new THREE.SphereGeometry(0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
		const domeMaterial = new THREE.MeshStandardMaterial({
			color: colors.glass,
			transparent: true,
			opacity: 0.4,
			roughness: 0.1,
			metalness: 0.2,
		});
		const dome = new THREE.Mesh(domeGeometry, domeMaterial);
		dome.position.y = 2.0;
		dome.castShadow = true;
		group.add(dome);

		// Capsules inside dome (decorative)
		const capsuleGroup = new THREE.Group();
		capsuleGroup.position.y = 2.0;
		const capsuleColors = [0xff6b6b, 0x6bff6b, 0x6b6bff, 0xffff6b, 0xff6bff];
		for (let i = 0; i < 8; i++) {
			const capsuleGeometry = new THREE.SphereGeometry(0.08, 16, 16);
			const capsuleMaterial = new THREE.MeshStandardMaterial({
				color: capsuleColors[i % capsuleColors.length],
				roughness: 0.5,
				metalness: 0.3,
			});
			const capsule = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
			capsule.position.set(
				(Math.random() - 0.5) * 0.5,
				(Math.random() - 0.5) * 0.3 + 0.1,
				(Math.random() - 0.5) * 0.5,
			);
			capsuleGroup.add(capsule);
		}
		group.add(capsuleGroup);

		// Turn handle
		const handleGroup = new THREE.Group();
		handleGroup.position.set(0.65, 0.8, 0);

		const handleBaseGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16);
		const handleMaterial = new THREE.MeshStandardMaterial({
			color: colors.accent,
			roughness: 0.4,
			metalness: 0.7,
		});
		const handleBase = new THREE.Mesh(handleBaseGeometry, handleMaterial);
		handleBase.rotation.z = Math.PI / 2;
		handleGroup.add(handleBase);

		const handleKnobGeometry = new THREE.SphereGeometry(0.1, 16, 16);
		const handleKnob = new THREE.Mesh(handleKnobGeometry, handleMaterial);
		handleKnob.position.x = 0.2;
		handleGroup.add(handleKnob);

		group.add(handleGroup);

		// Dispensing slot
		const slotGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.15);
		const slotMaterial = new THREE.MeshStandardMaterial({
			color: 0x333333,
			roughness: 0.8,
			metalness: 0.1,
		});
		const slot = new THREE.Mesh(slotGeometry, slotMaterial);
		slot.position.set(0, 0.2, 0.53);
		group.add(slot);

		// Base platform
		const baseGeometry = new THREE.CylinderGeometry(0.7, 0.8, 0.15, 32);
		const baseMaterial = new THREE.MeshStandardMaterial({
			color: colors.accent,
			roughness: 0.5,
			metalness: 0.5,
		});
		const base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.y = 0.075;
		base.castShadow = true;
		base.receiveShadow = true;
		group.add(base);

		// Add glow for active machines
		if (options.isActive !== false) {
			const glowGeometry = new THREE.RingGeometry(0.7, 0.85, 32);
			const glowMaterial = new THREE.MeshBasicMaterial({
				color: colors.glass,
				transparent: true,
				opacity: 0.6,
				side: THREE.DoubleSide,
			});
			const glow = new THREE.Mesh(glowGeometry, glowMaterial);
			glow.rotation.x = -Math.PI / 2;
			glow.position.y = 0.01;
			group.add(glow);
		}

		// Store machine for animation
		const machineGroup: GachaMachineGroup = {
			group,
			capsuleGroup,
			handleGroup,
			type,
			isAnimating: false,
			animationTime: 0,
		};
		this.machines.set(id, machineGroup);
		this.scene.add(group);

		return group;
	}

	/**
	 * Remove a gacha machine.
	 */
	public removeMachine(id: string): void {
		const machine = this.machines.get(id);
		if (machine) {
			this.scene.remove(machine.group);
			machine.group.traverse((object) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
					if (Array.isArray(object.material)) {
						object.material.forEach(m => m.dispose());
					} else {
						object.material.dispose();
					}
				}
			});
			this.machines.delete(id);
		}
	}

	/**
	 * Start pull animation for a machine.
	 */
	public startPullAnimation(id: string): Promise<void> {
		return new Promise((resolve) => {
			const machine = this.machines.get(id);
			if (!machine) {
				resolve();
				return;
			}

			machine.isAnimating = true;
			machine.animationTime = 0;
			machine.animationCallback = resolve;
		});
	}

	/**
	 * Update animations for all machines.
	 */
	public update(): void {
		const delta = this.clock.getDelta();

		for (const machine of this.machines.values()) {
			// Idle bobbing animation for capsules
			if (machine.capsuleGroup) {
				machine.capsuleGroup.children.forEach((capsule, i) => {
					const time = this.clock.getElapsedTime() + i * 0.5;
					capsule.position.y = (Math.random() - 0.5) * 0.3 + 0.1 + Math.sin(time * 2) * 0.02;
				});
			}

			// Pull animation
			if (machine.isAnimating && machine.handleGroup) {
				machine.animationTime += delta;

				// Handle rotation animation (0-1s)
				if (machine.animationTime < 1) {
					const progress = machine.animationTime;
					machine.handleGroup.rotation.x = Math.sin(progress * Math.PI * 4) * 0.5;
				} else if (machine.animationTime < 1.5) { // Shake animation (1-1.5s)
					const progress = (machine.animationTime - 1) * 2;
					machine.group.position.x += Math.sin(progress * Math.PI * 20) * 0.01;
					machine.group.rotation.y = Math.sin(progress * Math.PI * 10) * 0.02;
				} else if (machine.animationTime < 2) { // Capsule drop animation (1.5-2s)
					machine.group.position.x = 0;
					machine.group.rotation.y = 0;
				} else { // Animation complete
					machine.isAnimating = false;
					machine.animationTime = 0;
					machine.handleGroup.rotation.x = 0;
					machine.group.position.x = 0;
					machine.group.rotation.y = 0;

					if (machine.animationCallback) {
						machine.animationCallback();
						machine.animationCallback = undefined;
					}
				}
			}
		}
	}

	/**
	 * Clean up all machines.
	 */
	public dispose(): void {
		for (const id of this.machines.keys()) {
			this.removeMachine(id);
		}
		this.machines.clear();
	}

	/**
	 * Get a machine by ID.
	 */
	public getMachine(id: string): THREE.Group | undefined {
		return this.machines.get(id)?.group;
	}
}

interface GachaMachineGroup {
	group: THREE.Group;
	capsuleGroup: THREE.Group;
	handleGroup: THREE.Group;
	type: string;
	isAnimating: boolean;
	animationTime: number;
	animationCallback?: () => void;
}
