/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as THREE from 'three';

export type AnimationState = 'idle' | 'walking' | 'running' | 'jumping';

export interface AnimationConfig {
	walkSpeed: number;
	runSpeed: number;
	bobAmplitude: number;
	bobFrequency: number;
	tiltAngle: number;
	armSwingAngle: number;
}

const DEFAULT_CONFIG: AnimationConfig = {
	walkSpeed: 0.15,
	runSpeed: 0.3,
	bobAmplitude: 0.1,
	bobFrequency: 8,
	tiltAngle: 0.05,
	armSwingAngle: 0.3,
};

export class CharacterAnimation {
	private mesh: THREE.Object3D;
	private state: AnimationState = 'idle';
	private animationTime = 0;
	private config: AnimationConfig;

	// Original positions for reset
	private originalY: number;

	// Body parts (if available)
	private body: THREE.Object3D | null = null;
	private leftArm: THREE.Object3D | null = null;
	private rightArm: THREE.Object3D | null = null;
	private leftLeg: THREE.Object3D | null = null;
	private rightLeg: THREE.Object3D | null = null;

	constructor(mesh: THREE.Object3D, config: Partial<AnimationConfig> = {}) {
		this.mesh = mesh;
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.originalY = mesh.position.y;

		// Try to find body parts
		this.findBodyParts();
	}

	private findBodyParts(): void {
		// Look for named children
		this.mesh.traverse((child) => {
			const name = child.name.toLowerCase();
			if (name.includes('body')) this.body = child;
			if (name.includes('leftarm') || name.includes('arm_l')) this.leftArm = child;
			if (name.includes('rightarm') || name.includes('arm_r')) this.rightArm = child;
			if (name.includes('leftleg') || name.includes('leg_l')) this.leftLeg = child;
			if (name.includes('rightleg') || name.includes('leg_r')) this.rightLeg = child;
		});
	}

	public setState(state: AnimationState): void {
		if (this.state !== state) {
			this.state = state;
			if (state === 'idle') {
				this.resetPose();
			}
		}
	}

	public getState(): AnimationState {
		return this.state;
	}

	public update(deltaTime: number, isMoving: boolean, isRunning: boolean = false): void {
		// Determine state from movement
		if (isMoving) {
			this.state = isRunning ? 'running' : 'walking';
		} else if (this.state !== 'jumping') {
			this.state = 'idle';
		}

		// Update animation time
		const speed = this.state === 'running' ? this.config.runSpeed * 2 : this.config.walkSpeed;
		this.animationTime += deltaTime * this.config.bobFrequency * (isMoving ? 1 : 0);

		switch (this.state) {
			case 'walking':
				this.animateWalking(false);
				break;
			case 'running':
				this.animateWalking(true);
				break;
			case 'jumping':
				// Jump animation handled separately
				break;
			case 'idle':
			default:
				this.animateIdle(deltaTime);
				break;
		}
	}

	private animateWalking(isRunning: boolean): void {
		const t = this.animationTime;
		const amplitude = isRunning ? this.config.bobAmplitude * 1.5 : this.config.bobAmplitude;
		const armSwing = isRunning ? this.config.armSwingAngle * 1.5 : this.config.armSwingAngle;

		// Vertical bobbing
		const bob = Math.abs(Math.sin(t)) * amplitude;
		this.mesh.position.y = this.originalY + bob;

		// Slight forward tilt when running
		if (isRunning) {
			this.mesh.rotation.x = this.config.tiltAngle;
		} else {
			this.mesh.rotation.x = 0;
		}

		// Arm swing animation
		if (this.leftArm && this.rightArm) {
			this.leftArm.rotation.x = Math.sin(t) * armSwing;
			this.rightArm.rotation.x = -Math.sin(t) * armSwing;
		}

		// Leg animation
		if (this.leftLeg && this.rightLeg) {
			const legSwing = armSwing * 0.7;
			this.leftLeg.rotation.x = -Math.sin(t) * legSwing;
			this.rightLeg.rotation.x = Math.sin(t) * legSwing;
		}

		// If no body parts found, apply simple body animation
		if (!this.leftArm && !this.rightArm) {
			// Simple squash and stretch
			const squash = 1 + Math.sin(t * 2) * 0.02;
			this.mesh.scale.y = squash;
			this.mesh.scale.x = 1 / Math.sqrt(squash);
			this.mesh.scale.z = 1 / Math.sqrt(squash);
		}
	}

	private animateIdle(deltaTime: number): void {
		// Subtle breathing animation
		this.animationTime += deltaTime * 2;
		const breathe = Math.sin(this.animationTime) * 0.01;

		this.mesh.position.y = this.originalY + breathe;

		// Reset rotation
		this.mesh.rotation.x = 0;

		// Subtle scale breathing
		const scale = 1 + breathe;
		this.mesh.scale.set(scale, scale, scale);
	}

	public startJump(height: number = 1, duration: number = 0.5): Promise<void> {
		return new Promise((resolve) => {
			this.state = 'jumping';
			const startY = this.mesh.position.y;
			const startTime = performance.now();

			const animate = (): void => {
				const elapsed = (performance.now() - startTime) / 1000;
				const progress = Math.min(elapsed / duration, 1);

				// Parabolic jump curve
				const jumpHeight = height * 4 * progress * (1 - progress);
				this.mesh.position.y = startY + jumpHeight;

				// Squash at start and end, stretch at peak
				const stretch = 1 + (jumpHeight / height) * 0.1;
				this.mesh.scale.y = stretch;
				this.mesh.scale.x = 1 / Math.sqrt(stretch);
				this.mesh.scale.z = 1 / Math.sqrt(stretch);

				if (progress < 1) {
					requestAnimationFrame(animate);
				} else {
					this.mesh.position.y = startY;
					this.resetPose();
					this.state = 'idle';
					resolve();
				}
			};

			requestAnimationFrame(animate);
		});
	}

	private resetPose(): void {
		this.mesh.position.y = this.originalY;
		this.mesh.rotation.x = 0;
		this.mesh.scale.set(1, 1, 1);

		if (this.leftArm) this.leftArm.rotation.x = 0;
		if (this.rightArm) this.rightArm.rotation.x = 0;
		if (this.leftLeg) this.leftLeg.rotation.x = 0;
		if (this.rightLeg) this.rightLeg.rotation.x = 0;
	}

	public setOriginalY(y: number): void {
		this.originalY = y;
	}

	public dispose(): void {
		this.resetPose();
	}
}

// Animation manager for multiple characters
export class AnimationManager {
	private animations: Map<string, CharacterAnimation> = new Map();

	public register(id: string, mesh: THREE.Object3D, config?: Partial<AnimationConfig>): CharacterAnimation {
		const animation = new CharacterAnimation(mesh, config);
		this.animations.set(id, animation);
		return animation;
	}

	public get(id: string): CharacterAnimation | undefined {
		return this.animations.get(id);
	}

	public remove(id: string): void {
		const animation = this.animations.get(id);
		if (animation) {
			animation.dispose();
			this.animations.delete(id);
		}
	}

	public updateAll(deltaTime: number, movingIds: Set<string>, runningIds: Set<string> = new Set()): void {
		for (const [id, animation] of this.animations) {
			const isMoving = movingIds.has(id);
			const isRunning = runningIds.has(id);
			animation.update(deltaTime, isMoving, isRunning);
		}
	}

	public dispose(): void {
		for (const animation of this.animations.values()) {
			animation.dispose();
		}
		this.animations.clear();
	}
}
